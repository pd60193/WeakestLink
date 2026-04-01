"use client";

import { useEffect } from "react";

interface KeyboardActions {
  onReveal: () => void;
  onCorrect: () => void;
  onIncorrect: () => void;
  onBank: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onStartTimer: () => void;
  onNextRound: () => void;
  onToggleMute?: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardActions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          actions.onReveal();
          break;
        case "c":
        case "C":
        case "ArrowRight":
          actions.onCorrect();
          break;
        case "x":
        case "X":
        case "ArrowLeft":
          actions.onIncorrect();
          break;
        case "b":
        case "B":
          actions.onBank();
          break;
        case "n":
        case "N":
          actions.onNext();
          break;
        case "p":
        case "P":
          actions.onTogglePause();
          break;
        case "t":
        case "T":
          actions.onStartTimer();
          break;
        case "Enter":
          actions.onNextRound();
          break;
        case "m":
        case "M":
          actions.onToggleMute?.();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
