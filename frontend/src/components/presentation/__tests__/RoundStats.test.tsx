import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoundStats } from "@/components/presentation/RoundStats";
import type { RoundMetrics } from "@/hooks/useRoundMetrics";

const baseMetrics: RoundMetrics = {
  questionsAnswered: 12,
  bankedThisRound: 5000,
  highestChainPosition: 7,
  highestChainValue: 4500,
  longestStreak: 5,
  strongestLinks: ["Alice"],
};

describe("RoundStats", () => {
  it("renders all 5 stat rows", () => {
    render(<RoundStats metrics={baseMetrics} />);
    expect(screen.getByText("Questions Answered")).toBeInTheDocument();
    expect(screen.getByText("Amount Gained")).toBeInTheDocument();
    expect(screen.getByText("Highest Chain Reached")).toBeInTheDocument();
    expect(screen.getByText("Longest Streak")).toBeInTheDocument();
    expect(screen.getByText("Strongest Link")).toBeInTheDocument();
  });

  it("displays strongest link names joined by comma", () => {
    const metrics = { ...baseMetrics, strongestLinks: ["Alice", "Bob"] };
    render(<RoundStats metrics={metrics} />);
    expect(screen.getByText("Alice, Bob")).toBeInTheDocument();
  });

  it("shows dash when strongestLinks is empty", () => {
    const metrics = { ...baseMetrics, strongestLinks: [] };
    render(<RoundStats metrics={metrics} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
