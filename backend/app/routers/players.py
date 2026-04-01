import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.services.game_service import game_service

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("")
def get_players():
    """Get current game players (live from game state)."""
    if game_service.state.players:
        return [
            {"id": p.id, "name": p.name, "is_eliminated": p.is_eliminated}
            for p in game_service.state.players
        ]
    # Fallback to mock data if no game in progress
    with open(DATA_DIR / "mock_players.json") as f:
        return json.load(f)


@router.delete("/{player_id}")
async def kick_player(player_id: str):
    """Remove a player from the game."""
    try:
        await game_service.remove_player(player_id)
        return {"status": "removed", "player_id": player_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
