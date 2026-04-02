import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoundHeader } from "@/components/presentation/RoundHeader";

describe("RoundHeader", () => {
  it("displays round number", () => {
    render(<RoundHeader roundNumber={3} playerName="Alice" />);
    expect(screen.getByText("Round 3")).toBeInTheDocument();
  });

  it("displays player name when provided", () => {
    render(<RoundHeader roundNumber={1} playerName="Bob" />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("does not render player section when name is null", () => {
    render(<RoundHeader roundNumber={1} playerName={null} />);
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });
});
