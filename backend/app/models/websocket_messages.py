from typing import Any, Dict, Optional

from pydantic import BaseModel


class ClientMessage(BaseModel):
    type: str  # "action", "join", "vote", "ping"
    payload: Dict[str, Any] = {}


class ServerMessage(BaseModel):
    type: str  # "state_update", "phase_change", "player_joined", "vote_result", "timer_tick", "error"
    payload: Dict[str, Any] = {}

    def to_json(self) -> str:
        return self.model_dump_json()
