from typing import Literal

from pydantic import BaseModel

Difficulty = Literal["Easy", "Medium", "Medium-Hard", "Hard", "Spicy"]


class Question(BaseModel):
    id: str
    text: str
    answer: str
    difficulty: Difficulty
    round: int
