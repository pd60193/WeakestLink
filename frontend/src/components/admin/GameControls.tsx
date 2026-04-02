"use client";

import { motion } from "framer-motion";
import type { GamePhase } from "@/types/game";

interface GameControlsProps {
  phase: GamePhase;
  chainPosition: number;
  timerRunning: boolean;
  timerPaused: boolean;
  onAction: (action: string) => void;
}

const buttonBase =
  "rounded-xl font-bold text-lg px-6 py-4 min-h-[56px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export function GameControls({
  phase,
  chainPosition,
  timerRunning,
  timerPaused,
  onAction,
}: GameControlsProps) {
  const isPlaying = phase === "playing";
  const canAnswer = isPlaying;
  const canBank = isPlaying && chainPosition > 1;

  return (
    <div className="space-y-4">
      {/* Primary game actions */}
      <div className="grid grid-cols-3 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`${buttonBase} bg-difficulty-easy/80 hover:bg-difficulty-easy text-foreground`}
          disabled={!canAnswer}
          onClick={() => onAction("correct")}
        >
          <span className="block text-2xl mb-0.5">{"\u2713"}</span>
          Correct
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`${buttonBase} bg-difficulty-hard/80 hover:bg-difficulty-hard text-white`}
          disabled={!canAnswer}
          onClick={() => onAction("incorrect")}
        >
          <span className="block text-2xl mb-0.5">{"\u2717"}</span>
          Incorrect
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`${buttonBase} bg-pastel-yellow hover:bg-pastel-yellow/80 text-foreground border-2 border-yellow-400/30`}
          disabled={!canBank}
          onClick={() => onAction("bank")}
        >
          <span className="block text-2xl mb-0.5">$</span>
          Bank
        </motion.button>
      </div>

      {/* Timer controls */}
      <div className="grid grid-cols-1 gap-3">
        {!timerRunning ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`${buttonBase} bg-pastel-mint hover:bg-pastel-mint/80 text-foreground`}
            disabled={!isPlaying}
            onClick={() => onAction("start_timer")}
          >
            {"\u25B6"} Start Timer
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`${buttonBase} ${timerPaused ? "bg-pastel-mint hover:bg-pastel-mint/80" : "bg-pastel-peach hover:bg-pastel-peach/80"} text-foreground`}
            onClick={() => onAction("toggle_pause")}
          >
            {timerPaused ? "\u25B6 Resume" : "\u23F8 Pause"}
          </motion.button>
        )}
      </div>
    </div>
  );
}
