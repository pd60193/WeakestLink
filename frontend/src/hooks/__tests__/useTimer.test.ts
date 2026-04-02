import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimer } from "@/hooks/useTimer";

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with correct timeRemaining and not running", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    expect(result.current.timeRemaining).toBe(150);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("start() sets isRunning=true and decrements each second", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.timeRemaining).toBe(147);
  });

  it("calls onComplete when reaching 0 and stops timer", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ initialSeconds: 3, onComplete })
    );
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("onComplete uses latest ref value (not stale closure)", () => {
    const onComplete1 = vi.fn();
    const onComplete2 = vi.fn();
    const { result, rerender } = renderHook(
      ({ cb }) => useTimer({ initialSeconds: 2, onComplete: cb }),
      { initialProps: { cb: onComplete1 } }
    );
    act(() => result.current.start());
    // Switch callback after start
    rerender({ cb: onComplete2 });
    act(() => vi.advanceTimersByTime(2000));
    expect(onComplete1).not.toHaveBeenCalled();
    expect(onComplete2).toHaveBeenCalledTimes(1);
  });

  it("pause() stops countdown but keeps isRunning=true", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.timeRemaining).toBe(148);

    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(true);

    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.timeRemaining).toBe(148); // unchanged
  });

  it("pause() is no-op when not running", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("resume() continues from paused value", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000)); // 145
    act(() => result.current.pause());
    act(() => result.current.resume());
    expect(result.current.isPaused).toBe(false);
    act(() => vi.advanceTimersByTime(2000)); // 143
    expect(result.current.timeRemaining).toBe(143);
  });

  it("resume() is no-op when not paused", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    const timeBefore = result.current.timeRemaining;
    act(() => result.current.resume()); // already running, not paused
    expect(result.current.timeRemaining).toBe(timeBefore);
  });

  it("togglePause alternates between pause and resume", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    act(() => result.current.togglePause());
    expect(result.current.isPaused).toBe(true);
    act(() => result.current.togglePause());
    expect(result.current.isPaused).toBe(false);
  });

  it("startWithDelay waits before ticking", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.startWithDelay(2000));
    expect(result.current.isRunning).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.timeRemaining).toBe(150); // delay not yet elapsed

    act(() => vi.advanceTimersByTime(1000)); // delay elapsed, interval starts
    act(() => vi.advanceTimersByTime(2000)); // 2 ticks
    expect(result.current.timeRemaining).toBe(148);
  });

  it("startWithDelay clears previous timer if called again", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.startWithDelay(5000));
    act(() => result.current.start()); // should clear delay
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.timeRemaining).toBe(147); // only start() ticking, not startWithDelay
  });

  it("reset() restores initialSeconds and stops timer", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(10000));
    act(() => result.current.reset());
    expect(result.current.timeRemaining).toBe(150);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("reset(newSeconds) uses custom value", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.reset(60));
    expect(result.current.timeRemaining).toBe(60);
  });

  it("restoreTime() sets value without starting", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.restoreTime(42));
    expect(result.current.timeRemaining).toBe(42);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
  });

  it("timer stops at exactly 0 (not negative)", () => {
    const { result } = renderHook(() => useTimer({ initialSeconds: 1 }));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.timeRemaining).toBe(0);
  });

  it("CLEANUP: unmount clears interval", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { result, unmount } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.start());
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("CLEANUP: unmount clears delayed timeout", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { result, unmount } = renderHook(() => useTimer({ initialSeconds: 150 }));
    act(() => result.current.startWithDelay(5000));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
