import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"


@router.get("/{round_number}/questions")
def get_round_questions(round_number: int):
    with open(DATA_DIR / "mock_questions.json") as f:
        data = json.load(f)

    for r in data["rounds"]:
        if r["round"] == round_number:
            return r["questions"]

    raise HTTPException(status_code=404, detail=f"Round {round_number} not found")
