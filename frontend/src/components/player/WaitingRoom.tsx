"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "@/types/game";

interface WaitingRoomProps {
  players: Player[];
  currentPlayerName: string;
}

export function WaitingRoom({ players, currentPlayerName }: WaitingRoomProps) {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-foreground mb-1">
            Welcome, {currentPlayerName}!
          </h2>
          <p className="text-foreground/40 font-medium">
            Waiting for the host to start...
          </p>
        </div>

        <div className="bg-white/90 rounded-2xl p-5 shadow-sm border border-pastel-lilac/20">
          <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wide mb-3">
            Players ({players.length})
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${
                    player.name === currentPlayerName
                      ? "bg-pastel-sky/40 border border-pastel-sky/60"
                      : "bg-pastel-cream/50"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-pastel-lilac/40 flex items-center justify-center text-xs font-bold text-foreground/50">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {player.name}
                    {player.name === currentPlayerName && (
                      <span className="text-foreground/40 ml-1">(you)</span>
                    )}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-pastel-lilac"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
