"use client";

import { motion } from "framer-motion";
import type { VoteResult } from "@/types/game";

interface EliminationRevealProps {
  voteResult: VoteResult;
  currentPlayerId: string;
}

export function EliminationReveal({ voteResult, currentPlayerId }: EliminationRevealProps) {
  const eliminated = voteResult.eliminated;
  const isMe = eliminated?.id === currentPlayerId;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="text-center"
      >
        {eliminated ? (
          <>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-extrabold text-foreground mb-4"
            >
              {eliminated.name}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isMe ? (
                <div className="space-y-2">
                  <p className="text-xl font-bold text-difficulty-hard">
                    You ARE the weakest link...
                  </p>
                  <p className="text-2xl font-extrabold text-difficulty-hard">
                    Goodbye!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg text-foreground/60 font-semibold">
                    ...is the weakest link.
                  </p>
                  <p className="text-foreground/40 text-sm">
                    Waiting for next round...
                  </p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <p className="text-xl font-semibold text-foreground/50">
            No one was eliminated
          </p>
        )}
      </motion.div>
    </div>
  );
}
