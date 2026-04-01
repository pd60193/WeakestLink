"use client";

import type { PlayerState } from "@/types/game";

interface EliminatedViewProps {
  state: PlayerState;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function EliminatedView({ state }: EliminatedViewProps) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="bg-white/60 rounded-2xl p-5 border border-gray-200/50">
          <p className="text-foreground/40 text-sm font-semibold uppercase tracking-wide mb-1">
            You&apos;ve been eliminated
          </p>
          <p className="text-foreground/50 text-sm">
            You can still watch the game
          </p>
        </div>

        <div>
          <span className="bg-pastel-lilac/30 px-4 py-1.5 rounded-full text-sm font-bold text-foreground/60">
            Round {state.currentRound}
          </span>
        </div>

        <p className="text-3xl font-extrabold text-foreground/40 tabular-nums">
          {formatTime(state.timeRemaining)}
        </p>

        <div className="bg-white/60 rounded-xl p-4 border border-gray-200/50">
          <p className="text-foreground/30 text-xs font-semibold uppercase">Chain</p>
          <p className="text-xl font-bold text-foreground/50">Q{state.chainPosition}</p>
        </div>
      </div>
    </div>
  );
}
