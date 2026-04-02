import json
import random
import uuid
from pathlib import Path
from typing import List, Optional

from app.models.game_state import GamePhase, RoundMetrics, ServerGameState
from app.models.player import Player
from app.models.question import Question

DATA_DIR = Path(__file__).parent.parent / "data"
PERSIST_PATH = DATA_DIR / "game_session.json"

MONEY_CHAIN = [
    {"position": 1, "value": 100, "difficulty": "Easy"},
    {"position": 2, "value": 250, "difficulty": "Easy"},
    {"position": 3, "value": 500, "difficulty": "Medium"},
    {"position": 4, "value": 1000, "difficulty": "Medium"},
    {"position": 5, "value": 1750, "difficulty": "Medium-Hard"},
    {"position": 6, "value": 3000, "difficulty": "Medium-Hard"},
    {"position": 7, "value": 4500, "difficulty": "Hard"},
    {"position": 8, "value": 6500, "difficulty": "Hard"},
    {"position": 9, "value": 10000, "difficulty": "Spicy"},
]

ROUND_CONFIGS = [
    {"round_number": 1, "duration_seconds": 150},
    {"round_number": 2, "duration_seconds": 140},
    {"round_number": 3, "duration_seconds": 130},
    {"round_number": 4, "duration_seconds": 120},
    {"round_number": 5, "duration_seconds": 110},
    {"round_number": 6, "duration_seconds": 100},
    {"round_number": 7, "duration_seconds": 90},
]


def _load_questions() -> List[Question]:
    """Load all questions from mock_questions.json."""
    with open(DATA_DIR / "mock_questions.json") as f:
        data = json.load(f)
    questions = []
    for round_data in data["rounds"]:
        for q in round_data["questions"]:
            questions.append(Question(
                id=q["id"],
                text=q.get("text"),
                image_url=q.get("image_url"),
                answer=q["answer"],
                difficulty=q["difficulty"],
                round=q["round"],
            ))
    return questions


def _pick_random_question(
    questions: List[Question],
    used_ids: set,
    difficulty: str,
) -> Optional[Question]:
    """Pick a random question matching difficulty, fallback to any unused."""
    pool = [q for q in questions if q.difficulty == difficulty and q.id not in used_ids]
    if pool:
        return random.choice(pool)
    fallback = [q for q in questions if q.id not in used_ids]
    if fallback:
        return random.choice(fallback)
    return None


def _get_chain_value(position: int) -> int:
    """Get the money chain value for a given position (1-indexed)."""
    if 1 <= position <= len(MONEY_CHAIN):
        return MONEY_CHAIN[position - 1]["value"]
    return 0


def _get_chain_difficulty(position: int) -> str:
    """Get the difficulty for a given chain position."""
    if 1 <= position <= len(MONEY_CHAIN):
        return MONEY_CHAIN[position - 1]["difficulty"]
    return "Easy"


def _get_round_duration(round_number: int) -> int:
    """Get the duration in seconds for a round."""
    for rc in ROUND_CONFIGS:
        if rc["round_number"] == round_number:
            return rc["duration_seconds"]
    return ROUND_CONFIGS[-1]["duration_seconds"]


class GameService:
    """Singleton game state manager. Single source of truth for the game."""

    def __init__(self) -> None:
        self.state = ServerGameState()
        self._all_questions = _load_questions()
        self._on_state_change = None  # callback for broadcasting state updates

    def set_state_change_callback(self, callback) -> None:
        self._on_state_change = callback

    async def _notify_state_change(self, event_type: str = "state_update") -> None:
        if self._on_state_change:
            await self._on_state_change(event_type)

    # --- Persistence ---

    def save_to_file(self) -> None:
        """Persist current state to JSON file."""
        data = self.state.model_dump(mode="json")
        with open(PERSIST_PATH, "w") as f:
            json.dump(data, f, indent=2)

    def load_from_file(self) -> bool:
        """Load state from JSON file. Returns True if loaded successfully."""
        if not PERSIST_PATH.exists():
            return False
        try:
            with open(PERSIST_PATH) as f:
                data = json.load(f)
            self.state = ServerGameState.model_validate(data)
            return True
        except Exception:
            return False

    def clear_persistence(self) -> None:
        if PERSIST_PATH.exists():
            PERSIST_PATH.unlink()

    # --- Game Lifecycle ---

    async def create_game(self) -> None:
        """Create a new game, resetting all state."""
        self.state = ServerGameState(
            phase=GamePhase.LOBBY,
            questions=self._all_questions,
        )
        self.clear_persistence()
        await self._notify_state_change("phase_change")

    async def join_player(self, name: str) -> Player:
        """Add a player to the game during lobby phase."""
        if self.state.phase != GamePhase.LOBBY:
            raise ValueError("Can only join during lobby phase")
        if len(self.state.players) >= 15:
            raise ValueError("Maximum 15 players")
        if any(p.name.lower() == name.lower() for p in self.state.players):
            raise ValueError(f"Player name '{name}' is already taken")

        player = Player(id=str(uuid.uuid4()), name=name)
        self.state.players.append(player)
        self.save_to_file()
        await self._notify_state_change("player_joined")
        return player

    async def remove_player(self, player_id: str) -> None:
        """Remove a player (kick) — only during lobby."""
        if self.state.phase != GamePhase.LOBBY:
            raise ValueError("Can only remove players during lobby phase")
        self.state.players = [p for p in self.state.players if p.id != player_id]
        self.save_to_file()
        await self._notify_state_change("player_left")

    async def reorder_players(self, player_ids: List[str]) -> None:
        """Reorder active players."""
        id_map = {p.id: p for p in self.state.players}
        reordered = []
        for pid in player_ids:
            if pid in id_map:
                reordered.append(id_map.pop(pid))
        # Append any remaining (shouldn't happen but safety)
        reordered.extend(id_map.values())
        self.state.players = reordered
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def start_game(self) -> None:
        """Transition from lobby to first round."""
        if self.state.phase != GamePhase.LOBBY:
            raise ValueError("Game not in lobby phase")
        if len(self.state.players) < 2:
            raise ValueError("Need at least 2 players")

        self.state.current_round = 1
        self.state.time_remaining = _get_round_duration(1)
        self.state.chain_position = 1
        self.state.banked_this_round = 0
        self.state.total_banked = 0
        self.state.current_player_index = 0
        self.state.question_revealed = False
        self.state.questions_asked = 0
        self.state.used_question_ids = []
        self.state.round_metrics = RoundMetrics()
        self.state.revealed_answer = None

        # Pick first question
        self._pick_next_question()
        self.state.phase = GamePhase.PLAYING
        self.save_to_file()
        await self._notify_state_change("phase_change")

    # --- Timer ---

    async def start_timer(self) -> None:
        """Start the round timer."""
        if self.state.phase != GamePhase.PLAYING:
            return
        self.state.timer_running = True
        self.state.timer_paused = False
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def toggle_pause(self) -> None:
        """Toggle timer pause/resume."""
        if not self.state.timer_running:
            return
        self.state.timer_paused = not self.state.timer_paused
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def timer_tick(self) -> None:
        """Called every second by the timer service when timer is running and not paused."""
        if not self.state.timer_running or self.state.timer_paused:
            return
        self.state.time_remaining -= 1
        if self.state.time_remaining <= 0:
            self.state.time_remaining = 0
            self.state.timer_running = False
            self.save_to_file()
            await self._notify_state_change("time_up")
        else:
            # Don't save to file every tick to avoid I/O pressure
            await self._notify_state_change("timer_tick")

    # --- Game Actions ---

    async def reveal_question(self) -> None:
        """Reveal the current question."""
        if self.state.phase != GamePhase.PLAYING:
            return
        self.state.question_revealed = True
        self.state.revealed_answer = None
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def mark_correct(self) -> None:
        """Mark current question as correct."""
        if self.state.phase != GamePhase.PLAYING:
            return

        player = self.state.current_player
        player_id = player.id if player else "unknown"
        chain_pos = self.state.chain_position

        if chain_pos >= len(MONEY_CHAIN):
            # At Q9 — auto-bank 10,000
            value = MONEY_CHAIN[-1]["value"]
            self.state.round_metrics.record_correct(len(MONEY_CHAIN), player_id, value)
            self.state.banked_this_round += value
            self.state.total_banked += value
            self.state.chain_position = 1
        else:
            next_pos = chain_pos + 1
            value = _get_chain_value(next_pos)
            self.state.round_metrics.record_correct(next_pos, player_id, value)
            self.state.chain_position = next_pos

        self._advance_to_next_question(mark_used=True, count_question=True, advance_player=True)
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def mark_incorrect(self) -> None:
        """Mark current question as incorrect."""
        if self.state.phase != GamePhase.PLAYING:
            return

        self.state.round_metrics.record_incorrect()
        self.state.revealed_answer = self.state.current_question.answer if self.state.current_question else None
        self.state.chain_position = 1
        self._advance_to_next_question(mark_used=True, count_question=True, advance_player=True)
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def bank(self) -> None:
        """Bank current chain value."""
        if self.state.phase != GamePhase.PLAYING:
            return

        player = self.state.current_player
        player_id = player.id if player else "unknown"

        if self.state.chain_position > 1:
            value = _get_chain_value(self.state.chain_position - 1)
            self.state.banked_this_round += value
            self.state.total_banked += value
            self.state.round_metrics.record_bank(value, player_id)

        self.state.chain_position = 1
        # Bank does NOT mark current question as used, count it, or advance player
        self._advance_to_next_question(mark_used=False, count_question=False, advance_player=False)
        self.save_to_file()
        await self._notify_state_change("state_update")

    async def next_question(self) -> None:
        """Skip to next question without any scoring change."""
        if self.state.phase != GamePhase.PLAYING:
            return
        self._advance_to_next_question(mark_used=True, count_question=True, advance_player=True)
        self.save_to_file()
        await self._notify_state_change("state_update")

    # --- Voting ---

    async def start_voting(self) -> None:
        """Transition from playing to voting phase."""
        self.state.phase = GamePhase.VOTING
        self.state.timer_running = False
        self.state.timer_paused = False
        self.state.votes = {}
        self.save_to_file()
        await self._notify_state_change("phase_change")

    async def cast_vote(self, voter_id: str, voted_for_id: str) -> None:
        """A player casts their vote."""
        if self.state.phase != GamePhase.VOTING:
            raise ValueError("Not in voting phase")

        # Validate voter is active
        active_ids = {p.id for p in self.state.active_players}
        eliminated_ids = {p.id for p in self.state.eliminated_players}

        if voter_id not in active_ids and voter_id not in eliminated_ids:
            raise ValueError("Not a valid voter")
        if voted_for_id not in active_ids:
            raise ValueError("Cannot vote for an inactive/eliminated player")
        if voter_id == voted_for_id:
            raise ValueError("Cannot vote for yourself")

        self.state.votes[voter_id] = voted_for_id
        self.save_to_file()
        await self._notify_state_change("vote_cast")

    async def end_voting(self) -> dict:
        """End voting, tally votes, determine who is eliminated."""
        if self.state.phase != GamePhase.VOTING:
            raise ValueError("Not in voting phase")

        vote_tally = {}
        for voted_for in self.state.votes.values():
            vote_tally[voted_for] = vote_tally.get(voted_for, 0) + 1

        if not vote_tally:
            # No votes cast — no elimination
            self.state.phase = GamePhase.ROUND_TRANSITION
            self.save_to_file()
            await self._notify_state_change("phase_change")
            return {"eliminated": None, "votes": vote_tally}

        max_votes = max(vote_tally.values())
        tied_players = [pid for pid, count in vote_tally.items() if count == max_votes]

        if len(tied_players) == 1:
            eliminated_id = tied_players[0]
        else:
            # Tiebreaker: eliminated players' votes decide
            # Count only eliminated players' votes among tied candidates
            tie_tally = {}
            for voter_id, voted_for in self.state.votes.items():
                if voter_id in {p.id for p in self.state.eliminated_players} and voted_for in tied_players:
                    tie_tally[voted_for] = tie_tally.get(voted_for, 0) + 1

            if tie_tally:
                max_tie = max(tie_tally.values())
                tie_winners = [pid for pid, count in tie_tally.items() if count == max_tie]
                eliminated_id = tie_winners[0]  # If still tied, first in list
            else:
                eliminated_id = tied_players[0]  # Fallback: first tied player

        # Mark player as eliminated
        eliminated_player = None
        for p in self.state.players:
            if p.id == eliminated_id:
                p.is_eliminated = True
                eliminated_player = p
                self.state.eliminated_players.append(p)
                break

        result = {
            "eliminated": {
                "id": eliminated_player.id,
                "name": eliminated_player.name,
            } if eliminated_player else None,
            "votes": vote_tally,
            "fullVotes": self.state.votes,
        }

        self.state.phase = GamePhase.ELIMINATION
        self.save_to_file()
        await self._notify_state_change("vote_result")
        return result

    # --- Round Transitions ---

    async def next_round(self) -> None:
        """Advance to the next round."""
        if self.state.phase not in (GamePhase.ELIMINATION, GamePhase.ROUND_TRANSITION):
            raise ValueError("Cannot advance round in current phase")

        active = self.state.active_players
        if len(active) <= 2:
            # Game over — only 2 players left (final round not in Phase 2 scope)
            self.state.phase = GamePhase.GAME_OVER
            self.save_to_file()
            await self._notify_state_change("phase_change")
            return

        next_round = self.state.current_round + 1
        if next_round > len(ROUND_CONFIGS):
            self.state.phase = GamePhase.GAME_OVER
            self.save_to_file()
            await self._notify_state_change("phase_change")
            return

        # Determine strongest link for starting player
        active_ids = [p.id for p in active]
        strongest_id = self.state.round_metrics.get_strongest_link(active_ids)

        # Find index of strongest link in active players
        start_index = 0
        if strongest_id:
            for i, p in enumerate(active):
                if p.id == strongest_id:
                    start_index = i
                    break

        # Reset round state
        self.state.current_round = next_round
        self.state.time_remaining = _get_round_duration(next_round)
        self.state.chain_position = 1
        self.state.banked_this_round = 0
        self.state.current_player_index = start_index
        self.state.question_revealed = False
        self.state.timer_running = False
        self.state.timer_paused = False
        self.state.questions_asked = 0
        self.state.used_question_ids = []
        self.state.round_metrics = RoundMetrics()
        self.state.votes = {}
        self.state.revealed_answer = None

        self._pick_next_question()
        self.state.phase = GamePhase.PLAYING
        self.save_to_file()
        await self._notify_state_change("phase_change")

    async def transition_to_round_screen(self) -> None:
        """After elimination reveal, move to round transition screen."""
        if self.state.phase != GamePhase.ELIMINATION:
            raise ValueError("Not in elimination phase")
        self.state.phase = GamePhase.ROUND_TRANSITION
        self.save_to_file()
        await self._notify_state_change("phase_change")

    # --- Internal Helpers ---

    def _pick_next_question(self) -> None:
        """Pick the next question based on current chain difficulty."""
        difficulty = _get_chain_difficulty(self.state.chain_position)
        used = set(self.state.used_question_ids)
        question = _pick_random_question(self.state.questions, used, difficulty)
        self.state.current_question = question
        self.state.question_revealed = True

    def _advance_to_next_question(
        self,
        mark_used: bool = True,
        count_question: bool = True,
        advance_player: bool = True,
    ) -> None:
        """Advance to the next question, optionally marking current as used."""
        if mark_used and self.state.current_question:
            self.state.used_question_ids.append(self.state.current_question.id)

        if count_question:
            self.state.questions_asked += 1

        if advance_player:
            active = self.state.active_players
            if active:
                self.state.current_player_index = (
                    (self.state.current_player_index + 1) % len(active)
                )

        self._pick_next_question()


# Singleton instance
game_service = GameService()
