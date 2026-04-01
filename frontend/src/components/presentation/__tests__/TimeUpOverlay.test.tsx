import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import type { RoundMetrics } from "@/hooks/useRoundMetrics";

const mockMetrics: RoundMetrics = {
  questionsAnswered: 10,
  bankedThisRound: 3000,
  highestChainPosition: 5,
  highestChainValue: 1750,
  longestStreak: 4,
  strongestLinks: ["Alice"],
};

describe("TimeUpOverlay", () => {
  it("returns null when visible=false", () => {
    const { container } = render(<TimeUpOverlay visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows TIME'S UP! when visible=true", () => {
    render(<TimeUpOverlay visible={true} />);
    expect(screen.getByText("TIME'S UP!")).toBeInTheDocument();
  });

  it("calls onShow exactly once when becoming visible", () => {
    const onShow = vi.fn();
    render(<TimeUpOverlay visible={true} onShow={onShow} />);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onShow again on re-render while visible", () => {
    const onShow = vi.fn();
    const { rerender } = render(<TimeUpOverlay visible={true} onShow={onShow} />);
    rerender(<TimeUpOverlay visible={true} onShow={onShow} />);
    expect(onShow).toHaveBeenCalledTimes(1);
  });

  it("resets hasPlayed when hidden then shown again", () => {
    const onShow = vi.fn();
    const { rerender } = render(<TimeUpOverlay visible={true} onShow={onShow} />);
    rerender(<TimeUpOverlay visible={false} onShow={onShow} />);
    rerender(<TimeUpOverlay visible={true} onShow={onShow} />);
    expect(onShow).toHaveBeenCalledTimes(2);
  });

  it("renders RoundStats when metrics provided", () => {
    render(<TimeUpOverlay visible={true} metrics={mockMetrics} />);
    expect(screen.getByText("Round Stats")).toBeInTheDocument();
  });

  it("does not crash when metrics undefined", () => {
    expect(() => render(<TimeUpOverlay visible={true} />)).not.toThrow();
  });

  it("shows 'Press Enter to move to Round X' when nextRound provided", () => {
    render(<TimeUpOverlay visible={true} nextRound={3} />);
    expect(screen.getByText("Press Enter to move to Round 3")).toBeInTheDocument();
  });

  it("does not show next round prompt when nextRound is null", () => {
    render(<TimeUpOverlay visible={true} nextRound={null} />);
    expect(screen.queryByText(/Press Enter/)).not.toBeInTheDocument();
  });

  it("does not show next round prompt when nextRound is undefined", () => {
    render(<TimeUpOverlay visible={true} />);
    expect(screen.queryByText(/Press Enter/)).not.toBeInTheDocument();
  });
});
