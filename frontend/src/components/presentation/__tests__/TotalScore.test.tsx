import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TotalScore } from "@/components/presentation/TotalScore";

describe("TotalScore", () => {
  it("displays totalBanked with locale formatting", () => {
    render(<TotalScore totalBanked={15000} bankedThisRound={6500} />);
    expect(screen.getByText("15,000")).toBeInTheDocument();
  });

  it("displays bankedThisRound", () => {
    render(<TotalScore totalBanked={15000} bankedThisRound={6500} />);
    expect(screen.getByText("6,500")).toBeInTheDocument();
  });
});
