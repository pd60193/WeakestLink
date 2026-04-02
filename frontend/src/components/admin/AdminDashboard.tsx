"use client";

import { useAdminSync } from "@/hooks/useGameSync";
import { GameControls } from "./GameControls";
import { QuestionCard } from "./QuestionCard";
import { PlayerList } from "./PlayerList";
import { RoundInfo } from "./RoundInfo";
import { VotingPanel } from "./VotingPanel";
import { LobbySetup } from "./LobbySetup";
import type { ConnectionStatus } from "@/lib/websocket";

function ConnectionDot({ status }: { status: ConnectionStatus }) {
  const color =
    status === "connected"
      ? "bg-green-400"
      : status === "connecting"
        ? "bg-yellow-400 animate-pulse"
        : "bg-red-400";
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
  );
}

export function AdminDashboard() {
  const { state, voteResult, status, sendAction, clearVoteResult } = useAdminSync();

  // Lobby phase — show setup screen
  if (state.phase === "lobby") {
    return (
      <LobbySetup
        players={state.players}
        connectionStatus={status}
        onStartGame={() => sendAction("start_game")}
        onKickPlayer={(id) => sendAction("kick_player", { player_id: id })}
        onCreateGame={() => sendAction("create_game")}
      />
    );
  }

  const isVotingPhase = state.phase === "voting" || state.phase === "elimination";

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="bg-pastel-lilac/50 px-3 py-1.5 rounded-full text-sm font-bold text-foreground">
            Round {state.currentRound}
          </span>
          <span className="text-sm font-semibold text-foreground/50 capitalize">
            {state.phase.replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("Reset game? Players will stay connected.")) {
                sendAction("reset_game");
              }
            }}
            className="text-xs font-semibold text-difficulty-hard/60 hover:text-difficulty-hard px-3 py-1.5 rounded-lg border border-difficulty-hard/20 hover:border-difficulty-hard/40 transition-colors"
          >
            Reset Game
          </button>
          <ConnectionDot status={status} />
          <span className="text-xs text-foreground/40 font-medium">
            {status}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column: Question + Game Controls */}
        <div className="lg:col-span-2 space-y-4">
          {!isVotingPhase && (
            <>
              <QuestionCard
                question={state.currentQuestion}
                chainPosition={state.chainPosition}
                questionsAsked={state.questionsAsked}
              />
              <GameControls
                phase={state.phase}
                chainPosition={state.chainPosition}
                timerRunning={state.timerRunning}
                timerPaused={state.timerPaused}
                onAction={sendAction}
              />
            </>
          )}

          {isVotingPhase && (
            <VotingPanel
              players={state.players}
              votes={state.votes}
              voteCount={state.voteCount}
              totalVotersExpected={state.totalVotersExpected}
              voteResult={voteResult}
              onEndVoting={() => sendAction("end_voting")}
            />
          )}
        </div>

        {/* Right column: Players + Round Info */}
        <div className="space-y-4">
          <PlayerList
            players={state.players}
            currentPlayerIndex={state.currentPlayerIndex}
            phase={state.phase}
            onKick={(id) => sendAction("kick_player", { player_id: id })}
          />
          <RoundInfo
            currentRound={state.currentRound}
            bankedThisRound={state.bankedThisRound}
            totalBanked={state.totalBanked}
            metrics={state.roundMetrics}
            phase={state.phase}
            timeRemaining={state.timeRemaining}
            onAction={sendAction}
          />
        </div>
      </div>

      {/* Game over */}
      {state.phase === "game_over" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl max-w-md">
            <h2 className="text-3xl font-extrabold text-foreground mb-2">
              Game Over!
            </h2>
            <p className="text-foreground/50 mb-1">
              Total banked: {state.totalBanked.toLocaleString()} pts
            </p>
            <p className="text-foreground/50 mb-6">
              Remaining: {state.players.filter((p) => !p.isEliminated).map((p) => p.name).join(", ")}
            </p>
            <button
              onClick={() => sendAction("create_game")}
              className="bg-pastel-mint hover:bg-pastel-mint/80 text-foreground font-bold px-8 py-3 rounded-xl transition-colors"
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
