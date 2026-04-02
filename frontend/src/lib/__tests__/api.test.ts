import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getGameConfig, getRoundQuestions, getPlayers } from "@/lib/api";

describe("api", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON on 200", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });
    const result = await getGameConfig();
    expect(result).toEqual({ data: "test" });
  });

  it("returns null on non-ok response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 });
    const result = await getGameConfig();
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const result = await getGameConfig();
    expect(result).toBeNull();
  });

  it("getGameConfig calls /api/game/config", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    await getGameConfig();
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8000/api/game/config");
  });

  it("getRoundQuestions interpolates round into URL", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await getRoundQuestions(3);
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8000/api/rounds/3/questions");
  });

  it("getPlayers calls /api/players", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
    await getPlayers();
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8000/api/players");
  });
});
