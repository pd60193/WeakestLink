import { Question } from "@/types/game";

const STORAGE_KEY = "weakest-link-session";
export const SESSION_VERSION = 1;

export interface PersistedGameSession {
  version: number;
  // useGameState
  currentRound: number;
  chainPosition: number;
  bankedThisRound: number;
  totalBanked: number;
  currentPlayerIndex: number;
  timeUp: boolean;
  questionsAsked: number;
  currentQuestionId: string | null;
  usedQuestionIds: string[];
  // useTimer
  timeRemaining: number;
  // useAudio
  isMuted: boolean;
  // useRoundMetrics
  questionsAnswered: number;
  highestChainPosition: number;
  longestStreak: number;
  currentStreak: number;
  playerCorrectCounts: Record<string, number>;
  playerCorrectValues: Record<string, number>;
  playerBankedCounts: Record<string, number>;
}

export function saveSession(state: PersistedGameSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function loadSession(): PersistedGameSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedGameSession;
    if (parsed.version !== SESSION_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // fail silently
  }
}

// Debounced save — 500ms trailing edge
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(state: PersistedGameSession): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    saveSession(state);
    debounceTimer = null;
  }, 500);
}

export function flushSave(state: PersistedGameSession): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  saveSession(state);
}

// Helper to look up a question by ID, with fallback
export function findQuestionById(
  questions: Question[],
  id: string | null
): Question | null {
  if (!id) return null;
  return questions.find((q) => q.id === id) ?? null;
}
