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
import { DEFAULT_PLAYERS, DEFAULT_ROUNDS, MOCK_QUESTIONS } from "@/lib/constants";

export default function PresentationPage() {
  const questions = MOCK_QUESTIONS;
  const players = DEFAULT_PLAYERS;
  const roundConfig = DEFAULT_ROUNDS[0];

  const gameState = useGameState({ questions, players });

  const timer = useTimer({
    initialSeconds: roundConfig.durationSeconds,
    onComplete: gameState.handleTimeUp,
  });

  const keyboardActions = useMemo(
    () => ({
      onReveal: gameState.revealQuestion,
      onCorrect: gameState.markCorrect,
      onIncorrect: gameState.markIncorrect,
      onBank: gameState.bank,
      onNext: gameState.nextQuestion,
      onTogglePause: timer.togglePause,
      onStartTimer: timer.start,
      onDismiss: gameState.dismissTimeUp,
    }),
    [gameState, timer]
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

      {/* Bottom: Total Score */}
      <TotalScore
        totalBanked={gameState.totalBanked}
        bankedThisRound={gameState.bankedThisRound}
      />

      {/* Time Up Overlay */}
      <TimeUpOverlay visible={gameState.timeUp} />
    </div>
  );
}
