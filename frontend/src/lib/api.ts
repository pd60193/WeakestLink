const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getGameConfig() {
  return fetchApi("/api/game/config");
}

export async function getRoundQuestions(round: number) {
  return fetchApi(`/api/rounds/${round}/questions`);
}

export async function getPlayers() {
  return fetchApi("/api/players");
}
