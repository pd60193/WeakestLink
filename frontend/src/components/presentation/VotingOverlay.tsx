"use client";

import { motion } from "framer-motion";

interface VotingOverlayProps {
  visible: boolean;
  voteCount: number;
  totalVotersExpected: number;
}

export function VotingOverlay({ visible, voteCount, totalVotersExpected }: VotingOverlayProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <div className="text-center">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-5xl font-extrabold text-foreground mb-4"
        >
          Time to Vote
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl text-foreground/50 font-semibold mb-8"
        >
          Who is the weakest link?
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/80 rounded-2xl px-8 py-6 shadow-lg inline-block"
        >
          <p className="text-foreground/40 text-sm font-semibold uppercase tracking-wide mb-1">
            Votes received
          </p>
          <p className="text-4xl font-extrabold text-foreground tabular-nums">
            {voteCount} / {totalVotersExpected}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
