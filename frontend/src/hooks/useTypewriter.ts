"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTypewriterOptions {
  text: string;
  speed?: number; // ms per character
  enabled?: boolean;
}

export function useTypewriter({
  text,
  speed = 40,
  enabled = true,
}: UseTypewriterOptions) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textRef = useRef(text);
  const prevTextRef = useRef(text);

  // Track latest text in a ref for the interval callback
  textRef.current = text;

  // Reset synchronously during render when text changes
  if (prevTextRef.current !== text) {
    prevTextRef.current = text;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedCount(0);
  }

  const isComplete = displayedCount >= text.length;

  const clearTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const snapComplete = useCallback(() => {
    clearTyping();
    setDisplayedCount(textRef.current.length);
  }, [clearTyping]);

  // Start typing when text changes (triggered by displayedCount resetting to 0)
  useEffect(() => {
    if (!enabled || text.length === 0) {
      return;
    }

    // Only start a new interval if one isn't already running
    if (intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setDisplayedCount((prev) => {
        if (prev >= textRef.current.length) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return textRef.current.length;
        }
        return prev + 1;
      });
    }, speed);

    return clearTyping;
  }, [text, speed, enabled, clearTyping]);

  return {
    displayedText: text.slice(0, displayedCount),
    isComplete,
    snapComplete,
  };
}
