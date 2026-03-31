"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Question, Player, Difficulty } from "@/types/game";
import { MONEY_CHAIN } from "@/lib/constants";

interface UseGameStateOptions {
  questions: Question[];
  players: Player[];
}

function pickRandomQuestion(
  questions: Question[],
  usedIds: Set<string>,
  difficulty: Difficulty
): Question | null {
  // Try matching difficulty first
  const pool = questions.filter(
    (q) => q.difficulty === difficulty && !usedIds.has(q.id)
  );
  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  // Fallback: any unused question
  const fallback = questions.filter((q) => !usedIds.has(q.id));
  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return null;
}

export function useGameState({ questions, players }: UseGameStateOptions) {
  const [currentRound, setCurrentRound] = useState(1);
  const [chainPosition, setChainPosition] = useState(1);
  const [bankedThisRound, setBankedThisRound] = useState(0);
  const [totalBanked, setTotalBanked] = useState(0);
  const [questionRevealed, setQuestionRevealed] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [pendingReveal, setPendingReveal] = useState(false);

  const usedQuestionIds = useRef<Set<string>>(new Set());
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick the current question based on chain difficulty
  const currentDifficulty = MONEY_CHAIN[chainPosition - 1]?.difficulty ?? "Easy";
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(() =>
    pickRandomQuestion(questions, usedQuestionIds.current, currentDifficulty)
  );

  const activePlayers = players.filter((p) => !p.isEliminated);
  const currentPlayer =
    activePlayers[currentPlayerIndex % activePlayers.length] ?? null;
  const currentChainValue = MONEY_CHAIN[chainPosition - 1]?.value ?? 0;

  // Delayed reveal: when pendingReveal is set, wait 1s then show the question
  useEffect(() => {
    if (pendingReveal) {
      revealTimerRef.current = setTimeout(() => {
        revealTimerRef.current = null;
        setQuestionRevealed(true);
        setPendingReveal(false);
      }, 1000);
      return () => {
        if (revealTimerRef.current) {
          clearTimeout(revealTimerRef.current);
          revealTimerRef.current = null;
        }
      };
    }
  }, [pendingReveal]);

  const revealQuestion = useCallback(() => {
    if (!questionRevealed && currentQuestion) {
      setQuestionRevealed(true);
    }
  }, [questionRevealed, currentQuestion]);

  const advanceToNextQuestion = useCallback(
    (nextChainPos: number, markUsed: boolean = true, countQuestion: boolean = true) => {
      // Mark current question as used only if answered
      if (markUsed && currentQuestion) {
        usedQuestionIds.current.add(currentQuestion.id);
      }
      // Pick next question based on the next chain position's difficulty
      const nextDifficulty =
        MONEY_CHAIN[nextChainPos - 1]?.difficulty ?? "Easy";
      const next = pickRandomQuestion(
        questions,
        usedQuestionIds.current,
        nextDifficulty
      );
      setCurrentQuestion(next);
      setQuestionRevealed(false);
      setPendingReveal(true);
      setCurrentPlayerIndex((prev) => prev + 1);
      if (countQuestion) {
        setQuestionsAsked((prev) => prev + 1);
      }
    },
    [currentQuestion, questions]
  );

  const markCorrect = useCallback(() => {
    if (chainPosition >= MONEY_CHAIN.length) {
      // At Q9 (10,000) — auto-bank the top value
      const value = MONEY_CHAIN[MONEY_CHAIN.length - 1].value;
      setBankedThisRound((prev) => prev + value);
      setTotalBanked((prev) => prev + value);
      setChainPosition(1);
      advanceToNextQuestion(1);
    } else {
      const nextPos = chainPosition + 1;
      setChainPosition(nextPos);
      advanceToNextQuestion(nextPos);
    }
  }, [chainPosition, advanceToNextQuestion]);

  const markIncorrect = useCallback(() => {
    setChainPosition(1);
    advanceToNextQuestion(1);
  }, [advanceToNextQuestion]);

  const bank = useCallback(() => {
    if (chainPosition > 1) {
      const value = MONEY_CHAIN[chainPosition - 2].value;
      setBankedThisRound((prev) => prev + value);
      setTotalBanked((prev) => prev + value);
    }
    setChainPosition(1);
    // Fetch new question at lowest difficulty, but don't mark current as used or count it
    advanceToNextQuestion(1, false, false);
  }, [chainPosition, advanceToNextQuestion]);

  const nextQuestion = useCallback(() => {
    advanceToNextQuestion(chainPosition);
  }, [advanceToNextQuestion, chainPosition]);

  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
  }, []);

  const dismissTimeUp = useCallback(() => {
    setTimeUp(false);
  }, []);

  const resetRound = useCallback(
    (newRound?: number) => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
      setChainPosition(1);
      setBankedThisRound(0);
      setQuestionRevealed(false);
      setPendingReveal(false);
      setCurrentPlayerIndex(0);
      setTimeUp(false);
      setQuestionsAsked(0);
      usedQuestionIds.current.clear();
      const first = pickRandomQuestion(
        questions,
        usedQuestionIds.current,
        MONEY_CHAIN[0]?.difficulty ?? "Easy"
      );
      setCurrentQuestion(first);
      if (newRound !== undefined) {
        setCurrentRound(newRound);
      }
    },
    [questions]
  );

  return {
    currentRound,
    chainPosition,
    bankedThisRound,
    totalBanked,
    questionsAsked,
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
