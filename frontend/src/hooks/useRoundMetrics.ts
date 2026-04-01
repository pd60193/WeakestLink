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
  const playerBankedCounts = useRef<Map<string, number>>(new Map());

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

  const recordBank = useCallback((amount: number, playerName: string) => {
    const counts = playerBankedCounts.current;
    counts.set(playerName, (counts.get(playerName) ?? 0) + amount);
  }, []);

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
    playerBankedCounts.current.clear();
  }, []);

  const getMetrics = useCallback(
    (bankedThisRound: number, playerOrder: string[] = []): RoundMetrics => {
      const highestValue =
        MONEY_CHAIN[highestChainPosition - 1]?.value ?? 0;

      // Find player(s) with highest correct count
      const correctCounts = playerCorrectCounts.current;
      const bankedCounts = playerBankedCounts.current;
      let maxCorrect = 0;
      const candidates: string[] = [];
      correctCounts.forEach((count, name) => {
        if (count > maxCorrect) {
          maxCorrect = count;
          candidates.length = 0;
          candidates.push(name);
        } else if (count === maxCorrect && maxCorrect > 0) {
          candidates.push(name);
        }
      });

      // Tiebreaker 1: highest amount banked
      let strongestLinks = candidates;
      if (strongestLinks.length > 1) {
        let maxBanked = 0;
        const bankedCandidates: string[] = [];
        for (const name of strongestLinks) {
          const banked = bankedCounts.get(name) ?? 0;
          if (banked > maxBanked) {
            maxBanked = banked;
            bankedCandidates.length = 0;
            bankedCandidates.push(name);
          } else if (banked === maxBanked) {
            bankedCandidates.push(name);
          }
        }
        strongestLinks = bankedCandidates;
      }

      // Tiebreaker 2: player who went first in the round (lowest index in playerOrder)
      if (strongestLinks.length > 1 && playerOrder.length > 0) {
        let earliestIndex = Infinity;
        let earliest = strongestLinks[0];
        for (const name of strongestLinks) {
          const idx = playerOrder.indexOf(name);
          if (idx !== -1 && idx < earliestIndex) {
            earliestIndex = idx;
            earliest = name;
          }
        }
        strongestLinks = [earliest];
      }

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

  const getPlayerBankedCounts = useCallback(
    () => Object.fromEntries(playerBankedCounts.current),
    []
  );

  const restoreMetrics = useCallback(
    (saved: {
      questionsAnswered: number;
      highestChainPosition: number;
      longestStreak: number;
      currentStreak: number;
      playerCorrectCounts: Record<string, number>;
      playerBankedCounts: Record<string, number>;
    }) => {
      setQuestionsAnswered(saved.questionsAnswered);
      setHighestChainPosition(saved.highestChainPosition);
      setLongestStreak(saved.longestStreak);
      currentStreak.current = saved.currentStreak;
      playerCorrectCounts.current = new Map(
        Object.entries(saved.playerCorrectCounts)
      );
      playerBankedCounts.current = new Map(
        Object.entries(saved.playerBankedCounts)
      );
    },
    []
  );

  return {
    recordCorrect,
    recordBank,
    recordIncorrect,
    reset,
    getMetrics,
    getCurrentStreak,
    getPlayerCorrectCounts,
    getPlayerBankedCounts,
    restoreMetrics,
  };
}
