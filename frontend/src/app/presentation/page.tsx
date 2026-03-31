"use client";

import { useMemo, useCallback } from "react";
import { MoneyChain } from "@/components/presentation/MoneyChain";
import { Timer } from "@/components/presentation/Timer";
import { QuestionDisplay } from "@/components/presentation/QuestionDisplay";
import { TotalScore } from "@/components/presentation/TotalScore";
import { RoundHeader } from "@/components/presentation/RoundHeader";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import { useTimer } from "@/hooks/useTimer";
import { useGameState } from "@/hooks/useGameState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useAudio } from "@/hooks/useAudio";
import { DEFAULT_PLAYERS, DEFAULT_ROUNDS, MOCK_QUESTIONS } from "@/lib/constants";

export default function PresentationPage() {
  const questions = MOCK_QUESTIONS;
  const players = DEFAULT_PLAYERS;
  const roundConfig = DEFAULT_ROUNDS[0];

  const gameState = useGameState({ questions, players });
  const audio = useAudio();

  const handleTimerComplete = useCallback(() => {
    gameState.handleTimeUp();
  }, [gameState]);

  const timer = useTimer({
    initialSeconds: roundConfig.durationSeconds,
    onComplete: handleTimerComplete,
  });

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

  const keyboardActions = useMemo(
    () => ({
      onReveal: gameState.revealQuestion,
      onCorrect: gameState.markCorrect,
      onIncorrect: gameState.markIncorrect,
      onBank: gameState.bank,
      onNext: gameState.nextQuestion,
      onTogglePause: timer.togglePause,
      onStartTimer: handleStartTimer,
      onDismiss: handleDismiss,
      onToggleMute: audio.toggleMute,
    }),
    [gameState, timer, handleStartTimer, handleDismiss, audio]
  );

  useKeyboardShortcuts(keyboardActions);

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
          question={gameState.currentQuestion}
          revealed={gameState.questionRevealed}
          questionNumber={gameState.currentQuestionIndex + 1}
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

      {/* Time Up Overlay */}
      <TimeUpOverlay visible={gameState.timeUp} onShow={handleTimeUpShow} />
    </div>
  );
}
