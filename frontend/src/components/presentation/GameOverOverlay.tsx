"use client";

import { motion } from "framer-motion";
import type { Player } from "@/types/game";

interface GameOverOverlayProps {
  visible: boolean;
  players: Player[];
  totalBanked: number;
}

export function GameOverOverlay({ visible, players, totalBanked }: GameOverOverlayProps) {
  if (!visible) return null;

  const survivors = players.filter((p) => !p.isEliminated);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="text-center">
        <motion.h1
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-6xl font-extrabold text-foreground mb-6"
        >
          Game Over!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <p className="text-foreground/40 text-lg font-semibold mb-1">
            Total Banked
          </p>
          <p className="text-5xl font-extrabold text-foreground">
            {totalBanked.toLocaleString()} pts
          </p>
        </motion.div>

        {survivors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-pastel-mint/30 rounded-2xl px-8 py-6 border border-pastel-mint/50 inline-block"
          >
            <p className="text-sm text-foreground/40 font-semibold uppercase tracking-wide mb-2">
              The Strongest Links
            </p>
            <p className="text-3xl font-extrabold text-foreground">
              {survivors.map((p) => p.name).join(" & ")}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
