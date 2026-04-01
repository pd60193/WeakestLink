import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.game_service import game_service

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


class JoinRequest(BaseModel):
    name: str


class ActionRequest(BaseModel):
    action: str
    player_id: Optional[str] = None
    order: Optional[list] = None


class VoteRequest(BaseModel):
    voter_id: str
    voted_for: str


@router.get("/config")
def get_game_config():
    with open(DATA_DIR / "game_config.json") as f:
        return json.load(f)


@router.get("/state")
def get_game_state():
    """Get current game state (admin view)."""
    return game_service.state.to_admin_dict()


@router.post("/create")
async def create_game():
    """Create a new game session."""
    await game_service.create_game()
    return {"status": "created"}


@router.post("/join")
async def join_game(req: JoinRequest):
    """Player joins the game."""
    try:
        player = await game_service.join_player(req.name)
        return {"status": "joined", "player": {"id": player.id, "name": player.name}}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/action")
async def game_action(req: ActionRequest):
    """Admin game action (correct, incorrect, bank, reveal, etc.)."""
    try:
        action = req.action
        if action == "start_game":
            await game_service.start_game()
        elif action == "start_timer":
            from app.services.timer_service import timer_service
            await game_service.start_timer()
            await timer_service.start()
        elif action == "toggle_pause":
            await game_service.toggle_pause()
        elif action == "reveal_question":
            await game_service.reveal_question()
        elif action == "correct":
            await game_service.mark_correct()
        elif action == "incorrect":
            await game_service.mark_incorrect()
        elif action == "bank":
            await game_service.bank()
        elif action == "next_question":
            await game_service.next_question()
        elif action == "start_voting":
            from app.services.timer_service import timer_service
            from app.services.voting_service import voting_service
            await timer_service.stop()
            await voting_service.start_voting()
        elif action == "end_voting":
            from app.services.voting_service import voting_service
            result = await voting_service.end_voting()
            return {"status": "ok", "result": result}
        elif action == "next_round":
            await game_service.transition_to_round_screen()
            await game_service.next_round()
        elif action == "kick_player":
            if req.player_id:
                await game_service.remove_player(req.player_id)
        elif action == "reorder_players":
            if req.order:
                await game_service.reorder_players(req.order)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
        return {"status": "ok", "action": action}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/vote")
async def cast_vote(req: VoteRequest):
    """Player submits a vote."""
    try:
        await game_service.cast_vote(req.voter_id, req.voted_for)
        return {"status": "ok"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset")
async def reset_game():
    """Reset the game completely."""
    await game_service.create_game()
    return {"status": "reset"}
