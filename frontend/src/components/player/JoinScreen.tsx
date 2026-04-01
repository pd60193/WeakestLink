"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface JoinScreenProps {
  onJoin: (name: string) => void;
  playerCount: number;
  isJoining: boolean;
  error: string | null;
}

export function JoinScreen({ onJoin, playerCount, isJoining, error }: JoinScreenProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-8">
          <div className="w-16 h-16 bg-pastel-rose/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">&#127919;</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground mb-1">
            The Weakest Link
          </h1>
          <p className="text-foreground/40 font-medium">Join the game</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoFocus
            className="w-full text-center text-xl font-semibold bg-white/90 border-2 border-pastel-lilac/30 rounded-xl px-4 py-4 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-pastel-lilac transition-colors"
          />

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-difficulty-hard text-sm font-semibold"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!name.trim() || isJoining}
            className="w-full bg-pastel-mint hover:bg-pastel-mint/80 disabled:bg-gray-200 disabled:text-gray-400 text-foreground font-bold text-lg py-4 rounded-xl transition-colors"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </motion.button>
        </form>

        <p className="mt-6 text-foreground/30 text-sm font-medium">
          {playerCount > 0 ? `${playerCount} player${playerCount !== 1 ? "s" : ""} waiting` : "Waiting for host to create a game"}
        </p>
      </motion.div>
    </div>
  );
}
