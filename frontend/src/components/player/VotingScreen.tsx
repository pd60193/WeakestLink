"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Player } from "@/types/game";

interface VotingScreenProps {
  players: Player[];
  currentPlayerId: string;
  hasVoted: boolean;
  voteCount: number;
  totalVotersExpected: number;
  onVote: (votedForId: string) => void;
}

export function VotingScreen({
  players,
  currentPlayerId,
  hasVoted,
  voteCount,
  totalVotersExpected,
  onVote,
}: VotingScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const activePlayers = players.filter(
    (p) => !p.isEliminated && p.id !== currentPlayerId
  );

  const handleConfirm = () => {
    if (selected) {
      onVote(selected);
    }
  };

  if (hasVoted) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-pastel-mint/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">
            Vote Cast!
          </h2>
          <p className="text-foreground/40 font-medium">
            Waiting for others... ({voteCount}/{totalVotersExpected})
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-pastel-rose"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col px-6 py-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">
          Vote for the Weakest Link
        </h2>
        <p className="text-foreground/40 font-medium text-sm">
          Who should be eliminated?
        </p>
      </div>

      {/* Player cards */}
      <div className="flex-1 space-y-3 mb-6">
        {activePlayers.map((player) => {
          const isSelected = selected === player.id;
          return (
            <motion.button
              key={player.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(player.id)}
              className={`w-full text-left px-5 py-4 rounded-xl font-semibold text-lg transition-all ${
                isSelected
                  ? "bg-pastel-rose border-2 border-pastel-rose shadow-md text-foreground"
                  : "bg-white/90 border-2 border-transparent shadow-sm text-foreground hover:bg-white"
              }`}
            >
              {player.name}
              {isSelected && (
                <span className="float-right text-foreground/60">&#10003;</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full bg-pastel-rose hover:bg-pastel-rose/80 disabled:bg-gray-200 disabled:text-gray-400 text-foreground font-bold text-lg py-4 rounded-xl transition-colors"
      >
        Confirm Vote
      </motion.button>
    </div>
  );
}
