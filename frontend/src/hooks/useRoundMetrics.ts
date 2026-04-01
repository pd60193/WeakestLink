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
  const playerCorrectValues = useRef<Map<string, number>>(new Map());
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

      // Track per-player total value of correctly answered questions
      const value = MONEY_CHAIN[newChainPosition - 1]?.value ?? 0;
      const values = playerCorrectValues.current;
      values.set(playerName, (values.get(playerName) ?? 0) + value);
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
    playerCorrectValues.current.clear();
    playerBankedCounts.current.clear();
  }, []);

  const getMetrics = useCallback(
    (bankedThisRound: number, playerOrder: string[] = []): RoundMetrics => {
      const highestValue =
        MONEY_CHAIN[highestChainPosition - 1]?.value ?? 0;

      // Find player(s) with highest correct count
      const correctCounts = playerCorrectCounts.current;
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

      // Tiebreaker 1: highest total value of correctly answered questions
      const correctValues = playerCorrectValues.current;
      let strongestLinks = candidates;
      if (strongestLinks.length > 1) {
        let maxValue = 0;
        const valueCandidates: string[] = [];
        for (const name of strongestLinks) {
          const totalValue = correctValues.get(name) ?? 0;
          if (totalValue > maxValue) {
            maxValue = totalValue;
            valueCandidates.length = 0;
            valueCandidates.push(name);
          } else if (totalValue === maxValue) {
            valueCandidates.push(name);
          }
        }
        strongestLinks = valueCandidates;
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

  const getPlayerCorrectValues = useCallback(
    () => Object.fromEntries(playerCorrectValues.current),
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
      playerCorrectValues: Record<string, number>;
      playerBankedCounts: Record<string, number>;
    }) => {
      setQuestionsAnswered(saved.questionsAnswered);
      setHighestChainPosition(saved.highestChainPosition);
      setLongestStreak(saved.longestStreak);
      currentStreak.current = saved.currentStreak;
      playerCorrectCounts.current = new Map(
        Object.entries(saved.playerCorrectCounts)
      );
      playerCorrectValues.current = new Map(
        Object.entries(saved.playerCorrectValues ?? {})
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
    getPlayerCorrectValues,
    getPlayerBankedCounts,
    restoreMetrics,
  };
}
