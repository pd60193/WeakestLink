from typing import Literal, Optional

from pydantic import BaseModel

Difficulty = Literal["Easy", "Medium", "Medium-Hard", "Hard", "Spicy"]


class Question(BaseModel):
    id: str
    text: Optional[str] = None
    image_url: Optional[str] = None
    answer: str
    difficulty: Difficulty
    round: int
