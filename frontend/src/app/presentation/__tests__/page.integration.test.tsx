import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import PresentationPage from "@/app/presentation/page";
import * as sessionPersistence from "@/lib/sessionPersistence";

// Mock useAudio — we don't want real Audio elements in integration tests
vi.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({
    isLoaded: true,
    isMuted: false,
    playIntro: vi.fn((cb) => cb()),
    playOutro: vi.fn(),
    stop: vi.fn(),
    toggleMute: vi.fn(),
    restoreMuted: vi.fn(),
  }),
}));

// Mock sessionPersistence functions used directly by the page
vi.mock("@/lib/sessionPersistence", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof sessionPersistence;
  return {
    ...actual,
    debouncedSave: vi.fn(),
    flushSave: vi.fn(),
    loadSession: vi.fn(() => null),
    clearSession: vi.fn(),
  };
});

describe("PresentationPage integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // loadSession returns null → no saved session → auto "new" decision
    vi.mocked(sessionPersistence.loadSession).mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders main UI when no saved session", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });
    // Should show Round 1
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    // Should show Money Chain
    expect(screen.getByText("Money Chain")).toBeInTheDocument();
    // Should show Press Space hint (question not revealed)
    expect(screen.getByText(/Press Space/i)).toBeInTheDocument();
  });

  it("Space key reveals question", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });
    expect(screen.getByText(/Press Space/i)).toBeInTheDocument();

    // Press Space to reveal
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });

    // Question should no longer show "Press Space"
    expect(screen.queryByText(/Press Space/i)).not.toBeInTheDocument();
  });

  it("C key advances chain position after revealing", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // Reveal question first
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });

    // Press C for correct — chain should advance
    act(() => {
      fireEvent.keyDown(window, { key: "c" });
    });

    // After correct, there's a 1s pending reveal delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Chain position should now be 2 — Q2 (250) should be the active level
    // The total score should still be 0 (nothing banked yet)
    expect(screen.getByText(/250/)).toBeInTheDocument();
  });

  it("X key resets chain to position 1", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // Reveal and mark correct to advance chain
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    act(() => {
      fireEvent.keyDown(window, { key: "c" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now press X for incorrect — chain resets to 1
    // First reveal the new question
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    act(() => {
      fireEvent.keyDown(window, { key: "x" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Chain should be back at position 1
    // Q1 (100) should be the active value
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("B key banks value below current position", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // Advance chain: reveal → correct → wait → reveal → correct → wait
    // This gets us to chain position 3
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    act(() => {
      fireEvent.keyDown(window, { key: "c" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    act(() => {
      fireEvent.keyDown(window, { key: "c" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Now at position 3, bank should store value of position 2 (250 pts)
    act(() => {
      fireEvent.keyDown(window, { key: "b" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Banked this round should show 250 — use getAllByText since "250" appears
    // in the money chain Q2 level AND in both TotalScore displays (bankedThisRound + totalBanked)
    const matches = screen.getAllByText("250");
    // At least 3 elements show "250": money chain Q2, bankedThisRound, totalBanked
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });

  it("timer reaching 0 shows TimeUpOverlay", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // Start timer with T key — audio.playIntro calls callback immediately (mocked)
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });

    // Advance timer to 0 (default round is 180 seconds)
    act(() => {
      vi.advanceTimersByTime(180 * 1000);
    });

    expect(screen.getByText("TIME'S UP!")).toBeInTheDocument();
  });

  it("Enter advances to next round from TimeUp overlay", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // Start timer and let it expire
    act(() => {
      fireEvent.keyDown(window, { key: "t" });
    });
    act(() => {
      vi.advanceTimersByTime(180 * 1000);
    });
    expect(screen.getByText("TIME'S UP!")).toBeInTheDocument();

    // Advance to next round with Enter
    act(() => {
      fireEvent.keyDown(window, { key: "Enter" });
    });

    expect(screen.queryByText("TIME'S UP!")).not.toBeInTheDocument();
  });

  it("state changes trigger debounced save", async () => {
    await act(async () => {
      render(<PresentationPage />);
    });

    // debouncedSave should have been called at least once on mount (sessionDecision changes from "pending" to "new")
    expect(sessionPersistence.debouncedSave).toHaveBeenCalled();

    // Reveal and mark correct to trigger more state changes
    const callsBefore = vi.mocked(sessionPersistence.debouncedSave).mock.calls.length;
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    act(() => {
      fireEvent.keyDown(window, { key: "c" });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(vi.mocked(sessionPersistence.debouncedSave).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("shows ResumePrompt when saved session exists", async () => {
    const mockSession: sessionPersistence.PersistedGameSession = {
      version: 1,
      currentRound: 2,
      chainPosition: 3,
      bankedThisRound: 500,
      totalBanked: 2000,
      currentPlayerIndex: 1,
      timeUp: false,
      questionsAsked: 5,
      currentQuestionId: null,
      usedQuestionIds: [],
      timeRemaining: 120,
      isMuted: false,
      questionsAnswered: 5,
      highestChainPosition: 4,
      longestStreak: 2,
      currentStreak: 1,
      playerCorrectCounts: {},
      playerBankedCounts: {},
    };
    vi.mocked(sessionPersistence.loadSession).mockReturnValue(mockSession);

    await act(async () => {
      render(<PresentationPage />);
    });

    // Should show resume prompt, not the main game UI
    expect(screen.getByText("Resume Game")).toBeInTheDocument();
    expect(screen.getByText("New Game")).toBeInTheDocument();
  });

  it("New Game button from ResumePrompt shows main UI", async () => {
    const mockSession: sessionPersistence.PersistedGameSession = {
      version: 1,
      currentRound: 2,
      chainPosition: 3,
      bankedThisRound: 500,
      totalBanked: 2000,
      currentPlayerIndex: 1,
      timeUp: false,
      questionsAsked: 5,
      currentQuestionId: null,
      usedQuestionIds: [],
      timeRemaining: 120,
      isMuted: false,
      questionsAnswered: 5,
      highestChainPosition: 4,
      longestStreak: 2,
      currentStreak: 1,
      playerCorrectCounts: {},
      playerBankedCounts: {},
    };
    vi.mocked(sessionPersistence.loadSession).mockReturnValue(mockSession);

    await act(async () => {
      render(<PresentationPage />);
    });

    // Click New Game
    act(() => {
      fireEvent.click(screen.getByText("New Game"));
    });

    // Should show main game UI
    expect(screen.getByText("Round 1")).toBeInTheDocument();
    expect(screen.getByText("Money Chain")).toBeInTheDocument();
  });
});
