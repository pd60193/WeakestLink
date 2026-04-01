"use client";

import { motion } from "framer-motion";
import { PersistedGameSession } from "@/lib/sessionPersistence";

interface ResumePromptProps {
  session: PersistedGameSession;
  onResume: () => void;
  onNewGame: () => void;
}

export function ResumePrompt({ session, onResume, onNewGame }: ResumePromptProps) {
  const minutes = Math.floor(session.timeRemaining / 60);
  const seconds = session.timeRemaining % 60;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="bg-white/90 rounded-3xl p-10 shadow-2xl border-2 border-pastel-sky/40 max-w-md w-full"
      >
        <h2 className="text-2xl font-black text-foreground text-center mb-6">
          Previous Session Found
        </h2>

        <div className="flex flex-col gap-3 mb-8">
          <div className="flex justify-between items-center px-4 py-2 bg-pastel-lilac/30 rounded-xl">
            <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wide">Round</span>
            <span className="text-lg font-extrabold text-foreground">{session.currentRound}</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 bg-pastel-mint/30 rounded-xl">
            <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wide">Total Banked</span>
            <span className="text-lg font-extrabold text-foreground">{session.totalBanked.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 bg-pastel-peach/30 rounded-xl">
            <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wide">Time Left</span>
            <span className="text-lg font-extrabold text-foreground">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
          <div className="flex justify-between items-center px-4 py-2 bg-pastel-sky/30 rounded-xl">
            <span className="text-sm font-semibold text-foreground/50 uppercase tracking-wide">Questions Asked</span>
            <span className="text-lg font-extrabold text-foreground">{session.questionsAsked}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onResume}
            className="flex-1 py-3 px-6 bg-pastel-mint hover:bg-pastel-mint/80 rounded-xl font-bold text-foreground text-lg transition-colors"
          >
            Resume Game
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 py-3 px-6 bg-pastel-rose hover:bg-pastel-rose/80 rounded-xl font-bold text-foreground text-lg transition-colors"
          >
            New Game
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
