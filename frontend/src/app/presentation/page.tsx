"use client";

import { useMemo } from "react";
import { MoneyChain } from "@/components/presentation/MoneyChain";
import { Timer } from "@/components/presentation/Timer";
import { QuestionDisplay } from "@/components/presentation/QuestionDisplay";
import { TotalScore } from "@/components/presentation/TotalScore";
import { RoundHeader } from "@/components/presentation/RoundHeader";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import { VotingOverlay } from "@/components/presentation/VotingOverlay";
import { EliminationOverlay } from "@/components/presentation/EliminationOverlay";
import { LobbyView } from "@/components/presentation/LobbyView";
import { GameOverOverlay } from "@/components/presentation/GameOverOverlay";
import { usePresentationSync } from "@/hooks/useGameSync";
import { DEFAULT_ROUNDS } from "@/lib/constants";

export default function PresentationPage() {
  const { state, voteResult, status } = usePresentationSync();

  const roundConfig = DEFAULT_ROUNDS[state.currentRound - 1] ?? DEFAULT_ROUNDS[DEFAULT_ROUNDS.length - 1];

  const activePlayers = useMemo(
    () => state.players.filter((p) => !p.isEliminated),
    [state.players]
  );

  const currentPlayer = activePlayers[state.currentPlayerIndex % activePlayers.length] ?? null;

  // Lobby phase
  if (state.phase === "lobby") {
    return (
      <div className="h-full">
        <LobbyView players={state.players} />
      </div>
    );
  }

  // Map server question to the shape QuestionDisplay expects
  const question = state.currentQuestion
    ? {
        id: state.currentQuestion.id,
        text: state.currentQuestion.text,
        imageUrl: state.currentQuestion.imageUrl,
        answer: "", // Presentation doesn't get answers
        difficulty: state.currentQuestion.difficulty,
        round: state.currentQuestion.round,
      }
    : null;

  // Determine if time is up (timer stopped and time remaining is 0 during playing phase)
  const isTimeUp = state.phase === "playing" && state.timeRemaining <= 0 && !state.timerRunning;

  // Build round metrics for TimeUpOverlay
  const roundMetrics = {
    questionsAnswered: state.roundMetrics.questionsAnswered,
    bankedThisRound: state.bankedThisRound,
    highestChainPosition: state.roundMetrics.highestChainPosition,
    highestChainValue: 0, // not critical for display
    longestStreak: state.roundMetrics.longestStreak,
    strongestLinks: state.roundMetrics.strongestLink ? [state.roundMetrics.strongestLink] : [],
  };

  return (
    <div className="h-full flex flex-col">
      {/* Connection indicator */}
      {status !== "connected" && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-pastel-peach/90 text-foreground text-sm font-semibold px-4 py-1.5 rounded-full">
          {status === "connecting" ? "Connecting..." : "Disconnected"}
        </div>
      )}

      {/* Header */}
      <RoundHeader
        roundNumber={state.currentRound}
        playerName={currentPlayer?.name ?? null}
      />

      {/* Main content: MoneyChain | QuestionDisplay | Timer */}
      <div className="flex-1 flex items-stretch px-6 pb-20 gap-6">
        <div className="flex items-center justify-center w-[260px] shrink-0">
          <MoneyChain chainPosition={state.chainPosition} />
        </div>

        <QuestionDisplay
          question={question}
          questionNumber={state.questionsAsked + 1}
          revealedAnswer={state.revealedAnswer}
        />

        <div className="flex items-center justify-center w-[260px] shrink-0 relative">
          <Timer
            timeRemaining={state.timeRemaining}
            totalTime={roundConfig.durationSeconds}
            isRunning={state.timerRunning}
            isPaused={state.timerPaused}
          />
        </div>
      </div>

      {/* Bottom: Total Score */}
      <TotalScore
        totalBanked={state.totalBanked}
        bankedThisRound={state.bankedThisRound}
      />

      {/* Time Up Overlay */}
      <TimeUpOverlay
        visible={isTimeUp}
        metrics={roundMetrics}
        nextRound={state.currentRound < DEFAULT_ROUNDS.length ? state.currentRound + 1 : null}
      />

      {/* Voting Overlay */}
      <VotingOverlay
        visible={state.phase === "voting"}
        voteCount={state.voteCount}
        totalVotersExpected={state.totalVotersExpected}
      />

      {/* Elimination Overlay */}
      <EliminationOverlay
        visible={state.phase === "elimination"}
        voteResult={voteResult}
      />

      {/* Game Over Overlay */}
      <GameOverOverlay
        visible={state.phase === "game_over"}
        players={state.players}
        totalBanked={state.totalBanked}
      />
    </div>
  );
}
