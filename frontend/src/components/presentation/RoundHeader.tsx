"use client";

import { motion } from "framer-motion";

interface RoundHeaderProps {
  roundNumber: number;
  playerName: string | null;
  audioSlot?: React.ReactNode;
}

export function RoundHeader({ roundNumber, playerName, audioSlot }: RoundHeaderProps) {
  return (
    <div className="flex items-center justify-between px-8 py-4">
      <motion.div
        key={roundNumber}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div className="bg-pastel-lilac/60 rounded-full px-5 py-2">
          <span className="text-sm font-extrabold uppercase tracking-widest text-foreground/70">
            Round {roundNumber}
          </span>
        </div>
      </motion.div>

      <div className="text-center">
        <span className="text-2xl font-extrabold tracking-tight text-foreground/80">
          The Weakest Link
        </span>
      </div>

      <div className="flex items-center gap-3">
        {audioSlot}
        {playerName && (
          <motion.div
            key={playerName}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-pastel-mint/60 rounded-full px-5 py-2">
              <span className="text-sm font-bold text-foreground/70">
                {playerName}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
