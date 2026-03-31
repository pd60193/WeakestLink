"use client";

import { motion } from "framer-motion";

interface TotalScoreProps {
  totalBanked: number;
  bankedThisRound: number;
}

export function TotalScore({ totalBanked, bankedThisRound }: TotalScoreProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="bg-white/70 backdrop-blur-md border-t border-pastel-pink/30 px-8 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              This Round
            </span>
            <motion.span
              key={bankedThisRound}
              initial={{ scale: 1.3, color: "#A8E6CF" }}
              animate={{ scale: 1, color: "#4A4A4A" }}
              className="text-xl font-extrabold tabular-nums"
            >
              {bankedThisRound.toLocaleString()}
            </motion.span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              Total Banked
            </span>
            <motion.span
              key={totalBanked}
              initial={{ scale: 1.4, color: "#FFD3E0" }}
              animate={{ scale: 1, color: "#4A4A4A" }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-3xl font-extrabold tabular-nums"
            >
              {totalBanked.toLocaleString()}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
}
