"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface AudioSegments {
  introEnd: number;      // seconds — end of intro segment
  middleStart: number;   // seconds — start of looping middle
  middleEnd: number;     // seconds — end of looping middle
  outroStart: number;    // seconds — start of ending segment
}

const DEFAULT_SEGMENTS: AudioSegments = {
  introEnd: 5,
  middleStart: 5,
  middleEnd: 55,
  outroStart: 155,
};

export function useAudio(segments: AudioSegments = DEFAULT_SEGMENTS) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const currentSegment = useRef<"intro" | "middle" | "outro" | "idle">("idle");
  const animFrameRef = useRef<number | null>(null);

  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sounds/weakest-link-theme.mp3");
    audio.preload = "auto";
    audio.addEventListener("canplaythrough", () => setIsLoaded(true));
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isUnlocked) return;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      setIsUnlocked(true);
    }).catch(() => {});
  }, [isUnlocked]);

  const stopMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const monitorPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const check = () => {
      if (currentSegment.current === "middle") {
        if (audio.currentTime >= segments.middleEnd) {
          audio.currentTime = segments.middleStart;
        }
      }
      animFrameRef.current = requestAnimationFrame(check);
    };
    animFrameRef.current = requestAnimationFrame(check);
  }, [segments]);

  const playIntro = useCallback(
    (onIntroEnd: () => void) => {
      const audio = audioRef.current;
      if (!audio || !isLoaded) {
        onIntroEnd();
        return;
      }

      stopMonitoring();
      currentSegment.current = "intro";
      audio.currentTime = 0;
      audio.muted = isMuted;
      audio.play().catch(() => {});

      const checkIntro = () => {
        if (!audio) return;
        if (audio.currentTime >= segments.introEnd) {
          // Transition to middle loop
          currentSegment.current = "middle";
          audio.currentTime = segments.middleStart;
          monitorPlayback();
          onIntroEnd();
          return;
        }
        animFrameRef.current = requestAnimationFrame(checkIntro);
      };
      animFrameRef.current = requestAnimationFrame(checkIntro);
    },
    [isLoaded, isMuted, segments, stopMonitoring, monitorPlayback]
  );

  const playOutro = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    stopMonitoring();
    currentSegment.current = "outro";
    audio.currentTime = segments.outroStart;
    audio.muted = isMuted;
    audio.play().catch(() => {});
  }, [segments, isMuted, stopMonitoring]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    stopMonitoring();
    currentSegment.current = "idle";
    audio.pause();
    audio.currentTime = 0;
  }, [stopMonitoring]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const restoreMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, []);

  return {
    playIntro,
    playOutro,
    stop,
    isMuted,
    toggleMute,
    isLoaded,
    isUnlocked,
    unlock,
    restoreMuted,
  };
}
