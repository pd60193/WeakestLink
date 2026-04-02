import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResumePrompt } from "@/components/presentation/ResumePrompt";
import type { PersistedGameSession } from "@/lib/sessionPersistence";

const mockSession: PersistedGameSession = {
  version: 1,
  currentRound: 3,
  chainPosition: 5,
  bankedThisRound: 1500,
  totalBanked: 4500,
  currentPlayerIndex: 2,
  timeUp: false,
  questionsAsked: 8,
  currentQuestionId: "q1",
  usedQuestionIds: [],
  timeRemaining: 80,
  isMuted: false,
  questionsAnswered: 8,
  highestChainPosition: 6,
  longestStreak: 3,
  currentStreak: 1,
  playerCorrectCounts: {},
  playerBankedCounts: {},
};

describe("ResumePrompt", () => {
  it("displays session summary", () => {
    render(<ResumePrompt session={mockSession} onResume={vi.fn()} onNewGame={vi.fn()} />);
    expect(screen.getByText("3")).toBeInTheDocument(); // round
    expect(screen.getByText(/4,500/)).toBeInTheDocument(); // total banked
    expect(screen.getByText("8")).toBeInTheDocument(); // questions asked
  });

  it("formats time as M:SS (80s → 1:20)", () => {
    render(<ResumePrompt session={mockSession} onResume={vi.fn()} onNewGame={vi.fn()} />);
    expect(screen.getByText("1:20")).toBeInTheDocument();
  });

  it("Resume button calls onResume", () => {
    const onResume = vi.fn();
    render(<ResumePrompt session={mockSession} onResume={onResume} onNewGame={vi.fn()} />);
    fireEvent.click(screen.getByText("Resume Game"));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("New Game button calls onNewGame", () => {
    const onNewGame = vi.fn();
    render(<ResumePrompt session={mockSession} onResume={vi.fn()} onNewGame={onNewGame} />);
    fireEvent.click(screen.getByText("New Game"));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });
});
