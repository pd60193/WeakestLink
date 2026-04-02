"""WebSocket endpoints for real-time game communication."""

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.game_state import GamePhase
from app.models.websocket_messages import ClientMessage, ServerMessage
from app.services.game_service import game_service
from app.services.timer_service import timer_service
from app.services.voting_service import voting_service
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()


async def _handle_state_change(event_type: str = "state_update") -> None:
    """Callback for game_service to broadcast state changes."""
    await ws_manager.broadcast_state_update(game_service)


# Wire up the callback
game_service.set_state_change_callback(_handle_state_change)


async def _broadcast_vote_result(result: dict) -> None:
    """Broadcast vote result to all clients."""
    await ws_manager.broadcast_to_admins(ServerMessage(
        type="vote_result",
        payload=result,
    ))
    presentation_payload = {
        "eliminated": result.get("eliminated"),
        "votes": result.get("votes"),
        "voteRevealOrder": result.get("voteRevealOrder"),
    }
    await ws_manager.broadcast_to_presentations(ServerMessage(
        type="vote_result",
        payload=presentation_payload,
    ))
    await ws_manager.broadcast_to_all_players(
        lambda pid: ServerMessage(
            type="vote_result",
            payload={
                "eliminated": result.get("eliminated"),
                "votes": result.get("votes"),
            },
        )
    )


async def _handle_admin_message(data: dict) -> None:
    """Process messages from admin client."""
    msg = ClientMessage(**data)

    if msg.type == "action":
        action = msg.payload.get("action")

        if action == "create_game":
            await game_service.create_game()

        elif action == "reset_game":
            await game_service.reset_game()

        elif action == "start_game":
            await game_service.start_game()

        elif action == "start_timer":
            await game_service.start_timer()
            await timer_service.start()

        elif action == "toggle_pause":
            await game_service.toggle_pause()

        elif action == "reveal_question":
            await game_service.reveal_question()

        elif action == "correct":
            await game_service.mark_correct()

        elif action == "incorrect":
            await game_service.mark_incorrect()

        elif action == "bank":
            await game_service.bank()

        elif action == "next_question":
            await game_service.next_question()

        elif action == "start_voting":
            await timer_service.stop()
            await voting_service.start_voting()

        elif action == "end_voting":
            if game_service.state.phase == GamePhase.VOTING:
                result = await voting_service.end_voting()
                await _broadcast_vote_result(result)

        elif action == "reveal_next_vote":
            # Pass-through broadcast to presentation
            await ws_manager.broadcast_to_presentations(ServerMessage(
                type="reveal_next_vote",
                payload={},
            ))
            await ws_manager.broadcast_to_admins(ServerMessage(
                type="reveal_next_vote",
                payload={},
            ))

        elif action == "reveal_all_votes":
            # Pass-through broadcast to presentation
            await ws_manager.broadcast_to_presentations(ServerMessage(
                type="reveal_all_votes",
                payload={},
            ))
            await ws_manager.broadcast_to_admins(ServerMessage(
                type="reveal_all_votes",
                payload={},
            ))

        elif action == "confirm_elimination":
            # Transition to next round
            await game_service.transition_to_round_screen()
            await game_service.next_round()

        elif action == "next_round":
            await game_service.transition_to_round_screen()
            await game_service.next_round()

        elif action == "kick_player":
            player_id = msg.payload.get("player_id")
            if player_id:
                await game_service.remove_player(player_id)

        elif action == "reorder_players":
            order = msg.payload.get("order", [])
            if order:
                await game_service.reorder_players(order)

        else:
            logger.warning(f"Unknown admin action: {action}")

    elif msg.type == "ping":
        pass  # Keep-alive, no action needed


async def _handle_player_message(data: dict, player_id: str) -> None:
    """Process messages from player client."""
    msg = ClientMessage(**data)

    if msg.type == "vote":
        voted_for = msg.payload.get("voted_for")
        if voted_for:
            try:
                result = await game_service.cast_vote(player_id, voted_for)
                if result is not None:
                    # Voting auto-ended — broadcast the result
                    from app.services.voting_service import voting_service
                    await voting_service.stop_timer()
                    await _broadcast_vote_result(result)
            except ValueError as e:
                await ws_manager.send_to_player(player_id, ServerMessage(
                    type="error",
                    payload={"message": str(e)},
                ))

    elif msg.type == "ping":
        pass


@router.websocket("/presentation")
async def presentation_ws(websocket: WebSocket):
    """WebSocket endpoint for presentation portal (read-only)."""
    role = "presentation"
    await ws_manager.connect(websocket, role)

    # Send initial state
    await websocket.send_text(ServerMessage(
        type="state_update",
        payload=game_service.state.to_presentation_dict(),
    ).to_json())

    try:
        while True:
            data = await websocket.receive_text()
            # Presentation is read-only, only handle pings
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "ping":
                    await websocket.send_text(ServerMessage(
                        type="pong", payload={}
                    ).to_json())
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, role)


@router.websocket("/admin")
async def admin_ws(websocket: WebSocket):
    """WebSocket endpoint for admin portal (read-write controller)."""
    role = "admin"
    await ws_manager.connect(websocket, role)

    # Send initial state
    await websocket.send_text(ServerMessage(
        type="state_update",
        payload=game_service.state.to_admin_dict(),
    ).to_json())

    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                await _handle_admin_message(parsed)
            except json.JSONDecodeError:
                await websocket.send_text(ServerMessage(
                    type="error",
                    payload={"message": "Invalid JSON"},
                ).to_json())
            except ValueError as e:
                await websocket.send_text(ServerMessage(
                    type="error",
                    payload={"message": str(e)},
                ).to_json())
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, role)


@router.websocket("/player/{player_id}")
async def player_ws(websocket: WebSocket, player_id: str):
    """WebSocket endpoint for player portal."""
    role = f"player:{player_id}"
    await ws_manager.connect(websocket, role)

    # Send initial state
    await websocket.send_text(ServerMessage(
        type="state_update",
        payload=game_service.state.to_player_dict(player_id),
    ).to_json())

    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                await _handle_player_message(parsed, player_id)
            except json.JSONDecodeError:
                await websocket.send_text(ServerMessage(
                    type="error",
                    payload={"message": "Invalid JSON"},
                ).to_json())
            except ValueError as e:
                await websocket.send_text(ServerMessage(
                    type="error",
                    payload={"message": str(e)},
                ).to_json())
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, role)
