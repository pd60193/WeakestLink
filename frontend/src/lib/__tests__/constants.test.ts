import { describe, it, expect } from "vitest";
import {
  MONEY_CHAIN,
  DIFFICULTY_COLORS,
  DEFAULT_ROUNDS,
  MOCK_QUESTIONS,
} from "@/lib/constants";
import { Difficulty } from "@/types/game";

describe("MONEY_CHAIN", () => {
  it("has exactly 9 levels", () => {
    expect(MONEY_CHAIN).toHaveLength(9);
  });

  it("positions are 1-9 in ascending order", () => {
    const positions = MONEY_CHAIN.map((l) => l.position);
    expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("values are strictly increasing", () => {
    for (let i = 1; i < MONEY_CHAIN.length; i++) {
      expect(MONEY_CHAIN[i].value).toBeGreaterThan(MONEY_CHAIN[i - 1].value);
    }
  });

  it("every difficulty has a corresponding DIFFICULTY_COLORS entry", () => {
    const difficulties = new Set(MONEY_CHAIN.map((l) => l.difficulty));
    for (const d of difficulties) {
      expect(DIFFICULTY_COLORS[d]).toBeDefined();
      expect(DIFFICULTY_COLORS[d]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe("MOCK_QUESTIONS", () => {
  it("have unique IDs", () => {
    const ids = MOCK_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all have valid Difficulty values", () => {
    const validDifficulties: Difficulty[] = [
      "Easy",
      "Medium",
      "Medium-Hard",
      "Hard",
      "Spicy",
    ];
    for (const q of MOCK_QUESTIONS) {
      expect(validDifficulties).toContain(q.difficulty);
    }
  });
});

describe("DEFAULT_ROUNDS", () => {
  it("durations are decreasing", () => {
    for (let i = 1; i < DEFAULT_ROUNDS.length; i++) {
      expect(DEFAULT_ROUNDS[i].durationSeconds).toBeLessThan(
        DEFAULT_ROUNDS[i - 1].durationSeconds
      );
    }
  });
});
