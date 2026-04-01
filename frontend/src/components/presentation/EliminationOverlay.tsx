"use client";

import { motion } from "framer-motion";
import type { VoteResult } from "@/types/game";

interface EliminationOverlayProps {
  visible: boolean;
  voteResult: VoteResult | null;
}

export function EliminationOverlay({ visible, voteResult }: EliminationOverlayProps) {
  if (!visible || !voteResult) return null;

  const eliminated = voteResult.eliminated;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="text-center">
        {eliminated ? (
          <>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-extrabold text-foreground mb-6"
            >
              {eliminated.name}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-3xl font-bold text-difficulty-hard mb-2"
            >
              You ARE the weakest link...
            </motion.p>
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, type: "spring" }}
              className="text-4xl font-extrabold text-difficulty-hard"
            >
              Goodbye!
            </motion.p>
          </>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold text-foreground"
          >
            No elimination this round
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
