import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";

vi.mock("@/lib/sessionPersistence", () => ({
  loadSession: vi.fn(),
  clearSession: vi.fn(),
}));

import { loadSession, clearSession } from "@/lib/sessionPersistence";

const mockLoadSession = vi.mocked(loadSession);
const mockClearSession = vi.mocked(clearSession);

describe("useSessionPersistence", () => {
  it("isReady becomes true after mount", () => {
    mockLoadSession.mockReturnValue(null);
    const { result } = renderHook(() => useSessionPersistence());
    expect(result.current.isReady).toBe(true);
  });

  it("hasSavedSession=false when loadSession returns null", () => {
    mockLoadSession.mockReturnValue(null);
    const { result } = renderHook(() => useSessionPersistence());
    expect(result.current.hasSavedSession).toBe(false);
    expect(result.current.savedState).toBeNull();
  });

  it("hasSavedSession=true and savedState populated when data exists", () => {
    const fakeSession = { version: 1, currentRound: 2 } as ReturnType<typeof loadSession>;
    mockLoadSession.mockReturnValue(fakeSession);
    const { result } = renderHook(() => useSessionPersistence());
    expect(result.current.hasSavedSession).toBe(true);
    expect(result.current.savedState).toBe(fakeSession);
  });

  it("clearSession calls clearStoredSession and resets state", () => {
    const fakeSession = { version: 1 } as ReturnType<typeof loadSession>;
    mockLoadSession.mockReturnValue(fakeSession);
    const { result } = renderHook(() => useSessionPersistence());
    expect(result.current.hasSavedSession).toBe(true);

    act(() => result.current.clearSession());
    expect(mockClearSession).toHaveBeenCalled();
    expect(result.current.hasSavedSession).toBe(false);
  });
});
