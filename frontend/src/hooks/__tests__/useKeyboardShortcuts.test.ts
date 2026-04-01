import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function makeActions() {
  return {
    onReveal: vi.fn(),
    onCorrect: vi.fn(),
    onIncorrect: vi.fn(),
    onBank: vi.fn(),
    onNext: vi.fn(),
    onTogglePause: vi.fn(),
    onStartTimer: vi.fn(),
    onNextRound: vi.fn(),
    onToggleMute: vi.fn(),
  };
}

function pressKey(key: string, options: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...options }));
}

describe("useKeyboardShortcuts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Space calls onReveal and prevents default", () => {
    const actions = makeActions();
    renderHook(() => useKeyboardShortcuts(actions));
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);
    expect(actions.onReveal).toHaveBeenCalledTimes(1);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it.each([
    ["c", "onCorrect"],
    ["C", "onCorrect"],
    ["ArrowRight", "onCorrect"],
    ["x", "onIncorrect"],
    ["X", "onIncorrect"],
    ["ArrowLeft", "onIncorrect"],
    ["b", "onBank"],
    ["B", "onBank"],
    ["n", "onNext"],
    ["N", "onNext"],
    ["p", "onTogglePause"],
    ["P", "onTogglePause"],
    ["t", "onStartTimer"],
    ["T", "onStartTimer"],
    ["Enter", "onNextRound"],
    ["m", "onToggleMute"],
    ["M", "onToggleMute"],
  ] as const)("key '%s' calls %s", (key, actionName) => {
    const actions = makeActions();
    renderHook(() => useKeyboardShortcuts(actions));
    pressKey(key);
    expect(actions[actionName]).toHaveBeenCalledTimes(1);
  });

  it("m/M does not throw when onToggleMute is undefined", () => {
    const actions = makeActions();
    const { onToggleMute, ...actionsWithoutMute } = actions;
    renderHook(() => useKeyboardShortcuts(actionsWithoutMute as Parameters<typeof useKeyboardShortcuts>[0]));
    expect(() => pressKey("m")).not.toThrow();
  });

  it("ignores repeated key events (e.repeat=true)", () => {
    const actions = makeActions();
    renderHook(() => useKeyboardShortcuts(actions));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "c", repeat: true }));
    expect(actions.onCorrect).not.toHaveBeenCalled();
  });

  it("unmapped keys trigger nothing", () => {
    const actions = makeActions();
    renderHook(() => useKeyboardShortcuts(actions));
    pressKey("z");
    pressKey("1");
    pressKey("Escape");
    const allCalls = Object.values(actions).reduce((sum, fn) => sum + fn.mock.calls.length, 0);
    expect(allCalls).toBe(0);
  });

  it("CLEANUP: unmount removes keydown listener", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const actions = makeActions();
    const { unmount } = renderHook(() => useKeyboardShortcuts(actions));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
