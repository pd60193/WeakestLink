"use client";

import { motion } from "framer-motion";
import { MONEY_CHAIN, DIFFICULTY_COLORS } from "@/lib/constants";

interface MoneyChainProps {
  chainPosition: number;
}

export function MoneyChain({ chainPosition }: MoneyChainProps) {
  const reversedChain = [...MONEY_CHAIN].reverse();

  return (
    <div className="flex flex-col gap-2 w-full max-w-[220px]">
      <h3 className="text-sm font-bold text-center uppercase tracking-widest text-foreground/60 mb-1">
        Money Chain
      </h3>
      {reversedChain.map((level) => {
        const isActive = level.position === chainPosition;
        const isBelow = level.position < chainPosition;
        const difficultyColor = DIFFICULTY_COLORS[level.difficulty];

        return (
          <motion.div
            key={level.position}
            animate={{
              scale: isActive ? 1.08 : 1,
              opacity: isBelow ? 0.45 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative flex items-center rounded-xl overflow-hidden"
            style={{
              boxShadow: isActive
                ? `0 0 20px ${difficultyColor}88, 0 4px 12px rgba(0,0,0,0.08)`
                : "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            {/* Difficulty color band */}
            <div
              className="w-2 self-stretch shrink-0"
              style={{ backgroundColor: difficultyColor }}
            />

            <div
              className="flex-1 flex items-center justify-between px-4 py-2.5 transition-colors duration-300"
              style={{
                backgroundColor: isActive ? `${difficultyColor}40` : "#FFFFFF",
              }}
            >
              <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wide">
                Q{level.position}
              </span>
              <span
                className={`text-lg font-extrabold tabular-nums ${
                  isActive ? "text-foreground" : "text-foreground/70"
                }`}
              >
                {level.value.toLocaleString()}
                {level.position === 9 && " 🌶️"}
              </span>
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="chain-indicator"
                className="absolute -left-1 w-4 h-4 rounded-full"
                style={{ backgroundColor: difficultyColor }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
