"use client";

import { motion } from "framer-motion";
import type { Player, GamePhase } from "@/types/game";

interface PlayerListProps {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  onKick?: (playerId: string) => void;
}

export function PlayerList({
  players,
  currentPlayerIndex,
  phase,
  onKick,
}: PlayerListProps) {
  const activePlayers = players.filter((p) => !p.isEliminated);
  const currentPlayer = activePlayers[currentPlayerIndex % activePlayers.length];

  return (
    <div className="bg-white/90 rounded-2xl p-4 shadow-sm border border-pastel-lilac/20">
      <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wide mb-3">
        Players ({activePlayers.length} active)
      </h3>
      <div className="space-y-1.5">
        {players.map((player) => {
          const isCurrent = currentPlayer?.id === player.id && phase === "playing";
          const isEliminated = player.isEliminated;

          return (
            <motion.div
              key={player.id}
              layout
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-pastel-sky/50 border border-pastel-sky"
                  : isEliminated
                    ? "bg-gray-100/50 opacity-50"
                    : "bg-pastel-cream/50"
              }`}
            >
              {isCurrent && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
              )}
              <span
                className={`font-semibold text-sm flex-1 ${
                  isEliminated ? "line-through text-foreground/40" : "text-foreground"
                }`}
              >
                {player.name}
              </span>
              {isEliminated && (
                <span className="text-xs text-foreground/30">OUT</span>
              )}
              {!isEliminated && phase === "lobby" && onKick && (
                <button
                  onClick={() => onKick(player.id)}
                  className="text-xs text-difficulty-hard/70 hover:text-difficulty-hard font-semibold px-2 py-0.5 rounded"
                >
                  Kick
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
