from typing import List

from pydantic import BaseModel

from app.models.question import Difficulty


class ChainLevel(BaseModel):
    position: int
    value: int
    difficulty: Difficulty


class RoundConfig(BaseModel):
    round_number: int
    duration_seconds: int


class GameConfig(BaseModel):
    money_chain: List[ChainLevel]
    rounds: List[RoundConfig]
    max_players: int = 15
