import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("")
def get_players():
    with open(DATA_DIR / "mock_players.json") as f:
        return json.load(f)
