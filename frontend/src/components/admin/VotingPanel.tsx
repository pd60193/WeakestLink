"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Player, VoteResult, VoteRevealEntry } from "@/types/game";

interface VotingPanelProps {
  players: Player[];
  votes: Record<string, string>;
  voteCount: number;
  totalVotersExpected: number;
  voteResult: VoteResult | null;
  revealedVoteCount: number;
  allVotesRevealed: boolean;
  onEndVoting: () => void;
  onRevealNext: () => void;
  onRevealAll: () => void;
  onConfirmElimination: () => void;
}

export function VotingPanel({
  players,
  votes,
  voteCount,
  totalVotersExpected,
  voteResult,
  revealedVoteCount,
  allVotesRevealed,
  onEndVoting,
  onRevealNext,
  onRevealAll,
  onConfirmElimination,
}: VotingPanelProps) {
  const activePlayers = players.filter((p) => !p.isEliminated);
  const hasResult = voteResult !== null;
  const revealOrder = voteResult?.voteRevealOrder ?? [];
  const totalReveals = revealOrder.length;
  const allRevealed = allVotesRevealed || revealedVoteCount >= totalReveals;
  const visibleVotes = allVotesRevealed
    ? revealOrder
    : revealOrder.slice(0, revealedVoteCount);

  // Count votes per player
  const voteTally: Record<string, number> = {};
  for (const votedFor of Object.values(votes)) {
    voteTally[votedFor] = (voteTally[votedFor] || 0) + 1;
  }

  return (
    <div className="bg-white/90 rounded-2xl p-5 shadow-sm border border-pastel-rose/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wide">
          {hasResult ? "Vote Reveal" : "Voting"}
        </h3>
        <span className="text-sm font-semibold text-foreground/60">
          {hasResult
            ? `${Math.min(allVotesRevealed ? totalReveals : revealedVoteCount, totalReveals)} / ${totalReveals} revealed`
            : `${voteCount} / ${totalVotersExpected} votes`}
        </span>
      </div>

      {/* Voting phase: show vote bars */}
      {!hasResult && (
        <>
          <div className="space-y-2 mb-4">
            {activePlayers.map((player) => {
              const count = voteTally[player.id] || 0;
              const pct = totalVotersExpected > 0 ? (count / totalVotersExpected) * 100 : 0;

              return (
                <div key={player.id} className="relative">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm w-24 truncate text-foreground">
                      {player.name}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-pastel-rose/60"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-sm font-bold text-foreground/60 w-8 text-right">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onEndVoting}
            className="w-full bg-pastel-lilac hover:bg-pastel-lilac/80 text-foreground font-bold py-3 rounded-xl transition-colors"
          >
            End Voting & Reveal
          </button>
        </>
      )}

      {/* Reveal phase: show revealed votes + controls */}
      {hasResult && (
        <>
          <div className="space-y-1.5 mb-4 max-h-[300px] overflow-y-auto">
            {visibleVotes.map((entry: VoteRevealEntry, i: number) => (
              <div
                key={entry.voterId}
                className="flex items-center gap-2 bg-pastel-cream/80 rounded-lg px-3 py-2 text-sm"
              >
                <span className="w-5 h-5 rounded-full bg-pastel-sky/50 flex items-center justify-center text-xs font-bold text-foreground/60 shrink-0">
                  {i + 1}
                </span>
                <span className="font-semibold text-foreground">
                  {entry.voterName}
                </span>
                <span className="text-foreground/40">{"\u2192"}</span>
                <span className="font-semibold text-difficulty-hard">
                  {entry.votedForName}
                </span>
              </div>
            ))}
            {visibleVotes.length === 0 && (
              <p className="text-foreground/40 text-sm text-center py-3">
                Press N to reveal votes one by one
              </p>
            )}
          </div>

          {/* Controls */}
          {!allRevealed && (
            <div className="flex gap-2">
              <button
                onClick={onRevealNext}
                className="flex-1 bg-pastel-sky hover:bg-pastel-sky/80 text-foreground font-bold py-3 rounded-xl transition-colors"
              >
                Next Vote <span className="text-xs opacity-50">(N)</span>
              </button>
              <button
                onClick={onRevealAll}
                className="flex-1 bg-pastel-peach hover:bg-pastel-peach/80 text-foreground font-bold py-3 rounded-xl transition-colors"
              >
                Reveal All <span className="text-xs opacity-50">(R)</span>
              </button>
            </div>
          )}

          {allRevealed && (
            <>
              <AnimatePresence>
                {voteResult.eliminated && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 bg-difficulty-hard/10 border border-difficulty-hard/30 rounded-xl px-4 py-3 text-center"
                  >
                    <p className="text-sm text-foreground/50">Eliminated</p>
                    <p className="text-xl font-extrabold text-difficulty-hard">
                      {voteResult.eliminated.name}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={onConfirmElimination}
                className="w-full bg-pastel-mint hover:bg-pastel-mint/80 text-foreground font-bold py-3 rounded-xl transition-colors"
              >
                Next Round <span className="text-xs opacity-50">(Enter)</span>
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
