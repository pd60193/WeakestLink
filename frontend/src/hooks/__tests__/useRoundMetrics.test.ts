import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRoundMetrics } from "@/hooks/useRoundMetrics";

describe("useRoundMetrics", () => {
  it("initializes with zero questions answered", () => {
    const { result } = renderHook(() => useRoundMetrics());
    const metrics = result.current.getMetrics(0);
    expect(metrics.questionsAnswered).toBe(0);
    expect(metrics.longestStreak).toBe(0);
    expect(metrics.highestChainPosition).toBe(1);
  });

  it("recordCorrect increments questionsAnswered", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    const metrics = result.current.getMetrics(0);
    expect(metrics.questionsAnswered).toBe(1);
  });

  it("recordCorrect tracks highest chain position", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.recordCorrect(5, "Bob"));
    act(() => result.current.recordCorrect(2, "Alice"));
    const metrics = result.current.getMetrics(0);
    expect(metrics.highestChainPosition).toBe(5);
  });

  it("recordCorrect tracks streak", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    act(() => result.current.recordCorrect(3, "Bob"));
    act(() => result.current.recordCorrect(4, "Alice"));
    expect(result.current.getCurrentStreak()).toBe(3);
    const metrics = result.current.getMetrics(0);
    expect(metrics.longestStreak).toBe(3);
  });

  it("recordIncorrect resets current streak to 0", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.recordIncorrect());
    expect(result.current.getCurrentStreak()).toBe(0);
  });

  it("recordIncorrect does NOT reduce longestStreak", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.recordCorrect(4, "Alice")); // streak=3
    act(() => result.current.recordIncorrect()); // streak=0 but longest=3
    const metrics = result.current.getMetrics(0);
    expect(metrics.longestStreak).toBe(3);
  });

  it("tiebreaker tier 1: single player with most correct wins", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.recordCorrect(2, "Bob"));
    const metrics = result.current.getMetrics(0);
    expect(metrics.strongestLinks).toEqual(["Alice"]);
  });

  it("tiebreaker tier 2: tied on correct count → highest total question value wins", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => {
      // Alice answers chain position 2 (value 250), Bob answers position 5 (value 1750)
      result.current.recordCorrect(2, "Alice");
      result.current.recordCorrect(5, "Bob");
    });
    const metrics = result.current.getMetrics(0, ["Alice", "Bob"]);
    expect(metrics.strongestLinks).toEqual(["Bob"]);
  });

  it("tiebreaker tier 3: tied on correct AND question value → earliest in playerOrder wins", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => {
      // Both answer the same chain position (same value)
      result.current.recordCorrect(3, "Alice");
      result.current.recordCorrect(3, "Bob");
    });
    const metrics = result.current.getMetrics(0, ["Alice", "Bob"]);
    expect(metrics.strongestLinks).toEqual(["Alice"]);
  });

  it("no correct answers → strongestLinks is empty", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordIncorrect());
    const metrics = result.current.getMetrics(0);
    expect(metrics.strongestLinks).toEqual([]);
  });

  it("recordBank accumulates per-player amounts", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => {
      result.current.recordBank(100, "Alice");
      result.current.recordBank(250, "Alice");
      result.current.recordBank(500, "Bob");
    });
    const counts = result.current.getPlayerBankedCounts();
    expect(counts).toEqual({ Alice: 350, Bob: 500 });
  });

  it("reset clears all counters and maps", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => {
      result.current.recordCorrect(3, "Alice");
      result.current.recordBank(100, "Alice");
    });
    act(() => result.current.reset());
    const metrics = result.current.getMetrics(0);
    expect(metrics.questionsAnswered).toBe(0);
    expect(metrics.longestStreak).toBe(0);
    expect(result.current.getPlayerCorrectCounts()).toEqual({});
    expect(result.current.getPlayerBankedCounts()).toEqual({});
  });

  it("restoreMetrics sets all fields from saved object", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() =>
      result.current.restoreMetrics({
        questionsAnswered: 10,
        highestChainPosition: 7,
        longestStreak: 5,
        currentStreak: 2,
        playerCorrectCounts: { Alice: 6, Bob: 4 },
        playerCorrectValues: { Alice: 5000, Bob: 3000 },
        playerBankedCounts: { Alice: 1000, Bob: 2000 },
      })
    );
    const metrics = result.current.getMetrics(3000);
    expect(metrics.questionsAnswered).toBe(10);
    expect(metrics.highestChainPosition).toBe(7);
    expect(metrics.longestStreak).toBe(5);
    expect(result.current.getCurrentStreak()).toBe(2);
    expect(result.current.getPlayerCorrectCounts()).toEqual({ Alice: 6, Bob: 4 });
    expect(result.current.getPlayerBankedCounts()).toEqual({ Alice: 1000, Bob: 2000 });
  });

  it("getPlayerCorrectCounts returns plain object from Map", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(2, "Alice"));
    const counts = result.current.getPlayerCorrectCounts();
    expect(counts).toEqual({ Alice: 1 });
    expect(typeof counts).toBe("object");
  });

  it("recordCorrect tracks per-player total question value", () => {
    const { result } = renderHook(() => useRoundMetrics());
    // Chain position 1 = 100, position 3 = 500
    act(() => result.current.recordCorrect(1, "Alice"));
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.recordCorrect(5, "Bob"));
    const values = result.current.getPlayerCorrectValues();
    expect(values).toEqual({ Alice: 600, Bob: 1750 });
  });

  it("reset clears playerCorrectValues", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() => result.current.recordCorrect(3, "Alice"));
    act(() => result.current.reset());
    expect(result.current.getPlayerCorrectValues()).toEqual({});
  });

  it("restoreMetrics restores playerCorrectValues", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() =>
      result.current.restoreMetrics({
        questionsAnswered: 5,
        highestChainPosition: 3,
        longestStreak: 2,
        currentStreak: 1,
        playerCorrectCounts: { Alice: 3 },
        playerCorrectValues: { Alice: 850 },
        playerBankedCounts: {},
      })
    );
    expect(result.current.getPlayerCorrectValues()).toEqual({ Alice: 850 });
  });

  it("restoreMetrics handles missing playerCorrectValues gracefully", () => {
    const { result } = renderHook(() => useRoundMetrics());
    act(() =>
      result.current.restoreMetrics({
        questionsAnswered: 5,
        highestChainPosition: 3,
        longestStreak: 2,
        currentStreak: 1,
        playerCorrectCounts: { Alice: 3 },
        playerCorrectValues: {},
        playerBankedCounts: {},
      })
    );
    expect(result.current.getPlayerCorrectValues()).toEqual({});
  });
});
