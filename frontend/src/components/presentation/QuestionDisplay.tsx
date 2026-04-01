"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useImperativeHandle, forwardRef } from "react";
import { Question } from "@/types/game";
import { useTypewriter } from "@/hooks/useTypewriter";

interface QuestionDisplayProps {
  question: Question | null;
  revealed: boolean;
  questionNumber: number;
  revealedAnswer?: string | null;
}

export interface QuestionDisplayHandle {
  snapComplete: () => void;
}

export const QuestionDisplay = forwardRef<
  QuestionDisplayHandle,
  QuestionDisplayProps
>(function QuestionDisplay({ question, revealed, questionNumber, revealedAnswer }, ref) {
  const hasImage = !!question?.imageUrl;
  const questionText = question?.text ?? "";

  const { displayedText, isComplete, snapComplete } = useTypewriter({
    text: revealed ? questionText : "",
    speed: 40,
    enabled: revealed && questionText.length > 0,
  });

  useImperativeHandle(ref, () => ({ snapComplete }), [snapComplete]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-pastel-sky flex items-center justify-center"
            >
              <span className="text-3xl">?</span>
            </motion.div>
            <span className="text-lg font-semibold text-foreground/40 tracking-wide">
              Press Space to reveal
            </span>
          </motion.div>
        ) : (
          <motion.div
            key={`q-${questionNumber}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-pastel-sky/30">
              <span className="text-xs font-bold uppercase tracking-widest text-pastel-sky mb-4 block">
                Question {questionNumber}
              </span>

              {hasImage && (
                <div className="flex justify-center mb-4">
                  <div className="rounded-xl overflow-hidden border-2 border-pastel-peach/40 shadow-md bg-white/60 p-2">
                    <img
                      src={question.imageUrl}
                      alt={`Question ${questionNumber}`}
                      className="max-h-[320px] max-w-full w-auto h-auto object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              {questionText.length > 0 && (
                <p
                  className={`text-3xl font-bold text-foreground leading-snug ${hasImage ? "text-center" : ""}`}
                >
                  {displayedText}
                  {!isComplete && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-[3px] h-[1em] bg-foreground/60 ml-0.5 align-baseline"
                    />
                  )}
                </p>
              )}

              {questionText.length === 0 && !hasImage && (
                <p className="text-3xl font-bold text-foreground leading-snug">
                  No more questions
                </p>
              )}
            </div>

            <AnimatePresence>
              {revealedAnswer && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-4 bg-pastel-peach/30 backdrop-blur-sm rounded-xl px-6 py-4 border border-pastel-peach/50 text-center"
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-pastel-peach block mb-1">
                    Answer
                  </span>
                  <p className="text-2xl font-bold text-foreground">
                    {revealedAnswer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {question && !revealedAnswer && (
              <div className="mt-4 flex justify-center gap-6 text-sm font-semibold text-foreground/40">
                <span>C = Correct</span>
                <span>X = Incorrect</span>
                <span>B = Bank</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
