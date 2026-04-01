"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "@/types/game";

interface LobbyViewProps {
  players: Player[];
}

export function LobbyView({ players }: LobbyViewProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-6xl font-extrabold text-foreground mb-2">
          The Weakest Link
        </h1>
        <p className="text-2xl text-foreground/40 font-semibold mb-12">
          Waiting for players to join...
        </p>

        {players.length > 0 && (
          <div className="bg-white/80 rounded-2xl px-8 py-6 shadow-lg inline-block min-w-[400px]">
            <p className="text-sm font-bold text-foreground/40 uppercase tracking-wide mb-4">
              Players ({players.length})
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <AnimatePresence>
                {players.map((player) => (
                  <motion.span
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="bg-pastel-sky/40 px-4 py-2 rounded-full font-semibold text-foreground text-lg"
                  >
                    {player.name}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {players.length === 0 && (
          <div className="bg-white/60 rounded-2xl px-8 py-6 inline-block">
            <p className="text-foreground/30 text-lg">
              Open <code className="bg-pastel-cream px-2 py-0.5 rounded">/player</code> on your phone to join
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
