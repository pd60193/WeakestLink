"use client";

import { useState, useCallback } from "react";
import { usePlayerSync } from "@/hooks/useGameSync";
import { JoinScreen } from "@/components/player/JoinScreen";
import { WaitingRoom } from "@/components/player/WaitingRoom";
import { SpectateView } from "@/components/player/SpectateView";
import { VotingScreen } from "@/components/player/VotingScreen";
import { EliminationReveal } from "@/components/player/EliminationReveal";
import { EliminatedView } from "@/components/player/EliminatedView";
import { GameOverView } from "@/components/player/GameOverView";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PlayerPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { state, voteResult, status, vote, error } = usePlayerSync(playerId);

  const handleJoin = useCallback(async (name: string) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await fetch(`${API_BASE}/api/game/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Failed to join" }));
        throw new Error(data.detail || "Failed to join");
      }
      const data = await res.json();
      setPlayerId(data.player.id);
      setPlayerName(data.player.name);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setIsJoining(false);
    }
  }, []);

  // Not joined yet — show join screen
  if (!playerId) {
    return (
      <JoinScreen
        onJoin={handleJoin}
        playerCount={state.players.length}
        isJoining={isJoining}
        error={joinError}
      />
    );
  }

  // Check if this player has been eliminated
  const myPlayer = state.players.find((p) => p.id === playerId);
  const isEliminated = myPlayer?.isEliminated ?? false;

  // Game over
  if (state.phase === "game_over") {
    return <GameOverView players={state.players} totalBanked={state.totalBanked} />;
  }

  // Elimination reveal — only show once the admin reveals the eliminated player
  if (state.phase === "elimination" && voteResult?.eliminated) {
    return <EliminationReveal voteResult={voteResult} currentPlayerId={playerId} />;
  }

  // Elimination phase but name not revealed yet — show waiting state
  if (state.phase === "elimination") {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-6">
        <p className="text-xl font-bold text-foreground/60 animate-pulse">
          Revealing votes...
        </p>
      </div>
    );
  }

  // Eliminated players get a reduced spectate view
  if (isEliminated) {
    return <EliminatedView state={state} />;
  }

  // Lobby — waiting room
  if (state.phase === "lobby") {
    return <WaitingRoom players={state.players} currentPlayerName={playerName} />;
  }

  // Voting phase
  if (state.phase === "voting") {
    return (
      <VotingScreen
        players={state.players}
        currentPlayerId={playerId}
        hasVoted={state.hasVoted}
        voteCount={state.voteCount}
        totalVotersExpected={state.totalVotersExpected}
        onVote={vote}
      />
    );
  }

  // Playing or round transition — spectate
  return <SpectateView state={state} playerName={playerName} />;
}
