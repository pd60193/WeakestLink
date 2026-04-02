import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { QuestionDisplay, QuestionDisplayHandle } from "@/components/presentation/QuestionDisplay";

describe("QuestionDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Press Space hint when not revealed", () => {
    render(
      <QuestionDisplay
        question={{ id: "q1", text: "Test Q", answer: "A", difficulty: "Easy", round: 1 }}
        revealed={false}
        questionNumber={1}
      />
    );
    expect(screen.getByText(/Press Space/i)).toBeInTheDocument();
  });

  it("shows question text when revealed", () => {
    render(
      <QuestionDisplay
        question={{ id: "q1", text: "What is 2+2?", answer: "4", difficulty: "Easy", round: 1 }}
        revealed={true}
        questionNumber={1}
      />
    );
    // Typewriter starts — advance timers in act() to flush React state updates
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText(/What is 2\+2\?/)).toBeInTheDocument();
  });

  it("shows image when question has imageUrl", () => {
    render(
      <QuestionDisplay
        question={{
          id: "q1",
          text: "Name this",
          imageUrl: "/images/test.jpg",
          answer: "A",
          difficulty: "Easy",
          round: 1,
        }}
        revealed={true}
        questionNumber={1}
      />
    );
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/test.jpg");
  });

  it("shows No more questions when question=null and revealed", () => {
    render(<QuestionDisplay question={null} revealed={true} questionNumber={1} />);
    expect(screen.getByText(/No more questions/i)).toBeInTheDocument();
  });

  it("imperative snapComplete works via ref", () => {
    const ref = React.createRef<QuestionDisplayHandle>();
    render(
      <QuestionDisplay
        ref={ref}
        question={{ id: "q1", text: "Long question text here", answer: "A", difficulty: "Easy", round: 1 }}
        revealed={true}
        questionNumber={1}
      />
    );
    // snapComplete should not throw
    expect(() => ref.current?.snapComplete()).not.toThrow();
  });

  it("shows keyboard hints when question is present and revealed", () => {
    render(
      <QuestionDisplay
        question={{ id: "q1", text: "Q?", answer: "A", difficulty: "Easy", round: 1 }}
        revealed={true}
        questionNumber={1}
      />
    );
    // Use exact text to avoid "Incorrect" also matching /Correct/i
    expect(screen.getByText("C = Correct")).toBeInTheDocument();
    expect(screen.getByText("X = Incorrect")).toBeInTheDocument();
    expect(screen.getByText("B = Bank")).toBeInTheDocument();
  });
});
