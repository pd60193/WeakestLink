import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  saveSession,
  loadSession,
  clearSession,
  debouncedSave,
  flushSave,
  findQuestionById,
  type PersistedGameSession,
} from "@/lib/sessionPersistence";

const STORAGE_KEY = "weakest-link-session";

function makeMockSession(overrides: Partial<PersistedGameSession> = {}): PersistedGameSession {
  return {
    version: 1,
    currentRound: 1,
    chainPosition: 3,
    bankedThisRound: 500,
    totalBanked: 1500,
    currentPlayerIndex: 2,
    timeUp: false,
    questionsAsked: 5,
    currentQuestionId: "q1",
    usedQuestionIds: ["q1", "q2"],
    timeRemaining: 120,
    isMuted: false,
    questionsAnswered: 5,
    highestChainPosition: 4,
    longestStreak: 3,
    currentStreak: 1,
    playerCorrectCounts: { Alice: 3, Bob: 2 },
    playerBankedCounts: { Alice: 500, Bob: 1000 },
    ...overrides,
  };
}

describe("sessionPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Drain any pending debounce to avoid cross-test pollution
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    localStorage.clear();
  });

  it("saveSession writes JSON to localStorage", () => {
    const session = makeMockSession();
    saveSession(session);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.currentRound).toBe(1);
    expect(stored.chainPosition).toBe(3);
  });

  it("loadSession returns null when storage is empty", () => {
    expect(loadSession()).toBeNull();
  });

  it("loadSession returns null on version mismatch", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...makeMockSession(), version: 999 }));
    expect(loadSession()).toBeNull();
  });

  it("loadSession round-trips correctly with saveSession", () => {
    const session = makeMockSession();
    saveSession(session);
    const loaded = loadSession();
    expect(loaded).toEqual(session);
  });

  it("loadSession returns null on corrupted JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{{");
    expect(loadSession()).toBeNull();
  });

  it("clearSession removes the key", () => {
    saveSession(makeMockSession());
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    clearSession();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saveSession silently catches when localStorage throws", () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("QuotaExceeded");
    };
    expect(() => saveSession(makeMockSession())).not.toThrow();
    Storage.prototype.setItem = originalSetItem;
  });

  it("debouncedSave does NOT write before 500ms", () => {
    debouncedSave(makeMockSession());
    vi.advanceTimersByTime(400);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("debouncedSave writes after 500ms", () => {
    debouncedSave(makeMockSession({ chainPosition: 7 }));
    vi.advanceTimersByTime(500);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.chainPosition).toBe(7);
  });

  it("rapid debouncedSave calls — only last state saved", () => {
    debouncedSave(makeMockSession({ chainPosition: 1 }));
    vi.advanceTimersByTime(100);
    debouncedSave(makeMockSession({ chainPosition: 2 }));
    vi.advanceTimersByTime(100);
    debouncedSave(makeMockSession({ chainPosition: 3 }));
    vi.advanceTimersByTime(500);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.chainPosition).toBe(3);
  });

  it("flushSave cancels pending debounce and writes immediately", () => {
    debouncedSave(makeMockSession({ chainPosition: 1 }));
    flushSave(makeMockSession({ chainPosition: 9 }));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.chainPosition).toBe(9);
    // Advancing past debounce should not overwrite
    vi.advanceTimersByTime(1000);
    const stored2 = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored2.chainPosition).toBe(9);
  });

  it("flushSave works without prior debouncedSave", () => {
    expect(() => flushSave(makeMockSession())).not.toThrow();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("findQuestionById returns matching question", () => {
    const questions = [
      { id: "q1", text: "Q1", answer: "A", difficulty: "Easy" as const, round: 1 },
      { id: "q2", text: "Q2", answer: "B", difficulty: "Easy" as const, round: 1 },
    ];
    expect(findQuestionById(questions, "q2")?.text).toBe("Q2");
  });

  it("findQuestionById returns null for null id", () => {
    expect(findQuestionById([], null)).toBeNull();
  });

  it("findQuestionById returns null for non-existent id", () => {
    const questions = [
      { id: "q1", text: "Q1", answer: "A", difficulty: "Easy" as const, round: 1 },
    ];
    expect(findQuestionById(questions, "nope")).toBeNull();
  });
});
