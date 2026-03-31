"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface TimeUpOverlayProps {
  visible: boolean;
  onShow?: () => void;
}

export function TimeUpOverlay({ visible, onShow }: TimeUpOverlayProps) {
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
