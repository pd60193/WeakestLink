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
  const questions = MOCK_QUESTIONS;
  const players = DEFAULT_PLAYERS;
  const roundConfig = DEFAULT_ROUNDS[0];

  const questionDisplayRef = useRef<QuestionDisplayHandle>(null);
  const session = useSessionPersistence();
  const [sessionDecision, setSessionDecision] = useState<"pending" | "resume" | "new">("pending");

  const gameState = useGameState({ questions, players });
  const audio = useAudio();
  const metrics = useRoundMetrics();

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
      timeUp: saved.timeUp,
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

  const handleTimeUpShow = useCallback(() => {
    audio.playOutro();
  }, [audio]);

  const handleDismiss = useCallback(() => {
    gameState.dismissTimeUp();
    audio.stop();
  }, [gameState, audio]);

  const handleCorrect = useCallback(() => {
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
    questionDisplayRef.current?.snapComplete();
    metrics.recordIncorrect();
    gameState.markIncorrect();
  }, [gameState, metrics]);

  const handleBank = useCallback(() => {
    gameState.bank();
  }, [gameState]);

  const roundMetrics = metrics.getMetrics(gameState.bankedThisRound);

  const keyboardActions = useMemo(
    () => ({
      onReveal: gameState.revealQuestion,
      onCorrect: handleCorrect,
      onIncorrect: handleIncorrect,
      onBank: handleBank,
      onNext: gameState.nextQuestion,
      onTogglePause: timer.togglePause,
      onStartTimer: handleStartTimer,
      onDismiss: handleDismiss,
      onToggleMute: audio.toggleMute,
    }),
    [gameState, timer, handleStartTimer, handleDismiss, handleCorrect, handleIncorrect, handleBank, audio]
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
      />
    </div>
  );
}
