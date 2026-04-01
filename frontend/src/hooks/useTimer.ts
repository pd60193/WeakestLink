"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseTimerOptions {
  initialSeconds: number;
  onComplete?: () => void;
}

export function useTimer({ initialSeconds, onComplete }: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setIsRunning(true);
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const startWithDelay = useCallback(
    (delayMs: number) => {
      clearTimer();
      setIsRunning(true);
      setIsPaused(false);
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        intervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              clearTimer();
              setIsRunning(false);
              onCompleteRef.current?.();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, delayMs);
    },
    [clearTimer]
  );

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      clearTimer();
      setIsPaused(true);
    }
  }, [isRunning, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isRunning, isPaused, clearTimer]);

  const togglePause = useCallback(() => {
    if (isPaused) resume();
    else pause();
  }, [isPaused, pause, resume]);

  const reset = useCallback(
    (newSeconds?: number) => {
      clearTimer();
      setTimeRemaining(newSeconds ?? initialSeconds);
      setIsRunning(false);
      setIsPaused(false);
    },
    [clearTimer, initialSeconds]
  );

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const restoreTime = useCallback((remaining: number) => {
    clearTimer();
    setTimeRemaining(remaining);
    setIsRunning(false);
    setIsPaused(false);
  }, [clearTimer]);

  return {
    timeRemaining,
    isRunning,
    isPaused,
    start,
    startWithDelay,
    pause,
    resume,
    togglePause,
    reset,
    restoreTime,
  };
}
