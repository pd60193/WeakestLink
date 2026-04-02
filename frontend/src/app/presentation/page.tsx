"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { MoneyChain } from "@/components/presentation/MoneyChain";
import { Timer } from "@/components/presentation/Timer";
import { QuestionDisplay } from "@/components/presentation/QuestionDisplay";
import { TotalScore } from "@/components/presentation/TotalScore";
import { RoundHeader } from "@/components/presentation/RoundHeader";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import { VoteRevealOverlay } from "@/components/presentation/VoteRevealOverlay";
import { LobbyView } from "@/components/presentation/LobbyView";
import { GameOverOverlay } from "@/components/presentation/GameOverOverlay";
import { usePresentationSync } from "@/hooks/useGameSync";
import { useAudio } from "@/hooks/useAudio";
import { DEFAULT_ROUNDS } from "@/lib/constants";

export default function PresentationPage() {
  const {
    state,
    voteResult,
    revealedVoteCount,
    allVotesRevealed,
    status,
  } = usePresentationSync();

  const audio = useAudio();
  const prevTimerRunning = useRef(false);

  // Play middle loop when timer starts, stop when timer stops (but not on time-up)
  useEffect(() => {
    if (state.timerRunning && !prevTimerRunning.current) {
      // Timer just started — play intro then loop middle
      audio.playIntro(() => {
        // Middle loop starts automatically after intro
      });
    } else if (!state.timerRunning && prevTimerRunning.current) {
      // Timer stopped but NOT time-up — just stop audio
      // (outro is handled by TimeUpOverlay's onShow callback)
      if (state.timeRemaining > 0) {
        audio.stop();
      }
    }
    prevTimerRunning.current = state.timerRunning;
  }, [state.timerRunning, state.timeRemaining, audio]);

  const handleTimeUpShow = useCallback(() => {
    audio.playOutro();
  }, [audio]);

  // Mute toggle keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        audio.toggleMute();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [audio]);

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
  // Hide question until revealed (first question waits for timer start)
  const question = state.currentQuestion && state.questionRevealed
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

  // Show voting/elimination overlay (side-by-side with TimeUp)
  const isVotingOrElimination = state.phase === "voting" || state.phase === "elimination";

  // Build round metrics for TimeUpOverlay
  const roundMetrics = {
    questionsAnswered: state.roundMetrics.questionsAnswered,
    bankedThisRound: state.bankedThisRound,
    highestChainPosition: state.roundMetrics.highestChainPosition,
    highestChainValue: 0,
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
        totalBanked={state.totalBanked}
        bankedThisRound={state.bankedThisRound}
      />

      {/* Time Up + Voting/Reveal Side-by-Side Overlay */}
      {(isTimeUp || isVotingOrElimination) && (
        <div className="fixed inset-0 z-50 flex items-stretch bg-foreground/30 backdrop-blur-md">
          {/* Left: Time's Up + Round Stats */}
          <div className="flex-1 flex items-center justify-center">
            <TimeUpOverlay
              visible={true}
              onShow={handleTimeUpShow}
              metrics={roundMetrics}
              nextRound={null}
            />
          </div>

          {/* Right: Voting / Vote Reveal */}
          {isVotingOrElimination && (
            <div className="flex-1 flex items-center justify-center border-l border-white/10">
              <div className="w-full h-full p-6">
                <VoteRevealOverlay
                  visible={true}
                  voteResult={voteResult}
                  voteCount={state.voteCount}
                  totalVotersExpected={state.totalVotersExpected}
                  revealedVoteCount={revealedVoteCount}
                  allVotesRevealed={allVotesRevealed}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Over Overlay */}
      <GameOverOverlay
        visible={state.phase === "game_over"}
        players={state.players}
        totalBanked={state.totalBanked}
      />
    </div>
  );
}
