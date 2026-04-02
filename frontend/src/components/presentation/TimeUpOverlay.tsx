"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { RoundMetrics } from "@/hooks/useRoundMetrics";
import { RoundStats } from "./RoundStats";

interface TimeUpOverlayProps {
  visible: boolean;
  onShow?: () => void;
  metrics?: RoundMetrics;
  nextRound?: number | null;
}

export function TimeUpOverlay({ visible, onShow, metrics, nextRound }: TimeUpOverlayProps) {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (visible && !hasPlayed.current) {
      hasPlayed.current = true;
      onShow?.();
    }
    if (!visible) {
      hasPlayed.current = false;
    }
  }, [visible, onShow]);

  if (!visible) return null;

  return (
    <div className="flex items-center justify-center h-full w-full">
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="bg-white/90 rounded-3xl px-16 py-12 shadow-2xl border-4 border-pastel-rose">
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-6xl font-black text-foreground tracking-tight"
          >
            TIME&apos;S UP!
          </motion.h1>
        </div>
        {metrics && <RoundStats metrics={metrics} />}
        {nextRound != null && (
          <span className="text-sm font-semibold text-white/80 tracking-widest uppercase">
            Press Enter to move to Round {nextRound}
          </span>
        )}
      </motion.div>
    </div>
  );
}
