import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/config")
def get_game_config():
    with open(DATA_DIR / "game_config.json") as f:
        return json.load(f)


@router.get("/state")
def get_game_state():
    return {
        "currentRound": 1,
        "chainPosition": 0,
        "bankedThisRound": 0,
        "totalBanked": 0,
        "currentQuestionIndex": 0,
        "questionRevealed": False,
        "timerRunning": False,
        "timerPaused": False,
        "timeUp": False,
    }


@router.post("/action")
def game_action(action: Optional[dict] = None):
    return {"status": "ok", "action": action}


@router.post("/reset")
def reset_game():
    return {"status": "reset"}
