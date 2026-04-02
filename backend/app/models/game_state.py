from enum import Enum
from typing import Dict, List, Optional, Set

from pydantic import BaseModel, Field

from app.models.player import Player
from app.models.question import Question


class GamePhase(str, Enum):
    LOBBY = "lobby"
    PLAYING = "playing"
    VOTING = "voting"
    ELIMINATION = "elimination"
    ROUND_TRANSITION = "round_transition"
    GAME_OVER = "game_over"


class PlayerMetrics(BaseModel):
    correct_count: int = 0
    correct_value: int = 0
    banked_amount: int = 0


class RoundMetrics(BaseModel):
    questions_answered: int = 0
    highest_chain_position: int = 0
    longest_streak: int = 0
    current_streak: int = 0
    player_metrics: Dict[str, PlayerMetrics] = Field(default_factory=dict)

    def record_correct(self, chain_position: int, player_id: str, chain_value: int) -> None:
        self.questions_answered += 1
        self.current_streak += 1
        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak
        if chain_position > self.highest_chain_position:
            self.highest_chain_position = chain_position
        pm = self.player_metrics.setdefault(player_id, PlayerMetrics())
        pm.correct_count += 1
        pm.correct_value += chain_value

    def record_incorrect(self) -> None:
        self.questions_answered += 1
        self.current_streak = 0

    def record_bank(self, amount: int, player_id: str) -> None:
        pm = self.player_metrics.setdefault(player_id, PlayerMetrics())
        pm.banked_amount += amount

    def get_strongest_link(self, player_order: List[str]) -> Optional[str]:
        """Determine strongest link using tiebreakers:
        1. Most correct answers
        2. Highest total value of correct answers
        3. First in round order (earliest index)
        """
        if not self.player_metrics:
            return player_order[0] if player_order else None

        candidates = []
        for pid in player_order:
            pm = self.player_metrics.get(pid, PlayerMetrics())
            candidates.append((pid, pm.correct_count, pm.correct_value))

        candidates.sort(key=lambda x: (x[1], x[2]), reverse=True)
        return candidates[0][0] if candidates else None

    def get_player_order_from_strongest(self, player_order: List[str]) -> List[str]:
        """Return all player IDs sorted strongest-first using the same tiebreaker rules."""
        candidates = []
        for pid in player_order:
            pm = self.player_metrics.get(pid, PlayerMetrics())
            candidates.append((pid, pm.correct_count, pm.correct_value))
        candidates.sort(key=lambda x: (x[1], x[2]), reverse=True)
        return [c[0] for c in candidates]


class ServerGameState(BaseModel):
    phase: GamePhase = GamePhase.LOBBY
    current_round: int = 1
    chain_position: int = 1
    banked_this_round: int = 0
    total_banked: int = 0
    current_player_index: int = 0
    question_revealed: bool = False
    time_remaining: int = 150
    timer_running: bool = False
    timer_paused: bool = False
    current_question: Optional[Question] = None
    used_question_ids: List[str] = Field(default_factory=list)
    players: List[Player] = Field(default_factory=list)
    questions: List[Question] = Field(default_factory=list)
    round_metrics: RoundMetrics = Field(default_factory=RoundMetrics)
    votes: Dict[str, str] = Field(default_factory=dict)
    eliminated_players: List[Player] = Field(default_factory=list)
    questions_asked: int = 0
    revealed_answer: Optional[str] = None
    pending_elimination_id: Optional[str] = None

    model_config = {"arbitrary_types_allowed": True}

    @property
    def active_players(self) -> List[Player]:
        return [p for p in self.players if not p.is_eliminated]

    @property
    def current_player(self) -> Optional[Player]:
        active = self.active_players
        if not active:
            return None
        return active[self.current_player_index % len(active)]

    def to_presentation_dict(self) -> dict:
        """State for presentation portal — no answers, no vote details."""
        return {
            "phase": self.phase.value,
            "currentRound": self.current_round,
            "chainPosition": self.chain_position,
            "bankedThisRound": self.banked_this_round,
            "totalBanked": self.total_banked,
            "currentPlayerIndex": self.current_player_index,
            "questionRevealed": self.question_revealed,
            "timeRemaining": self.time_remaining,
            "timerRunning": self.timer_running,
            "timerPaused": self.timer_paused,
            "currentQuestion": _question_without_answer(self.current_question) if self.current_question else None,
            "players": [_player_dict(p) for p in self.players],
            "questionsAsked": self.questions_asked,
            "revealedAnswer": self.revealed_answer,
            "roundMetrics": self._public_round_metrics(),
            "voteCount": len(self.votes),
            "totalVotersExpected": len(self.active_players),
        }

    def to_admin_dict(self) -> dict:
        """State for admin portal — includes answers and vote details."""
        return {
            "phase": self.phase.value,
            "currentRound": self.current_round,
            "chainPosition": self.chain_position,
            "bankedThisRound": self.banked_this_round,
            "totalBanked": self.total_banked,
            "currentPlayerIndex": self.current_player_index,
            "questionRevealed": self.question_revealed,
            "timeRemaining": self.time_remaining,
            "timerRunning": self.timer_running,
            "timerPaused": self.timer_paused,
            "currentQuestion": _question_dict(self.current_question) if self.current_question else None,
            "players": [_player_dict(p) for p in self.players],
            "questionsAsked": self.questions_asked,
            "revealedAnswer": self.revealed_answer,
            "roundMetrics": self._full_round_metrics(),
            "votes": self.votes,
            "voteCount": len(self.votes),
            "totalVotersExpected": len(self.active_players),
        }

    def to_player_dict(self, player_id: str) -> dict:
        """State for a specific player — no answers, no vote details during voting."""
        return {
            "phase": self.phase.value,
            "currentRound": self.current_round,
            "chainPosition": self.chain_position,
            "bankedThisRound": self.banked_this_round,
            "totalBanked": self.total_banked,
            "timeRemaining": self.time_remaining,
            "timerRunning": self.timer_running,
            "players": [_player_dict(p) for p in self.players],
            "currentPlayerName": self.current_player.name if self.current_player else None,
            "questionsAsked": self.questions_asked,
            "hasVoted": player_id in self.votes,
            "voteCount": len(self.votes),
            "totalVotersExpected": len(self.active_players),
        }

    def _public_round_metrics(self) -> dict:
        active_ids = [p.id for p in self.active_players]
        strongest = self.round_metrics.get_strongest_link(active_ids)
        strongest_name = None
        if strongest:
            for p in self.players:
                if p.id == strongest:
                    strongest_name = p.name
                    break
        return {
            "questionsAnswered": self.round_metrics.questions_answered,
            "bankedThisRound": self.banked_this_round,
            "highestChainPosition": self.round_metrics.highest_chain_position,
            "longestStreak": self.round_metrics.longest_streak,
            "strongestLink": strongest_name,
        }

    def _full_round_metrics(self) -> dict:
        base = self._public_round_metrics()
        base["playerMetrics"] = {
            pid: {
                "correctCount": pm.correct_count,
                "correctValue": pm.correct_value,
                "bankedAmount": pm.banked_amount,
            }
            for pid, pm in self.round_metrics.player_metrics.items()
        }
        return base


def _question_dict(q: Question) -> dict:
    return {
        "id": q.id,
        "text": q.text,
        "imageUrl": q.image_url,
        "answer": q.answer,
        "difficulty": q.difficulty,
        "round": q.round,
    }


def _question_without_answer(q: Question) -> dict:
    return {
        "id": q.id,
        "text": q.text,
        "imageUrl": q.image_url,
        "difficulty": q.difficulty,
        "round": q.round,
    }


def _player_dict(p: Player) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "isEliminated": p.is_eliminated,
    }
