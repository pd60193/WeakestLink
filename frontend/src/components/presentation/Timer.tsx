"use client";

import { motion } from "framer-motion";

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
}

export function Timer({ timeRemaining, totalTime, isRunning, isPaused }: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = totalTime > 0 ? timeRemaining / totalTime : 1;

  // Color shifts based on remaining time
  const getColor = () => {
    if (progress > 0.5) return "#A8E6CF"; // pastel green
    if (progress > 0.25) return "#FFF5CC"; // pastel yellow
    return "#FFAAA5"; // pastel coral
  };

  const getStrokeColor = () => {
    if (progress > 0.5) return "#6BC5A0";
    if (progress > 0.25) return "#F0D080";
    return "#E87A75";
  };

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/60">
        Timer
      </h3>

      <div className="relative w-[220px] h-[220px]">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#F0EDE8"
            strokeWidth="10"
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "linear" }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-5xl font-extrabold tabular-nums"
            style={{ color: getStrokeColor() }}
            animate={{ scale: timeRemaining <= 10 && isRunning ? [1, 1.1, 1] : 1 }}
            transition={{ duration: 1, repeat: timeRemaining <= 10 ? Infinity : 0 }}
          >
            {minutes}:{seconds.toString().padStart(2, "0")}
          </motion.span>

          {isPaused && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs font-bold uppercase tracking-widest text-foreground/50 mt-1"
            >
              Paused
            </motion.span>
          )}

          {!isRunning && !isPaused && timeRemaining > 0 && (
            <span className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mt-1">
              Press T
            </span>
          )}
        </div>
      </div>

      {/* Subtle background glow */}
      <div
        className="w-48 h-48 absolute rounded-full blur-3xl opacity-20 -z-10"
        style={{ backgroundColor: getColor() }}
      />
    </div>
  );
}
