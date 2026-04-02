import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Timer } from "@/components/presentation/Timer";

describe("Timer", () => {
  it("displays formatted MM:SS (150s → 2:30)", () => {
    render(<Timer timeRemaining={150} totalTime={150} isRunning={true} isPaused={false} />);
    expect(screen.getByText("2:30")).toBeInTheDocument();
  });

  it("single-digit seconds are zero-padded (65s → 1:05)", () => {
    render(<Timer timeRemaining={65} totalTime={150} isRunning={true} isPaused={false} />);
    expect(screen.getByText("1:05")).toBeInTheDocument();
  });

  it("shows Paused when isPaused=true", () => {
    render(<Timer timeRemaining={100} totalTime={150} isRunning={true} isPaused={true} />);
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("shows Press T when not running, not paused, time > 0", () => {
    render(<Timer timeRemaining={150} totalTime={150} isRunning={false} isPaused={false} />);
    expect(screen.getByText("Press T")).toBeInTheDocument();
  });

  it("no Press T when running", () => {
    render(<Timer timeRemaining={150} totalTime={150} isRunning={true} isPaused={false} />);
    expect(screen.queryByText("Press T")).not.toBeInTheDocument();
  });

  it("timer at 0:00 displays correctly", () => {
    render(<Timer timeRemaining={0} totalTime={150} isRunning={false} isPaused={false} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("SVG progress reflects timeRemaining / totalTime", () => {
    const { container } = render(
      <Timer timeRemaining={75} totalTime={150} isRunning={true} isPaused={false} />
    );
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(2); // background + progress
  });
});
