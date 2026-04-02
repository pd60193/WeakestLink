"use client";

import type { Question } from "@/types/game";
import { MONEY_CHAIN, DIFFICULTY_COLORS } from "@/lib/constants";

interface QuestionCardProps {
  question: Question | null;
  chainPosition: number;
  questionsAsked: number;
}

export function QuestionCard({
  question,
  chainPosition,
  questionsAsked,
}: QuestionCardProps) {
  const chainLevel = MONEY_CHAIN[chainPosition - 1];
  const diffColor = chainLevel
    ? DIFFICULTY_COLORS[chainLevel.difficulty]
    : "#A8E6CF";

  return (
    <div className="bg-white/90 rounded-2xl p-5 shadow-sm border border-pastel-lilac/20">
      {/* Chain info bar */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="px-3 py-1 rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: diffColor }}
        >
          Q{chainPosition}
        </span>
        <span className="text-foreground/60 font-semibold text-sm">
          {chainLevel?.value.toLocaleString() ?? 0} pts
        </span>
        <span className="text-foreground/40 text-sm ml-auto">
          #{questionsAsked + 1}
        </span>
      </div>

      {!question ? (
        <p className="text-foreground/40 text-center py-6">No question loaded</p>
      ) : (
        <>
          {/* Question text */}
          <div className="mb-4">
            <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wide mb-1">
              Question
            </p>
            <p className="text-foreground font-semibold text-lg leading-snug">
              {question.text ?? "[Image question]"}
            </p>
            {question.imageUrl && (
              <div className="mt-2 bg-pastel-cream rounded-lg p-2 text-sm text-foreground/50">
                Image: {question.imageUrl}
              </div>
            )}
          </div>

          {/* Answer (always visible to admin) */}
          <div className="bg-pastel-mint/40 rounded-xl px-4 py-3 border border-pastel-mint/60">
            <p className="text-foreground/50 text-xs font-semibold uppercase tracking-wide mb-0.5">
              Answer
            </p>
            <p className="text-foreground font-bold text-xl">{question.answer}</p>
          </div>
        </>
      )}
    </div>
  );
}
