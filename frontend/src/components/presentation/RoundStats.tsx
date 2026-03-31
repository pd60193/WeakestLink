"use client";

import { motion } from "framer-motion";
import { RoundMetrics } from "@/hooks/useRoundMetrics";

interface RoundStatsProps {
  metrics: RoundMetrics;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function RoundStats({ metrics }: RoundStatsProps) {
  const strongestLinkDisplay =
    metrics.strongestLinks.length > 0
      ? metrics.strongestLinks.join(", ")
      : "—";

  const stats = [
    {
      label: "Questions Answered",
      value: metrics.questionsAnswered.toString(),
      color: "bg-pastel-sky",
    },
    {
      label: "Amount Gained",
      value: `${metrics.bankedThisRound.toLocaleString()} pts`,
      color: "bg-pastel-mint",
    },
    {
      label: "Highest Chain Reached",
      value: `Q${metrics.highestChainPosition} — ${metrics.highestChainValue.toLocaleString()}`,
      color: "bg-pastel-lilac",
    },
    {
      label: "Longest Streak",
      value: `${metrics.longestStreak} in a row`,
      color: "bg-pastel-peach",
    },
    {
      label: "Strongest Link",
      value: strongestLinkDisplay,
      color: "bg-pastel-rose",
    },
  ];

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="bg-white/90 rounded-2xl p-6 shadow-xl border border-pastel-sky/30 w-[320px]"
    >
      <h2 className="text-sm font-bold uppercase tracking-widest text-foreground/50 mb-4 text-center">
        Round Stats
      </h2>
      <div className="flex flex-col gap-3">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="flex items-center gap-3"
          >
            <div className={`w-2 h-8 rounded-full ${stat.color} shrink-0`} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground/40 block">
                {stat.label}
              </span>
              <span className="text-lg font-extrabold text-foreground">
                {stat.value}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
