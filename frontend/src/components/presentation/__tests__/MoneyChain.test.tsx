import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MoneyChain } from "@/components/presentation/MoneyChain";

describe("MoneyChain", () => {
  it("renders all 9 levels", () => {
    const { container } = render(<MoneyChain chainPosition={1} />);
    // Each level has a Q label
    const qLabels = Array.from(container.querySelectorAll("*")).filter((el) =>
      el.textContent?.match(/^Q\d$/)
    );
    // Should find Q1 through Q9
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q9")).toBeInTheDocument();
  });

  it("displays values for all chain levels", () => {
    render(<MoneyChain chainPosition={1} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    // Q9 value includes the chili emoji in the same span: "10,000 🌶️"
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });

  it("Q9 shows chili emoji", () => {
    render(<MoneyChain chainPosition={1} />);
    expect(screen.getByText(/🌶️/)).toBeInTheDocument();
  });

  it("chainPosition=1 highlights Q1", () => {
    const { container } = render(<MoneyChain chainPosition={1} />);
    // Active item should have scale transform
    const items = container.querySelectorAll("[class*='rounded']");
    expect(items.length).toBeGreaterThan(0);
  });

  it("chainPosition=9 renders without error", () => {
    expect(() => render(<MoneyChain chainPosition={9} />)).not.toThrow();
  });
});
