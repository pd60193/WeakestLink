import { Question } from "@/types/game";

/** Deterministic question set for tests — 3 per difficulty, 15 total */
export const TEST_QUESTIONS: Question[] = [
  // Easy (3)
  { id: "e1", text: "Easy question 1", answer: "A1", difficulty: "Easy", round: 1 },
  { id: "e2", text: "Easy question 2", answer: "A2", difficulty: "Easy", round: 1 },
  { id: "e3", text: "Easy question 3", answer: "A3", difficulty: "Easy", round: 1 },
  // Medium (3)
  { id: "m1", text: "Medium question 1", answer: "B1", difficulty: "Medium", round: 1 },
  { id: "m2", text: "Medium question 2", answer: "B2", difficulty: "Medium", round: 1 },
  { id: "m3", text: "Medium question 3", answer: "B3", difficulty: "Medium", round: 1 },
  // Medium-Hard (3)
  { id: "mh1", text: "Medium-Hard question 1", answer: "C1", difficulty: "Medium-Hard", round: 1 },
  { id: "mh2", text: "Medium-Hard question 2", answer: "C2", difficulty: "Medium-Hard", round: 1 },
  { id: "mh3", text: "Medium-Hard question 3", answer: "C3", difficulty: "Medium-Hard", round: 1 },
  // Hard (3)
  { id: "h1", text: "Hard question 1", answer: "D1", difficulty: "Hard", round: 1 },
  { id: "h2", text: "Hard question 2", answer: "D2", difficulty: "Hard", round: 1 },
  { id: "h3", text: "Hard question 3", answer: "D3", difficulty: "Hard", round: 1 },
  // Spicy (3)
  { id: "s1", text: "Spicy question 1", answer: "E1", difficulty: "Spicy", round: 1 },
  { id: "s2", text: "Spicy question 2", answer: "E2", difficulty: "Spicy", round: 1 },
  { id: "s3", text: "Spicy question 3", answer: "E3", difficulty: "Spicy", round: 1 },
];

/** Minimal question set — just 2 Easy questions for edge case testing */
export const MINIMAL_QUESTIONS: Question[] = [
  { id: "min1", text: "Minimal Q1", answer: "A", difficulty: "Easy", round: 1 },
  { id: "min2", text: "Minimal Q2", answer: "B", difficulty: "Easy", round: 1 },
];

/** Test players */
export const TEST_PLAYERS = [
  { id: "p1", name: "Alice", isEliminated: false },
  { id: "p2", name: "Bob", isEliminated: false },
  { id: "p3", name: "Charlie", isEliminated: false },
];
