"""WebSocket connection manager for multi-client game communication.

Manages connections by role (presentation, admin, player) and broadcasts
game state updates with role-based filtering.
"""

import json
import logging
from typing import Dict, List, Optional

from fastapi import WebSocket

from app.models.websocket_messages import ServerMessage

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages WebSocket connections grouped by role."""

    def __init__(self) -> None:
        # Key: "presentation", "admin", "player:{id}"
        self._connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, role: str) -> None:
        """Accept and register a WebSocket connection."""
        await websocket.accept()
        if role not in self._connections:
            self._connections[role] = []
        self._connections[role].append(websocket)
        logger.info(f"WebSocket connected: {role} (total: {self._count_all()})")

    def disconnect(self, websocket: WebSocket, role: str) -> None:
        """Remove a WebSocket connection."""
        if role in self._connections:
            self._connections[role] = [
                ws for ws in self._connections[role] if ws is not websocket
            ]
            if not self._connections[role]:
                del self._connections[role]
        logger.info(f"WebSocket disconnected: {role} (total: {self._count_all()})")

    async def send_to_role(self, role: str, message: ServerMessage) -> None:
        """Send a message to all connections of a specific role."""
        if role not in self._connections:
            return
        data = message.to_json()
        dead = []
        for ws in self._connections[role]:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections[role].remove(ws)

    async def send_to_player(self, player_id: str, message: ServerMessage) -> None:
        """Send a message to a specific player."""
        await self.send_to_role(f"player:{player_id}", message)

    async def broadcast_to_presentations(self, message: ServerMessage) -> None:
        """Send to all presentation clients."""
        await self.send_to_role("presentation", message)

    async def broadcast_to_admins(self, message: ServerMessage) -> None:
        """Send to all admin clients."""
        await self.send_to_role("admin", message)

    async def broadcast_to_all_players(self, message_factory) -> None:
        """Send personalized messages to each player.

        message_factory: callable(player_id) -> ServerMessage
        """
        player_roles = [r for r in self._connections if r.startswith("player:")]
        for role in player_roles:
            player_id = role.split(":", 1)[1]
            message = message_factory(player_id)
            await self.send_to_role(role, message)

    async def broadcast_state_update(self, game_service) -> None:
        """Broadcast filtered state updates to all connected clients."""
        state = game_service.state

        # Presentation gets state without answers
        await self.broadcast_to_presentations(ServerMessage(
            type="state_update",
            payload=state.to_presentation_dict(),
        ))

        # Admin gets full state including answers and votes
        await self.broadcast_to_admins(ServerMessage(
            type="state_update",
            payload=state.to_admin_dict(),
        ))

        # Each player gets personalized state
        async def send_player_state(player_id: str) -> ServerMessage:
            return ServerMessage(
                type="state_update",
                payload=state.to_player_dict(player_id),
            )

        await self.broadcast_to_all_players(
            lambda pid: ServerMessage(
                type="state_update",
                payload=state.to_player_dict(pid),
            )
        )

    def get_connected_player_ids(self) -> List[str]:
        """Get list of connected player IDs."""
        return [
            role.split(":", 1)[1]
            for role in self._connections
            if role.startswith("player:")
        ]

    def _count_all(self) -> int:
        return sum(len(conns) for conns in self._connections.values())


# Singleton instance
ws_manager = WebSocketManager()
