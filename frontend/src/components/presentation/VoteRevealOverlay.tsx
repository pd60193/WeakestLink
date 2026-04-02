"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { VoteResult, VoteRevealEntry } from "@/types/game";

interface VoteRevealOverlayProps {
  visible: boolean;
  voteResult: VoteResult | null;
  voteCount: number;
  totalVotersExpected: number;
  revealedVoteCount: number;
  allVotesRevealed: boolean;
}

export function VoteRevealOverlay({
  visible,
  voteResult,
  voteCount,
  totalVotersExpected,
  revealedVoteCount,
  allVotesRevealed,
}: VoteRevealOverlayProps) {
  if (!visible) return null;

  const votingComplete = voteCount >= totalVotersExpected && totalVotersExpected > 0;
  const revealOrder = voteResult?.voteRevealOrder ?? [];
  const hasResult = voteResult !== null;

  // Determine how many votes to show
  const visibleVotes = allVotesRevealed
    ? revealOrder
    : revealOrder.slice(0, revealedVoteCount);

  const allRevealed = allVotesRevealed || revealedVoteCount >= revealOrder.length;
  const showElimination = allRevealed && hasResult;

  // Phase: voting in progress → voting complete → revealing → eliminated
  if (!hasResult) {
    // Still in voting phase
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/90 rounded-3xl px-12 py-10 shadow-xl border-2 border-pastel-rose/30 text-center"
        >
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-foreground mb-3"
          >
            {votingComplete ? "Voting Complete!" : "Time to Vote"}
          </motion.h2>
          <p className="text-xl text-foreground/50 font-semibold mb-6">
            Who is the weakest link?
          </p>
          <div className="bg-pastel-cream rounded-2xl px-6 py-4 inline-block">
            <p className="text-foreground/40 text-xs font-semibold uppercase tracking-wide mb-1">
              Votes received
            </p>
            <p className="text-3xl font-extrabold text-foreground tabular-nums">
              {voteCount} / {totalVotersExpected}
            </p>
          </div>
          {votingComplete && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 text-sm font-semibold text-foreground/40"
            >
              Waiting for host...
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Reveal phase
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-3xl font-extrabold text-foreground">
          {showElimination ? "The votes are in..." : "Revealing votes..."}
        </h2>
      </div>

      {/* Vote list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="max-w-lg mx-auto space-y-2">
          <AnimatePresence>
            {visibleVotes.map((entry: VoteRevealEntry, i: number) => (
              <motion.div
                key={entry.voterId}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-white/90 rounded-xl px-5 py-3 shadow-sm border border-pastel-lilac/20 flex items-center gap-3"
              >
                <span className="w-7 h-7 rounded-full bg-pastel-sky/50 flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-foreground">
                  {entry.voterName}
                </span>
                <span className="text-foreground/40 mx-1">{"\u2192"}</span>
                <span className="font-bold text-difficulty-hard">
                  {entry.votedForName}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Elimination result */}
      <AnimatePresence>
        {showElimination && voteResult.eliminated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            className="py-6 text-center"
          >
            <div className="inline-block bg-white/95 rounded-2xl px-10 py-6 shadow-lg border-2 border-difficulty-hard/30">
              <p className="text-4xl font-extrabold text-foreground mb-2">
                {voteResult.eliminated.name}
              </p>
              <p className="text-2xl font-bold text-difficulty-hard mb-1">
                You ARE the weakest link...
              </p>
              <p className="text-3xl font-extrabold text-difficulty-hard">
                Goodbye!
              </p>
            </div>
          </motion.div>
        )}
        {showElimination && !voteResult.eliminated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center"
          >
            <p className="text-2xl font-bold text-foreground">
              No elimination this round
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
