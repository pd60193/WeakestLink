"use client";

import { motion } from "framer-motion";
import { MONEY_CHAIN } from "@/lib/constants";
import type { PlayerState } from "@/types/game";

interface SpectateViewProps {
  state: PlayerState;
  playerName: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function SpectateView({ state, playerName }: SpectateViewProps) {
  const chainLevel = MONEY_CHAIN[state.chainPosition - 1];
  const isCurrentPlayer = state.currentPlayerName === playerName;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm text-center space-y-6"
      >
        {/* Round badge */}
        <div>
          <span className="bg-pastel-lilac/50 px-4 py-1.5 rounded-full text-sm font-bold text-foreground">
            Round {state.currentRound}
          </span>
        </div>

        {/* Timer */}
        <div>
          <p className="text-5xl font-extrabold text-foreground tabular-nums">
            {formatTime(state.timeRemaining)}
          </p>
          {!state.timerRunning && state.timeRemaining > 0 && (
            <p className="text-foreground/40 text-sm mt-1">Waiting to start...</p>
          )}
        </div>

        {/* Chain position */}
        <div className="bg-white/90 rounded-2xl p-5 shadow-sm border border-pastel-lilac/20">
          <p className="text-foreground/40 text-xs font-semibold uppercase tracking-wide mb-1">
            Chain
          </p>
          <p className="text-3xl font-extrabold text-foreground">
            Q{state.chainPosition}
          </p>
          <p className="text-foreground/50 font-semibold">
            {chainLevel?.value.toLocaleString() ?? 0} pts
          </p>
        </div>

        {/* Banked */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-pastel-lilac/20">
            <p className="text-foreground/40 text-xs font-semibold uppercase">Round</p>
            <p className="text-xl font-bold text-foreground">
              {state.bankedThisRound.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/90 rounded-xl p-4 shadow-sm border border-pastel-lilac/20">
            <p className="text-foreground/40 text-xs font-semibold uppercase">Total</p>
            <p className="text-xl font-bold text-foreground">
              {state.totalBanked.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Current player indicator */}
        {isCurrentPlayer ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-pastel-sky/40 border-2 border-pastel-sky rounded-xl px-4 py-3"
          >
            <p className="font-bold text-foreground">Your turn!</p>
          </motion.div>
        ) : state.currentPlayerName ? (
          <p className="text-foreground/40 font-medium">
            Current: <span className="font-semibold text-foreground/60">{state.currentPlayerName}</span>
          </p>
        ) : null}
      </motion.div>
    </div>
  );
}
