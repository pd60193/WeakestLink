import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudio } from "@/hooks/useAudio";
import { installAudioMock, type MockAudioElement } from "@/__tests__/helpers/mockAudio";

describe("useAudio", () => {
  let getLastMock: () => MockAudioElement | null;
  let rafCallbacks: Array<{ id: number; cb: FrameRequestCallback }>;
  let nextRafId: number;
  const originalRAF = globalThis.requestAnimationFrame;
  const originalCAF = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = [];
    nextRafId = 1;

    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      const id = nextRafId++;
      rafCallbacks.push({ id, cb });
      return id;
    }) as typeof requestAnimationFrame;
    globalThis.cancelAnimationFrame = vi.fn((id: number) => {
      rafCallbacks = rafCallbacks.filter((r) => r.id !== id);
    });

    const audioMock = installAudioMock();
    getLastMock = audioMock.getLastMock;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCAF;
  });

  function flushRAF(n = 1) {
    for (let i = 0; i < n && rafCallbacks.length > 0; i++) {
      const entry = rafCallbacks.shift()!;
      entry.cb(performance.now());
    }
  }

  /** Advance fake timers to fire canplaythrough, wrapped in act for React state update */
  function triggerAudioLoad() {
    act(() => {
      vi.advanceTimersByTime(1);
    });
  }

  it("creates Audio element with correct src on mount", () => {
    renderHook(() => useAudio());
    const mock = getLastMock();
    expect(mock).not.toBeNull();
    expect(mock!.src).toContain("weakest-link-theme.mp3");
  });

  it("playIntro calls onIntroEnd immediately if audio not loaded", () => {
    const { result } = renderHook(() => useAudio());
    // Don't trigger load
    const onIntroEnd = vi.fn();
    act(() => result.current.playIntro(onIntroEnd));
    expect(onIntroEnd).toHaveBeenCalledTimes(1);
  });

  it("playIntro starts playback at currentTime=0 when loaded", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playIntro(vi.fn()));
    const mock = getLastMock()!;
    expect(mock.currentTime).toBe(0);
    expect(mock.play).toHaveBeenCalled();
  });

  it("playIntro transitions to middle when currentTime >= introEnd and calls onIntroEnd", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    const onIntroEnd = vi.fn();
    act(() => result.current.playIntro(onIntroEnd));

    // Simulate audio reaching introEnd
    const mock = getLastMock()!;
    mock.currentTime = 5;
    act(() => flushRAF(1));
    expect(onIntroEnd).toHaveBeenCalledTimes(1);
  });

  it("middle segment loops: currentTime resets to middleStart when >= middleEnd", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playIntro(vi.fn()));

    const mock = getLastMock()!;
    // Transition to middle first
    mock.currentTime = 5;
    act(() => flushRAF(1)); // intro check fires, transitions to middle, starts monitorPlayback

    // Now in middle loop monitoring - advance past middleEnd
    mock.currentTime = 55;
    act(() => flushRAF(1)); // monitorPlayback rAF fires, resets currentTime
    expect(mock.currentTime).toBe(5);
  });

  it("playOutro sets currentTime to outroStart (155)", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playOutro());
    expect(getLastMock()!.currentTime).toBe(155);
  });

  it("stop() pauses audio and resets to idle", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playIntro(vi.fn()));
    act(() => result.current.stop());
    const mock = getLastMock()!;
    expect(mock.pause).toHaveBeenCalled();
    expect(mock.currentTime).toBe(0);
  });

  it("toggleMute flips isMuted and sets audio.muted", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    expect(result.current.isMuted).toBe(false);

    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(true);
    expect(getLastMock()!.muted).toBe(true);

    act(() => result.current.toggleMute());
    expect(result.current.isMuted).toBe(false);
  });

  it("restoreMuted sets specific mute state", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.restoreMuted(true));
    expect(result.current.isMuted).toBe(true);
    expect(getLastMock()!.muted).toBe(true);
  });

  it("playIntro cancels previous monitoring (no double rAF chain)", () => {
    const { result } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playIntro(vi.fn()));
    // First playIntro queued an rAF
    expect(rafCallbacks.length).toBeGreaterThan(0);

    act(() => result.current.playIntro(vi.fn()));
    // stopMonitoring should have been called, canceling the previous rAF
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("CLEANUP: unmount pauses audio and clears src", () => {
    const { unmount } = renderHook(() => useAudio());
    triggerAudioLoad();
    const mock = getLastMock()!;
    unmount();
    expect(mock.pause).toHaveBeenCalled();
    expect(mock.src).toBe("");
  });

  it("CLEANUP: unmount cancels animation frame when active", () => {
    const { result, unmount } = renderHook(() => useAudio());
    triggerAudioLoad();
    act(() => result.current.playIntro(vi.fn()));
    // An rAF is now queued
    expect(rafCallbacks.length).toBeGreaterThan(0);
    unmount();
    // The useEffect cleanup calls cancelAnimationFrame
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled();
  });
});
