"""Tests for the game service — core game logic."""

import asyncio
import pytest
from unittest.mock import AsyncMock

from app.models.game_state import GamePhase, RoundMetrics, PlayerMetrics
from app.services.game_service import (
    GameService,
    MONEY_CHAIN,
    _pick_random_question,
    _get_chain_value,
    _get_chain_difficulty,
)
from app.models.player import Player
from app.models.question import Question


# --- Helpers ---

def make_questions(n: int = 20) -> list:
    """Create test questions with various difficulties."""
    difficulties = ["Easy", "Easy", "Medium", "Medium", "Medium-Hard",
                     "Medium-Hard", "Hard", "Hard", "Spicy", "Easy"]
    return [
        Question(
            id=f"q{i}",
            text=f"Question {i}?",
            answer=f"Answer {i}",
            difficulty=difficulties[i % len(difficulties)],
            round=1,
        )
        for i in range(n)
    ]


@pytest.fixture
def service():
    """Create a fresh GameService with test data."""
    svc = GameService()
    svc._all_questions = make_questions(20)
    svc.state.questions = svc._all_questions
    # Disable persistence and notifications for tests
    svc.save_to_file = lambda: None
    svc.clear_persistence = lambda: None
    svc._on_state_change = AsyncMock()
    return svc


# --- Unit Tests: Helpers ---

class TestHelpers:
    def test_get_chain_value(self):
        assert _get_chain_value(1) == 100
        assert _get_chain_value(5) == 1750
        assert _get_chain_value(9) == 10000
        assert _get_chain_value(0) == 0
        assert _get_chain_value(10) == 0

    def test_get_chain_difficulty(self):
        assert _get_chain_difficulty(1) == "Easy"
        assert _get_chain_difficulty(3) == "Medium"
        assert _get_chain_difficulty(5) == "Medium-Hard"
        assert _get_chain_difficulty(7) == "Hard"
        assert _get_chain_difficulty(9) == "Spicy"

    def test_pick_random_question_matching_difficulty(self):
        questions = make_questions(10)
        q = _pick_random_question(questions, set(), "Easy")
        assert q is not None
        assert q.difficulty == "Easy"

    def test_pick_random_question_fallback(self):
        questions = [Question(id="q1", text="Q?", answer="A", difficulty="Hard", round=1)]
        q = _pick_random_question(questions, set(), "Easy")
        assert q is not None
        assert q.id == "q1"

    def test_pick_random_question_all_used(self):
        questions = [Question(id="q1", text="Q?", answer="A", difficulty="Easy", round=1)]
        q = _pick_random_question(questions, {"q1"}, "Easy")
        assert q is None


# --- Unit Tests: RoundMetrics ---

class TestRoundMetrics:
    def test_record_correct(self):
        m = RoundMetrics()
        m.record_correct(2, "p1", 250)
        assert m.questions_answered == 1
        assert m.current_streak == 1
        assert m.longest_streak == 1
        assert m.highest_chain_position == 2
        assert m.player_metrics["p1"].correct_count == 1
        assert m.player_metrics["p1"].correct_value == 250

    def test_record_incorrect_resets_streak(self):
        m = RoundMetrics()
        m.record_correct(1, "p1", 100)
        m.record_correct(2, "p1", 250)
        m.record_incorrect()
        assert m.current_streak == 0
        assert m.longest_streak == 2
        assert m.questions_answered == 3

    def test_strongest_link_by_correct_count(self):
        m = RoundMetrics()
        m.record_correct(1, "p1", 100)
        m.record_correct(2, "p2", 250)
        m.record_correct(3, "p2", 500)
        assert m.get_strongest_link(["p1", "p2"]) == "p2"

    def test_strongest_link_tiebreaker_by_value(self):
        m = RoundMetrics()
        m.record_correct(1, "p1", 100)
        m.record_correct(5, "p2", 1750)  # same count but higher value
        assert m.get_strongest_link(["p1", "p2"]) == "p2"

    def test_strongest_link_tiebreaker_by_order(self):
        m = RoundMetrics()
        m.record_correct(1, "p1", 100)
        m.record_correct(1, "p2", 100)  # same count, same value
        # p1 is first in order
        assert m.get_strongest_link(["p1", "p2"]) == "p1"


# --- Integration Tests: Game Lifecycle ---

class TestGameLifecycle:
    @pytest.mark.asyncio
    async def test_create_game(self, service):
        await service.create_game()
        assert service.state.phase == GamePhase.LOBBY
        assert len(service.state.players) == 0

    @pytest.mark.asyncio
    async def test_join_player(self, service):
        await service.create_game()
        p = await service.join_player("Alice")
        assert p.name == "Alice"
        assert len(service.state.players) == 1

    @pytest.mark.asyncio
    async def test_join_duplicate_name_raises(self, service):
        await service.create_game()
        await service.join_player("Alice")
        with pytest.raises(ValueError, match="already taken"):
            await service.join_player("alice")

    @pytest.mark.asyncio
    async def test_join_max_players(self, service):
        await service.create_game()
        for i in range(15):
            await service.join_player(f"Player {i}")
        with pytest.raises(ValueError, match="Maximum 15"):
            await service.join_player("Extra")

    @pytest.mark.asyncio
    async def test_start_game(self, service):
        await service.create_game()
        await service.join_player("Alice")
        await service.join_player("Bob")
        await service.start_game()
        assert service.state.phase == GamePhase.PLAYING
        assert service.state.current_question is not None

    @pytest.mark.asyncio
    async def test_start_game_too_few_players(self, service):
        await service.create_game()
        await service.join_player("Alice")
        with pytest.raises(ValueError, match="at least 2"):
            await service.start_game()


class TestGameActions:
    @pytest.fixture
    async def playing_service(self, service):
        await service.create_game()
        await service.join_player("Alice")
        await service.join_player("Bob")
        await service.start_game()
        await service.start_timer()
        return service

    @pytest.mark.asyncio
    async def test_question_hidden_until_timer_starts(self, service):
        await service.create_game()
        await service.join_player("Alice")
        await service.join_player("Bob")
        await service.start_game()
        assert service.state.current_question is not None
        assert service.state.question_revealed is False

        await service.start_timer()
        assert service.state.question_revealed is True

    @pytest.mark.asyncio
    async def test_mark_correct_advances_chain(self, playing_service):
        svc = await playing_service
        assert svc.state.chain_position == 1
        await svc.mark_correct()
        assert svc.state.chain_position == 2
        assert svc.state.questions_asked == 1

    @pytest.mark.asyncio
    async def test_mark_incorrect_shows_answer_then_advances(self, playing_service):
        """Incorrect should show answer under current question, wait 1s, then advance."""
        svc = await playing_service
        await svc.mark_correct()  # chain = 2
        original_question = svc.state.current_question
        original_answer = original_question.answer

        # Run mark_incorrect — it has a 1s sleep, so we track state changes
        state_changes = []

        async def track_changes(msg_type):
            state_changes.append({
                "revealed_answer": svc.state.revealed_answer,
                "current_question_id": svc.state.current_question.id if svc.state.current_question else None,
            })

        svc._on_state_change = track_changes
        await svc.mark_incorrect()

        # Should have broadcast twice: once with answer, once after advance
        assert len(state_changes) == 2

        # First broadcast: answer shown under the ORIGINAL question
        assert state_changes[0]["revealed_answer"] == original_answer
        assert state_changes[0]["current_question_id"] == original_question.id

        # Second broadcast: answer cleared, new question loaded
        assert state_changes[1]["revealed_answer"] is None
        assert state_changes[1]["current_question_id"] != original_question.id

    @pytest.mark.asyncio
    async def test_mark_incorrect_resets_chain(self, playing_service):
        svc = await playing_service
        await svc.mark_correct()  # chain = 2
        await svc.mark_incorrect()
        assert svc.state.chain_position == 1
        # After the full mark_incorrect (including 1s delay), answer is cleared
        assert svc.state.revealed_answer is None

    @pytest.mark.asyncio
    async def test_mark_incorrect_answer_matches_question(self, playing_service):
        """The revealed answer must belong to the question that was answered incorrectly."""
        svc = await playing_service
        question_before = svc.state.current_question
        expected_answer = question_before.answer

        first_broadcast_answer = None

        async def capture_first(msg_type):
            nonlocal first_broadcast_answer
            if first_broadcast_answer is None:
                first_broadcast_answer = svc.state.revealed_answer

        svc._on_state_change = capture_first
        await svc.mark_incorrect()

        assert first_broadcast_answer == expected_answer

    @pytest.mark.asyncio
    async def test_bank_locks_in_value(self, playing_service):
        svc = await playing_service
        await svc.mark_correct()  # chain = 2 (value = 250)
        await svc.bank()  # banks value of position 1 = 100
        assert svc.state.banked_this_round == 100
        assert svc.state.chain_position == 1

    @pytest.mark.asyncio
    async def test_bank_at_position_1_banks_nothing(self, playing_service):
        svc = await playing_service
        await svc.bank()  # chain is at 1, nothing to bank
        assert svc.state.banked_this_round == 0

    @pytest.mark.asyncio
    async def test_q9_auto_banks(self, playing_service):
        svc = await playing_service
        # Manually set chain to position 9
        svc.state.chain_position = 9
        await svc.mark_correct()
        assert svc.state.banked_this_round == 10000
        assert svc.state.chain_position == 1


class TestVoting:
    @pytest.fixture
    async def voting_service(self, service):
        await service.create_game()
        await service.join_player("Alice")
        await service.join_player("Bob")
        await service.join_player("Charlie")
        await service.join_player("Dave")
        await service.start_game()
        await service.start_voting()
        return service

    @pytest.mark.asyncio
    async def test_start_voting(self, voting_service):
        svc = await voting_service
        assert svc.state.phase == GamePhase.VOTING

    @pytest.mark.asyncio
    async def test_cast_vote(self, voting_service):
        svc = await voting_service
        players = svc.state.players
        await svc.cast_vote(players[0].id, players[1].id)
        assert players[0].id in svc.state.votes

    @pytest.mark.asyncio
    async def test_cannot_vote_for_self(self, voting_service):
        svc = await voting_service
        player = svc.state.players[0]
        with pytest.raises(ValueError, match="yourself"):
            await svc.cast_vote(player.id, player.id)

    @pytest.mark.asyncio
    async def test_end_voting_eliminates_player(self, voting_service):
        svc = await voting_service
        players = svc.state.players
        # Alice and Charlie vote for Bob
        await svc.cast_vote(players[0].id, players[1].id)
        await svc.cast_vote(players[2].id, players[1].id)
        result = await svc.end_voting()
        assert result["eliminated"]["name"] == "Bob"
        assert svc.state.phase == GamePhase.ELIMINATION

    @pytest.mark.asyncio
    async def test_next_round_after_elimination(self, voting_service):
        svc = await voting_service
        players = svc.state.players
        await svc.cast_vote(players[0].id, players[1].id)
        await svc.cast_vote(players[2].id, players[1].id)
        await svc.end_voting()
        await svc.next_round()
        assert svc.state.phase == GamePhase.PLAYING
        assert svc.state.current_round == 2
