"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { MoneyChain } from "@/components/presentation/MoneyChain";
import { Timer } from "@/components/presentation/Timer";
import {
  QuestionDisplay,
  QuestionDisplayHandle,
} from "@/components/presentation/QuestionDisplay";
import { TotalScore } from "@/components/presentation/TotalScore";
import { RoundHeader } from "@/components/presentation/RoundHeader";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import { ResumePrompt } from "@/components/presentation/ResumePrompt";
import { useTimer } from "@/hooks/useTimer";
import { useGameState } from "@/hooks/useGameState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAudio } from "@/hooks/useAudio";
import { useRoundMetrics } from "@/hooks/useRoundMetrics";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import {
  SESSION_VERSION,
  debouncedSave,
  flushSave,
  PersistedGameSession,
} from "@/lib/sessionPersistence";
import { MONEY_CHAIN, DEFAULT_PLAYERS, DEFAULT_ROUNDS, MOCK_QUESTIONS } from "@/lib/constants";

export default function PresentationPage() {
  const players = DEFAULT_PLAYERS;

  const questionDisplayRef = useRef<QuestionDisplayHandle>(null);
  const session = useSessionPersistence();
  const [sessionDecision, setSessionDecision] = useState<"pending" | "resume" | "new">("pending");
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const answerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gameState = useGameState({ questions: MOCK_QUESTIONS, players });
  const audio = useAudio();
  const metrics = useRoundMetrics();

  const roundConfig = DEFAULT_ROUNDS[gameState.currentRound - 1] ?? DEFAULT_ROUNDS[DEFAULT_ROUNDS.length - 1];
  const totalRounds = DEFAULT_ROUNDS.length;

  // Cleanup answer reveal timer on unmount
  useEffect(() => {
    return () => {
      if (answerTimerRef.current) {
        clearTimeout(answerTimerRef.current);
      }
    };
  }, []);

  const handleTimerComplete = useCallback(() => {
    gameState.handleTimeUp();
  }, [gameState]);

  const timer = useTimer({
    initialSeconds: roundConfig.durationSeconds,
    onComplete: handleTimerComplete,
  });

  // Auto-set decision if no saved session
  useEffect(() => {
    if (session.isReady && !session.hasSavedSession && sessionDecision === "pending") {
      setSessionDecision("new");
    }
  }, [session.isReady, session.hasSavedSession, sessionDecision]);

  // Handle resume
  const handleResume = useCallback(() => {
    const saved = session.savedState;
    if (!saved) return;
    gameState.restoreState({
      currentRound: saved.currentRound,
      chainPosition: saved.chainPosition,
      bankedThisRound: saved.bankedThisRound,
      totalBanked: saved.totalBanked,
      currentPlayerIndex: saved.currentPlayerIndex,
      timeUp: saved.timeUp || saved.timeRemaining <= 0,
      questionsAsked: saved.questionsAsked,
      currentQuestionId: saved.currentQuestionId,
      usedQuestionIds: saved.usedQuestionIds,
    });
    timer.restoreTime(saved.timeRemaining);
    metrics.restoreMetrics({
      questionsAnswered: saved.questionsAnswered,
      highestChainPosition: saved.highestChainPosition,
      longestStreak: saved.longestStreak,
      currentStreak: saved.currentStreak,
      playerCorrectCounts: saved.playerCorrectCounts,
      playerCorrectValues: saved.playerCorrectValues ?? {},
      playerBankedCounts: saved.playerBankedCounts ?? {},
    });
    audio.restoreMuted(saved.isMuted);
    setSessionDecision("resume");
  }, [session.savedState, gameState, timer, metrics, audio]);

  const handleNewGame = useCallback(() => {
    session.clearSession();
    setSessionDecision("new");
  }, [session]);

  // --- Persistence: save on state changes ---
  const snapshotRef = useRef<PersistedGameSession | null>(null);

  // Update snapshot ref on every render
  snapshotRef.current = {
    version: SESSION_VERSION,
    currentRound: gameState.currentRound,
    chainPosition: gameState.chainPosition,
    bankedThisRound: gameState.bankedThisRound,
    totalBanked: gameState.totalBanked,
    currentPlayerIndex: gameState.currentPlayerIndex,
    timeUp: gameState.timeUp,
    questionsAsked: gameState.questionsAsked,
    currentQuestionId: gameState.currentQuestion?.id ?? null,
    usedQuestionIds: gameState.getUsedQuestionIds(),
    timeRemaining: timer.timeRemaining,
    isMuted: audio.isMuted,
    questionsAnswered: metrics.getMetrics(gameState.bankedThisRound).questionsAnswered,
    highestChainPosition: metrics.getMetrics(gameState.bankedThisRound).highestChainPosition,
    longestStreak: metrics.getMetrics(gameState.bankedThisRound).longestStreak,
    currentStreak: metrics.getCurrentStreak(),
    playerCorrectCounts: metrics.getPlayerCorrectCounts(),
    playerCorrectValues: metrics.getPlayerCorrectValues(),
    playerBankedCounts: metrics.getPlayerBankedCounts(),
  };

  // Debounced save whenever key values change
  useEffect(() => {
    if (sessionDecision === "pending") return;
    if (snapshotRef.current) {
      debouncedSave(snapshotRef.current);
    }
  }, [
    sessionDecision,
    gameState.currentRound,
    gameState.chainPosition,
    gameState.bankedThisRound,
    gameState.totalBanked,
    gameState.currentPlayerIndex,
    gameState.timeUp,
    gameState.questionsAsked,
    gameState.currentQuestion,
    timer.timeRemaining,
    audio.isMuted,
  ]);

  // Flush save on tab close / refresh
  useEffect(() => {
    const handler = () => {
      if (snapshotRef.current && sessionDecision !== "pending") {
        flushSave(snapshotRef.current);
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [sessionDecision]);

  // --- Game actions ---
  const handleStartTimer = useCallback(() => {
    audio.playIntro(() => {
      timer.startWithDelay(0);
    });
  }, [audio, timer]);

  const playerOrder = useMemo(
    () => gameState.activePlayers.map((p) => p.name),
    [gameState.activePlayers]
  );
  const roundMetrics = metrics.getMetrics(gameState.bankedThisRound, playerOrder);

  const handleTimeUpShow = useCallback(() => {
    audio.playOutro();
  }, [audio]);

  const handleNextRound = useCallback(() => {
    if (!gameState.timeUp) return;
    audio.stop();
    const nextRound = gameState.currentRound + 1;
    if (nextRound > totalRounds) return;
    const strongestLink = roundMetrics.strongestLinks[0] ?? undefined;
    gameState.resetRound(nextRound, strongestLink);
    metrics.reset();
    const nextRoundConfig = DEFAULT_ROUNDS[nextRound - 1];
    timer.reset(nextRoundConfig.durationSeconds);
  }, [gameState, audio, metrics, timer, totalRounds, roundMetrics]);

  const handleCorrect = useCallback(() => {
    if (gameState.timeUp) return;
    questionDisplayRef.current?.snapComplete();
    const chainPos = gameState.chainPosition;
    const playerName = gameState.currentPlayer?.name ?? "Unknown";
    if (chainPos >= MONEY_CHAIN.length) {
      metrics.recordCorrect(MONEY_CHAIN.length, playerName);
    } else {
      metrics.recordCorrect(chainPos + 1, playerName);
    }
    gameState.markCorrect();
  }, [gameState, metrics]);

  const handleIncorrect = useCallback(() => {
    if (gameState.timeUp || revealedAnswer) return;
    questionDisplayRef.current?.snapComplete();
    const answer = gameState.currentQuestion?.answer ?? null;
    setRevealedAnswer(answer);
    metrics.recordIncorrect();
    answerTimerRef.current = setTimeout(() => {
      answerTimerRef.current = null;
      setRevealedAnswer(null);
      gameState.markIncorrect();
    }, 1000);
  }, [gameState, metrics, revealedAnswer]);

  const handleBank = useCallback(() => {
    if (gameState.timeUp) return;
    if (gameState.chainPosition > 1) {
      const value = MONEY_CHAIN[gameState.chainPosition - 2].value;
      const playerName = gameState.currentPlayer?.name ?? "Unknown";
      metrics.recordBank(value, playerName);
    }
    gameState.bank();
  }, [gameState, metrics]);

  const handleReveal = useCallback(() => {
    if (gameState.timeUp) return;
    gameState.revealQuestion();
  }, [gameState]);

  const handleNext = useCallback(() => {
    if (gameState.timeUp) return;
    gameState.nextQuestion();
  }, [gameState]);

  const keyboardActions = useMemo(
    () => ({
      onReveal: handleReveal,
      onCorrect: handleCorrect,
      onIncorrect: handleIncorrect,
      onBank: handleBank,
      onNext: handleNext,
      onTogglePause: timer.togglePause,
      onStartTimer: handleStartTimer,
      onNextRound: handleNextRound,
      onToggleMute: audio.toggleMute,
    }),
    [gameState, timer, handleStartTimer, handleNextRound, handleCorrect, handleIncorrect, handleBank, handleReveal, handleNext, audio]
  );

  useKeyboardShortcuts(keyboardActions);

  // Don't render until localStorage is read
  if (!session.isReady) return null;

  // Show resume prompt if saved session exists and user hasn't decided
  if (session.hasSavedSession && sessionDecision === "pending" && session.savedState) {
    return <ResumePrompt session={session.savedState} onResume={handleResume} onNewGame={handleNewGame} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <RoundHeader
        roundNumber={gameState.currentRound}
        playerName={gameState.currentPlayer?.name ?? null}
      />

      {/* Main content: MoneyChain | QuestionDisplay | Timer */}
      <div className="flex-1 flex items-stretch px-6 pb-20 gap-6">
        {/* Left: Money Chain */}
        <div className="flex items-center justify-center w-[260px] shrink-0">
          <MoneyChain chainPosition={gameState.chainPosition} />
        </div>

        {/* Center: Question Display */}
        <QuestionDisplay
          ref={questionDisplayRef}
          question={gameState.currentQuestion}
          revealed={gameState.questionRevealed}
          questionNumber={gameState.questionsAsked + 1}
          revealedAnswer={revealedAnswer}
        />

        {/* Right: Timer */}
        <div className="flex items-center justify-center w-[260px] shrink-0 relative">
          <Timer
            timeRemaining={timer.timeRemaining}
            totalTime={roundConfig.durationSeconds}
            isRunning={timer.isRunning}
            isPaused={timer.isPaused}
          />
        </div>
      </div>

      {/* Mute toggle */}
      <button
        onClick={audio.toggleMute}
        className="fixed top-4 right-4 z-40 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-colors"
        title={audio.isMuted ? "Unmute (M)" : "Mute (M)"}
      >
        {audio.isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Bottom: Total Score */}
      <TotalScore
        totalBanked={gameState.totalBanked}
        bankedThisRound={gameState.bankedThisRound}
      />

      {/* Time Up Overlay with Round Stats */}
      <TimeUpOverlay
        visible={gameState.timeUp}
        onShow={handleTimeUpShow}
        metrics={roundMetrics}
        nextRound={gameState.currentRound < totalRounds ? gameState.currentRound + 1 : null}
      />
    </div>
  );
}
