"use client";

import type { RoundMetricsData, GamePhase } from "@/types/game";

interface RoundInfoProps {
  currentRound: number;
  bankedThisRound: number;
  totalBanked: number;
  metrics: RoundMetricsData;
  phase: GamePhase;
  timeRemaining: number;
  onAction: (action: string) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RoundInfo({
  currentRound,
  bankedThisRound,
  totalBanked,
  metrics,
  phase,
  timeRemaining,
  onAction,
}: RoundInfoProps) {
  return (
    <div className="bg-white/90 rounded-2xl p-4 shadow-sm border border-pastel-lilac/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wide">
          Round {currentRound}
        </h3>
        <span className="text-2xl font-extrabold text-foreground tabular-nums">
          {formatTime(timeRemaining)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-pastel-cream rounded-lg px-3 py-2">
          <p className="text-xs text-foreground/40 font-semibold">This Round</p>
          <p className="text-lg font-bold text-foreground">
            {bankedThisRound.toLocaleString()} pts
          </p>
        </div>
        <div className="bg-pastel-cream rounded-lg px-3 py-2">
          <p className="text-xs text-foreground/40 font-semibold">Total</p>
          <p className="text-lg font-bold text-foreground">
            {totalBanked.toLocaleString()} pts
          </p>
        </div>
        <div className="bg-pastel-cream rounded-lg px-3 py-2">
          <p className="text-xs text-foreground/40 font-semibold">Answered</p>
          <p className="text-lg font-bold text-foreground">
            {metrics.questionsAnswered}
          </p>
        </div>
        <div className="bg-pastel-cream rounded-lg px-3 py-2">
          <p className="text-xs text-foreground/40 font-semibold">Strongest</p>
          <p className="text-lg font-bold text-foreground truncate">
            {metrics.strongestLink ?? "—"}
          </p>
        </div>
      </div>

      {/* Phase-specific actions */}
      <div className="flex gap-2">
        {phase === "playing" && timeRemaining === 0 && (
          <button
            onClick={() => onAction("start_voting")}
            className="flex-1 bg-pastel-rose hover:bg-pastel-rose/80 text-foreground font-bold py-3 rounded-xl transition-colors"
          >
            Start Voting
          </button>
        )}
        {phase === "voting" && (
          <button
            onClick={() => onAction("end_voting")}
            className="flex-1 bg-pastel-lilac hover:bg-pastel-lilac/80 text-foreground font-bold py-3 rounded-xl transition-colors"
          >
            End Voting
          </button>
        )}
        {(phase === "elimination" || phase === "round_transition") && (
          <button
            onClick={() => onAction("next_round")}
            className="flex-1 bg-pastel-mint hover:bg-pastel-mint/80 text-foreground font-bold py-3 rounded-xl transition-colors"
          >
            Next Round
          </button>
        )}
      </div>
    </div>
  );
}
