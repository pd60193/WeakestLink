"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Player, VoteResult } from "@/types/game";

interface VotingPanelProps {
  players: Player[];
  votes: Record<string, string>;
  voteCount: number;
  totalVotersExpected: number;
  voteResult: VoteResult | null;
  onEndVoting: () => void;
}

export function VotingPanel({
  players,
  votes,
  voteCount,
  totalVotersExpected,
  voteResult,
  onEndVoting,
}: VotingPanelProps) {
  const activePlayers = players.filter((p) => !p.isEliminated);

  // Count votes per player
  const voteTally: Record<string, number> = {};
  for (const votedFor of Object.values(votes)) {
    voteTally[votedFor] = (voteTally[votedFor] || 0) + 1;
  }

  return (
    <div className="bg-white/90 rounded-2xl p-5 shadow-sm border border-pastel-rose/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wide">
          Voting
        </h3>
        <span className="text-sm font-semibold text-foreground/60">
          {voteCount} / {totalVotersExpected} votes
        </span>
      </div>

      {/* Vote bars */}
      <div className="space-y-2 mb-4">
        {activePlayers.map((player) => {
          const count = voteTally[player.id] || 0;
          const pct = totalVotersExpected > 0 ? (count / totalVotersExpected) * 100 : 0;
          const isEliminated = voteResult?.eliminated?.id === player.id;

          return (
            <div key={player.id} className="relative">
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold text-sm w-24 truncate ${
                    isEliminated ? "text-difficulty-hard font-bold" : "text-foreground"
                  }`}
                >
                  {player.name}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isEliminated ? "bg-difficulty-hard/60" : "bg-pastel-rose/60"
                    }`}
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

      {/* End voting button */}
      {!voteResult && (
        <button
          onClick={onEndVoting}
          className="w-full bg-pastel-lilac hover:bg-pastel-lilac/80 text-foreground font-bold py-3 rounded-xl transition-colors"
        >
          End Voting & Reveal
        </button>
      )}

      {/* Result */}
      <AnimatePresence>
        {voteResult?.eliminated && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-difficulty-hard/10 border border-difficulty-hard/30 rounded-xl px-4 py-3 text-center"
          >
            <p className="text-sm text-foreground/50">Eliminated</p>
            <p className="text-xl font-extrabold text-difficulty-hard">
              {voteResult.eliminated.name}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
