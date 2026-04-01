"use client";

import { useState, useCallback, useRef } from "react";
import { MONEY_CHAIN } from "@/lib/constants";

export interface RoundMetrics {
  questionsAnswered: number;
  bankedThisRound: number;
  highestChainPosition: number;
  highestChainValue: number;
  longestStreak: number;
  strongestLinks: string[]; // player name(s) with most correct answers
}

export function useRoundMetrics() {
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [highestChainPosition, setHighestChainPosition] = useState(1);
  const [longestStreak, setLongestStreak] = useState(0);
  const currentStreak = useRef(0);
  const playerCorrectCounts = useRef<Map<string, number>>(new Map());

  const recordCorrect = useCallback(
    (newChainPosition: number, playerName: string) => {
      setQuestionsAnswered((prev) => prev + 1);
      setHighestChainPosition((prev) => Math.max(prev, newChainPosition));

      // Track streak
      currentStreak.current += 1;
      setLongestStreak((prev) => Math.max(prev, currentStreak.current));

      // Track per-player correct counts
      const counts = playerCorrectCounts.current;
      counts.set(playerName, (counts.get(playerName) ?? 0) + 1);
    },
    []
  );

  const recordIncorrect = useCallback(() => {
    setQuestionsAnswered((prev) => prev + 1);
    currentStreak.current = 0;
  }, []);

  const reset = useCallback(() => {
    setQuestionsAnswered(0);
    setHighestChainPosition(1);
    setLongestStreak(0);
    currentStreak.current = 0;
    playerCorrectCounts.current.clear();
  }, []);

  const getMetrics = useCallback(
    (bankedThisRound: number): RoundMetrics => {
      const highestValue =
        MONEY_CHAIN[highestChainPosition - 1]?.value ?? 0;

      // Find player(s) with highest correct count
      const counts = playerCorrectCounts.current;
      let maxCorrect = 0;
      const strongestLinks: string[] = [];
      counts.forEach((count, name) => {
        if (count > maxCorrect) {
          maxCorrect = count;
          strongestLinks.length = 0;
          strongestLinks.push(name);
        } else if (count === maxCorrect && maxCorrect > 0) {
          strongestLinks.push(name);
        }
      });

      return {
        questionsAnswered,
        bankedThisRound,
        highestChainPosition,
        highestChainValue: highestValue,
        longestStreak,
        strongestLinks,
      };
    },
    [questionsAnswered, highestChainPosition, longestStreak]
  );

  const getCurrentStreak = useCallback(() => currentStreak.current, []);

  const getPlayerCorrectCounts = useCallback(
    () => Object.fromEntries(playerCorrectCounts.current),
    []
  );

  const restoreMetrics = useCallback(
    (saved: {
      questionsAnswered: number;
      highestChainPosition: number;
      longestStreak: number;
      currentStreak: number;
      playerCorrectCounts: Record<string, number>;
    }) => {
      setQuestionsAnswered(saved.questionsAnswered);
      setHighestChainPosition(saved.highestChainPosition);
      setLongestStreak(saved.longestStreak);
      currentStreak.current = saved.currentStreak;
      playerCorrectCounts.current = new Map(
        Object.entries(saved.playerCorrectCounts)
      );
    },
    []
  );

  return {
    recordCorrect,
    recordIncorrect,
    reset,
    getMetrics,
    getCurrentStreak,
    getPlayerCorrectCounts,
    restoreMetrics,
  };
}
