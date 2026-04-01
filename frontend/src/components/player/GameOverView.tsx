"use client";

import { motion } from "framer-motion";
import type { Player } from "@/types/game";

interface GameOverViewProps {
  players: Player[];
  totalBanked: number;
}

export function GameOverView({ players, totalBanked }: GameOverViewProps) {
  const survivors = players.filter((p) => !p.isEliminated);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-extrabold text-foreground mb-2">
          Game Over!
        </h1>
        <p className="text-foreground/50 font-semibold mb-4">
          Total: {totalBanked.toLocaleString()} pts
        </p>
        {survivors.length > 0 && (
          <div className="bg-pastel-mint/30 rounded-xl px-6 py-4 border border-pastel-mint/50">
            <p className="text-sm text-foreground/40 font-semibold uppercase mb-1">
              Survivors
            </p>
            <p className="text-xl font-bold text-foreground">
              {survivors.map((p) => p.name).join(" & ")}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
