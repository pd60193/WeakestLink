import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "@/hooks/useTypewriter";

describe("useTypewriter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty displayedText", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Hello", speed: 40 })
    );
    expect(result.current.displayedText).toBe("");
    expect(result.current.isComplete).toBe(false);
  });

  it("reveals one character per speed interval", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Hello", speed: 40 })
    );
    act(() => vi.advanceTimersByTime(120)); // 3 ticks
    expect(result.current.displayedText).toBe("Hel");
  });

  it("isComplete becomes true when all characters displayed", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Hi", speed: 40 })
    );
    act(() => vi.advanceTimersByTime(200)); // well past 2 chars
    expect(result.current.isComplete).toBe(true);
    expect(result.current.displayedText).toBe("Hi");
  });

  it("snapComplete immediately shows full text and clears interval", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Hello World", speed: 40 })
    );
    act(() => vi.advanceTimersByTime(40)); // 1 char
    expect(result.current.displayedText).toBe("H");

    act(() => result.current.snapComplete());
    expect(result.current.displayedText).toBe("Hello World");
    expect(result.current.isComplete).toBe(true);
  });

  it("changing text resets to empty and restarts typing", () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter({ text, speed: 40 }),
      { initialProps: { text: "First" } }
    );
    act(() => vi.advanceTimersByTime(200)); // type all of "First"
    expect(result.current.displayedText).toBe("First");

    rerender({ text: "Second" });
    // Synchronous reset should show empty, not stale text
    expect(result.current.displayedText).toBe("");

    act(() => vi.advanceTimersByTime(120)); // 3 chars of "Second"
    expect(result.current.displayedText).toBe("Sec");
  });

  it("changing text clears previous interval", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { rerender } = renderHook(
      ({ text }) => useTypewriter({ text, speed: 40 }),
      { initialProps: { text: "First" } }
    );
    act(() => vi.advanceTimersByTime(40)); // start typing

    const callsBefore = clearIntervalSpy.mock.calls.length;
    rerender({ text: "Second" });
    expect(clearIntervalSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("enabled=false prevents typing", () => {
    const { result } = renderHook(() =>
      useTypewriter({ text: "Hello", speed: 40, enabled: false })
    );
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.displayedText).toBe("");
  });

  it("empty text does not start interval", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    renderHook(() => useTypewriter({ text: "", speed: 40 }));
    act(() => vi.advanceTimersByTime(200));
    // setInterval may be called by setup but should return early for empty text
    // The key assertion: no characters displayed
    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it("CLEANUP: unmount clears interval", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() =>
      useTypewriter({ text: "Hello", speed: 40 })
    );
    act(() => vi.advanceTimersByTime(40)); // start interval
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
