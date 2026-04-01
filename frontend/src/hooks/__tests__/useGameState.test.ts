import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameState } from "@/hooks/useGameState";
import { TEST_QUESTIONS, MINIMAL_QUESTIONS, TEST_PLAYERS } from "@/__tests__/helpers/testQuestions";

describe("useGameState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0); // always pick first match
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createHook(questions = TEST_QUESTIONS, players = TEST_PLAYERS) {
    return renderHook(() => useGameState({ questions, players }));
  }

  it("initializes at round 1, chain position 1, zero banked", () => {
    const { result } = createHook();
    expect(result.current.currentRound).toBe(1);
    expect(result.current.chainPosition).toBe(1);
    expect(result.current.bankedThisRound).toBe(0);
    expect(result.current.totalBanked).toBe(0);
    expect(result.current.questionsAsked).toBe(0);
  });

  it("currentPlayer cycles through activePlayers", () => {
    const { result } = createHook();
    expect(result.current.currentPlayer?.name).toBe("Alice");

    // markCorrect advances player
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    // After advancing, currentPlayerIndex increments by 1
    expect(result.current.currentPlayer?.name).toBe("Bob");
  });

  it("markCorrect advances chain position by 1", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    expect(result.current.chainPosition).toBe(2);
  });

  it("markCorrect at position 9 auto-banks 10,000 and resets to 1", () => {
    const { result } = createHook();

    // Move to position 9 by setting chain position manually via multiple corrects
    for (let i = 0; i < 8; i++) {
      act(() => result.current.revealQuestion());
      act(() => result.current.markCorrect());
    }
    expect(result.current.chainPosition).toBe(9);

    // One more correct at position 9
    act(() => {
      vi.advanceTimersByTime(1000); // reveal pending
    });
    act(() => result.current.markCorrect());
    expect(result.current.chainPosition).toBe(1);
    expect(result.current.bankedThisRound).toBe(10000);
    expect(result.current.totalBanked).toBe(10000);
  });

  it("markIncorrect resets chain to position 1", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // chain=2
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => result.current.markIncorrect());
    expect(result.current.chainPosition).toBe(1);
  });

  it("bank at position 1 banks nothing", () => {
    const { result } = createHook();
    act(() => result.current.bank());
    expect(result.current.bankedThisRound).toBe(0);
    expect(result.current.totalBanked).toBe(0);
  });

  it("bank at position 2 banks value of position 1 (100)", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // chain=2
    act(() => result.current.bank());
    expect(result.current.bankedThisRound).toBe(100);
    expect(result.current.chainPosition).toBe(1);
  });

  it("bank at position 5 banks value of position 4 (1000)", () => {
    const { result } = createHook();
    for (let i = 0; i < 4; i++) {
      act(() => result.current.revealQuestion());
      act(() => result.current.markCorrect());
    }
    expect(result.current.chainPosition).toBe(5);
    act(() => result.current.bank());
    expect(result.current.bankedThisRound).toBe(1000);
  });

  it("bank does not mark question as used", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    const questionBeforeBank = result.current.currentQuestion;
    act(() => result.current.markCorrect()); // chain=2, marks e1 used
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const usedBefore = result.current.getUsedQuestionIds().length;
    act(() => result.current.bank());
    const usedAfter = result.current.getUsedQuestionIds().length;
    expect(usedAfter).toBe(usedBefore); // bank didn't add to used
  });

  it("bank does not increment questionsAsked", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // questionsAsked=1
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const askedBefore = result.current.questionsAsked;
    act(() => result.current.bank());
    expect(result.current.questionsAsked).toBe(askedBefore);
  });

  it("advanceToNextQuestion sets pendingReveal → reveals after 1s", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    expect(result.current.questionRevealed).toBe(true);

    act(() => result.current.markCorrect());
    // After markCorrect, questionRevealed is false (pending)
    expect(result.current.questionRevealed).toBe(false);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.questionRevealed).toBe(true);
  });

  it("question selection falls back when pool exhausted for difficulty", () => {
    // Use minimal questions (only Easy)
    const { result } = createHook(MINIMAL_QUESTIONS);
    // Use both Easy questions
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // uses min1, advances to chain 2 (Easy)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => result.current.markCorrect()); // uses min2, chain 3 (Medium)
    // No Medium questions in MINIMAL set, but should fall back to unused
    // At this point both questions are used, so next question could be null
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // Should not crash
    expect(result.current.currentQuestion).toBeNull();
  });

  it("question selection returns null when ALL questions exhausted", () => {
    const singleQ = [
      { id: "only", text: "Only Q", answer: "A", difficulty: "Easy" as const, round: 1 },
    ];
    const { result } = createHook(singleQ);
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentQuestion).toBeNull();
  });

  it("handleTimeUp sets timeUp=true", () => {
    const { result } = createHook();
    act(() => result.current.handleTimeUp());
    expect(result.current.timeUp).toBe(true);
  });

  it("dismissTimeUp sets timeUp=false", () => {
    const { result } = createHook();
    act(() => result.current.handleTimeUp());
    act(() => result.current.dismissTimeUp());
    expect(result.current.timeUp).toBe(false);
  });

  it("resetRound clears all state and picks fresh question", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    act(() => result.current.bank());

    act(() => result.current.resetRound(2));
    expect(result.current.currentRound).toBe(2);
    expect(result.current.chainPosition).toBe(1);
    expect(result.current.bankedThisRound).toBe(0);
    expect(result.current.questionsAsked).toBe(0);
    expect(result.current.questionRevealed).toBe(false);
    expect(result.current.getUsedQuestionIds()).toEqual([]);
  });

  it("restoreState sets all fields from saved object", () => {
    const { result } = createHook();
    act(() =>
      result.current.restoreState({
        currentRound: 3,
        chainPosition: 5,
        bankedThisRound: 2000,
        totalBanked: 8000,
        currentPlayerIndex: 1,
        timeUp: false,
        questionsAsked: 12,
        currentQuestionId: "e2",
        usedQuestionIds: ["e1", "m1"],
      })
    );
    expect(result.current.currentRound).toBe(3);
    expect(result.current.chainPosition).toBe(5);
    expect(result.current.bankedThisRound).toBe(2000);
    expect(result.current.totalBanked).toBe(8000);
    expect(result.current.questionsAsked).toBe(12);
    expect(result.current.currentQuestion?.id).toBe("e2");
    expect(result.current.questionRevealed).toBe(false);
  });

  it("restoreState falls back to random when savedQuestionId not found", () => {
    const { result } = createHook();
    act(() =>
      result.current.restoreState({
        currentRound: 1,
        chainPosition: 1,
        bankedThisRound: 0,
        totalBanked: 0,
        currentPlayerIndex: 0,
        timeUp: false,
        questionsAsked: 0,
        currentQuestionId: "nonexistent-id",
        usedQuestionIds: [],
      })
    );
    // Should pick a random question instead of null
    expect(result.current.currentQuestion).not.toBeNull();
  });

  it("getUsedQuestionIds returns array of used IDs", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    const used = result.current.getUsedQuestionIds();
    expect(Array.isArray(used)).toBe(true);
    expect(used.length).toBe(1);
  });

  it("eliminated players are skipped in currentPlayer", () => {
    const players = [
      { id: "p1", name: "Alice", isEliminated: true },
      { id: "p2", name: "Bob", isEliminated: false },
      { id: "p3", name: "Charlie", isEliminated: false },
    ];
    const { result } = createHook(TEST_QUESTIONS, players);
    expect(result.current.currentPlayer?.name).toBe("Bob");
  });

  it("bank does not advance currentPlayer", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // chain=2, advances to Bob
    const playerBeforeBank = result.current.currentPlayer?.name;
    act(() => result.current.bank());
    expect(result.current.currentPlayer?.name).toBe(playerBeforeBank);
  });

  it("resetRound with startingPlayerName sets that player first", () => {
    const { result } = createHook();
    // Advance a few questions so currentPlayer is not Alice
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());
    expect(result.current.currentPlayer?.name).toBe("Bob");

    // Reset round with Charlie as starting player
    act(() => result.current.resetRound(2, "Charlie"));
    expect(result.current.currentRound).toBe(2);
    expect(result.current.currentPlayer?.name).toBe("Charlie");
  });

  it("resetRound without startingPlayerName defaults to first player", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect());

    act(() => result.current.resetRound(2));
    expect(result.current.currentPlayer?.name).toBe("Alice");
  });

  it("resetRound preserves totalBanked", () => {
    const { result } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // chain=2
    act(() => result.current.bank()); // banks 100
    expect(result.current.totalBanked).toBe(100);

    act(() => result.current.resetRound(2));
    expect(result.current.totalBanked).toBe(100);
    expect(result.current.bankedThisRound).toBe(0);
  });

  it("CLEANUP: unmount during pendingReveal clears timeout", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = createHook();
    act(() => result.current.revealQuestion());
    act(() => result.current.markCorrect()); // triggers pendingReveal
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
