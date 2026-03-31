"use client";

import { useState, useCallback } from "react";
import { Question, Player } from "@/types/game";
import { MONEY_CHAIN } from "@/lib/constants";

interface UseGameStateOptions {
  questions: Question[];
  players: Player[];
}

export function useGameState({ questions, players }: UseGameStateOptions) {
  const [currentRound, setCurrentRound] = useState(1);
  const [chainPosition, setChainPosition] = useState(1);
  const [bankedThisRound, setBankedThisRound] = useState(0);
  const [totalBanked, setTotalBanked] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionRevealed, setQuestionRevealed] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timeUp, setTimeUp] = useState(false);

  const activePlayers = players.filter((p) => !p.isEliminated);
  const currentQuestion = questions[currentQuestionIndex] ?? null;
  const currentPlayer = activePlayers[currentPlayerIndex % activePlayers.length] ?? null;

  const currentChainValue = MONEY_CHAIN[chainPosition - 1]?.value ?? 0;

  const revealQuestion = useCallback(() => {
    if (!questionRevealed && currentQuestion) {
      setQuestionRevealed(true);
    }
  }, [questionRevealed, currentQuestion]);

  const markCorrect = useCallback(() => {
    if (chainPosition >= MONEY_CHAIN.length) {
      // At Q9 (10,000) — auto-bank the top value
      const value = MONEY_CHAIN[MONEY_CHAIN.length - 1].value;
      setBankedThisRound((prev) => prev + value);
      setTotalBanked((prev) => prev + value);
      setChainPosition(1);
    } else {
      setChainPosition((prev) => prev + 1);
    }
  }, [chainPosition]);

  const markIncorrect = useCallback(() => {
    setChainPosition(1);
  }, []);

  const bank = useCallback(() => {
    if (chainPosition > 1) {
      // Bank the value BELOW the current highlight
      const value = MONEY_CHAIN[chainPosition - 2].value;
      setBankedThisRound((prev) => prev + value);
      setTotalBanked((prev) => prev + value);
    }
    setChainPosition(1);
  }, [chainPosition]);

  const nextQuestion = useCallback(() => {
    setQuestionRevealed(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setCurrentPlayerIndex((prev) => prev + 1);
  }, []);

  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
  }, []);

  const dismissTimeUp = useCallback(() => {
    setTimeUp(false);
  }, []);

  const resetRound = useCallback(
    (newRound?: number) => {
      setChainPosition(1);
      setBankedThisRound(0);
      setCurrentQuestionIndex(0);
      setQuestionRevealed(false);
      setCurrentPlayerIndex(0);
      setTimeUp(false);
      if (newRound !== undefined) {
        setCurrentRound(newRound);
      }
    },
    []
  );

  return {
    currentRound,
    chainPosition,
    bankedThisRound,
    totalBanked,
    currentQuestionIndex,
    questionRevealed,
    currentPlayerIndex,
    timeUp,
    currentQuestion,
    currentPlayer,
    currentChainValue,
    activePlayers,
    revealQuestion,
    markCorrect,
    markIncorrect,
    bank,
    nextQuestion,
    handleTimeUp,
    dismissTimeUp,
    resetRound,
  };
}
