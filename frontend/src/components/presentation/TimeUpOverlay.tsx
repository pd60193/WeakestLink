"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface TimeUpOverlayProps {
  visible: boolean;
}

function playBuzzer() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Descending buzzer tone
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);

    // Second tone for a "game over" feel
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "square";
    osc2.frequency.setValueAtTime(330, ctx.currentTime + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(165, ctx.currentTime + 1.0);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc2.start(ctx.currentTime + 0.3);
    osc2.stop(ctx.currentTime + 1.2);
  } catch {
    // Web Audio API not available
  }
}

export function TimeUpOverlay({ visible }: TimeUpOverlayProps) {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (visible && !hasPlayed.current) {
      hasPlayed.current = true;
      playBuzzer();
    }
    if (!visible) {
      hasPlayed.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-md"
    >
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
        <span className="text-sm font-semibold text-white/80 tracking-widest uppercase">
          Press Escape to dismiss
        </span>
      </motion.div>
    </motion.div>
  );
}
