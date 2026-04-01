"use client";

import { useState, useCallback, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type {
  PresentationState,
  AdminState,
  PlayerState,
  VoteResult,
  WebSocketMessage,
  GamePhase,
} from "@/types/game";
import type { ConnectionStatus } from "@/lib/websocket";

// --- Presentation Sync ---

const INITIAL_PRESENTATION_STATE: PresentationState = {
  phase: "lobby",
  currentRound: 1,
  chainPosition: 1,
  bankedThisRound: 0,
  totalBanked: 0,
  currentPlayerIndex: 0,
  questionRevealed: false,
  timeRemaining: 150,
  timerRunning: false,
  timerPaused: false,
  currentQuestion: null,
  players: [],
  questionsAsked: 0,
  revealedAnswer: null,
  roundMetrics: {
    questionsAnswered: 0,
    bankedThisRound: 0,
    highestChainPosition: 0,
    longestStreak: 0,
    strongestLink: null,
  },
  voteCount: 0,
  totalVotersExpected: 0,
};

export function usePresentationSync() {
  const [state, setState] = useState<PresentationState>(INITIAL_PRESENTATION_STATE);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);

  const onMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "state_update") {
      setState(msg.payload as unknown as PresentationState);
    } else if (msg.type === "vote_result") {
      setVoteResult(msg.payload as unknown as VoteResult);
    }
  }, []);

  const { status } = useWebSocket({
    path: "/api/ws/presentation",
    onMessage,
  });

  return { state, voteResult, status, clearVoteResult: () => setVoteResult(null) };
}

// --- Admin Sync ---

const INITIAL_ADMIN_STATE: AdminState = {
  ...INITIAL_PRESENTATION_STATE,
  currentQuestion: null,
  votes: {},
};

export function useAdminSync() {
  const [state, setState] = useState<AdminState>(INITIAL_ADMIN_STATE);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);

  const onMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "state_update") {
      setState(msg.payload as unknown as AdminState);
    } else if (msg.type === "vote_result") {
      setVoteResult(msg.payload as unknown as VoteResult);
    }
  }, []);

  const { status, sendAction } = useWebSocket({
    path: "/api/ws/admin",
    onMessage,
  });

  return { state, voteResult, status, sendAction, clearVoteResult: () => setVoteResult(null) };
}

// --- Player Sync ---

const INITIAL_PLAYER_STATE: PlayerState = {
  phase: "lobby",
  currentRound: 1,
  chainPosition: 1,
  bankedThisRound: 0,
  totalBanked: 0,
  timeRemaining: 150,
  timerRunning: false,
  players: [],
  currentPlayerName: null,
  questionsAsked: 0,
  hasVoted: false,
  voteCount: 0,
  totalVotersExpected: 0,
};

export function usePlayerSync(playerId: string | null) {
  const [state, setState] = useState<PlayerState>(INITIAL_PLAYER_STATE);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "state_update") {
      setState(msg.payload as unknown as PlayerState);
    } else if (msg.type === "vote_result") {
      setVoteResult(msg.payload as unknown as VoteResult);
    } else if (msg.type === "error") {
      setError((msg.payload as { message?: string }).message ?? "Unknown error");
    }
  }, []);

  const path = playerId ? `/api/ws/player/${playerId}` : "";

  const { status, sendMessage } = useWebSocket({
    path,
    onMessage,
    autoConnect: !!playerId,
  });

  const vote = useCallback(
    (votedForId: string) => {
      sendMessage("vote", { voted_for: votedForId });
    },
    [sendMessage]
  );

  return { state, voteResult, status, vote, error, clearError: () => setError(null), clearVoteResult: () => setVoteResult(null) };
}
