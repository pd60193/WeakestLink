from pydantic import BaseModel


class Player(BaseModel):
    id: str
    name: str
    is_eliminated: bool = False
