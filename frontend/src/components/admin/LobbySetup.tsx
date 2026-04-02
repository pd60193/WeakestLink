"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "@/types/game";
import type { ConnectionStatus } from "@/lib/websocket";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LobbySetupProps {
  players: Player[];
  connectionStatus: ConnectionStatus;
  onStartGame: () => void;
  onKickPlayer: (playerId: string) => void;
  onCreateGame: () => void;
  onReorderPlayers: (playerIds: string[]) => void;
}

export function LobbySetup({
  players,
  connectionStatus,
  onStartGame,
  onKickPlayer,
  onCreateGame,
  onReorderPlayers,
}: LobbySetupProps) {
  const canStart = players.length >= 2;
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const movePlayer = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= players.length) return;
    const ids = players.map((p) => p.id);
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    onReorderPlayers(ids);
  };

  const handleCreateGame = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_BASE}/api/game/create`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Failed to create game" }));
        throw new Error(data.detail || "Failed to create game");
      }
      // Also trigger via WebSocket so the state broadcasts to all clients
      onCreateGame();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Could not reach server. Is the backend running?");
    } finally {
      setCreating(false);
    }
  };

  const statusColor =
    connectionStatus === "connected"
      ? "bg-green-400"
      : connectionStatus === "connecting"
        ? "bg-yellow-400 animate-pulse"
        : "bg-red-400";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-foreground mb-2">
            The Weakest Link
          </h1>
          <p className="text-foreground/50 font-semibold">Host Control Panel</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-xs text-foreground/40">
              {connectionStatus === "connected"
                ? "Connected to server"
                : connectionStatus === "connecting"
                  ? "Connecting to server..."
                  : "Server disconnected"}
            </span>
          </div>
        </div>

        <div className="bg-white/90 rounded-2xl p-6 shadow-lg border border-pastel-lilac/20 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground">
              Players ({players.length}/15)
            </h2>
            <span className="text-sm text-foreground/40">
              Waiting for players to join at <code>/player</code>
            </span>
          </div>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-foreground/40 mb-4">No players yet</p>
              {createError && (
                <p className="text-difficulty-hard text-sm font-semibold mb-3">
                  {createError}
                </p>
              )}
              <button
                onClick={handleCreateGame}
                disabled={creating}
                className="bg-pastel-sky hover:bg-pastel-sky/80 disabled:opacity-50 text-foreground font-bold px-6 py-3 rounded-xl transition-colors"
              >
                {creating ? "Creating..." : "Create New Game"}
              </button>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              <AnimatePresence>
                {players.map((player, i) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-pastel-cream/80 rounded-lg px-4 py-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-pastel-sky/60 flex items-center justify-center text-xs font-bold text-foreground/60">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-foreground flex-1">
                      {player.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => movePlayer(i, -1)}
                        disabled={i === 0}
                        className="text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-1 rounded transition-colors"
                        title="Move up"
                      >
                        {"\u25B2"}
                      </button>
                      <button
                        onClick={() => movePlayer(i, 1)}
                        disabled={i === players.length - 1}
                        className="text-foreground/40 hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed p-1 rounded transition-colors"
                        title="Move down"
                      >
                        {"\u25BC"}
                      </button>
                      <button
                        onClick={() => onKickPlayer(player.id)}
                        className="text-xs text-difficulty-hard/60 hover:text-difficulty-hard font-semibold px-2 py-1 rounded transition-colors ml-1"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {players.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full font-bold py-4 rounded-xl text-lg transition-colors ${
                canStart
                  ? "bg-pastel-mint hover:bg-pastel-mint/80 text-foreground"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {canStart
                ? `Start Game with ${players.length} Players`
                : "Need at least 2 players"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
