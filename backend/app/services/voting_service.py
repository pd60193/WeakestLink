"""Voting service — thin wrapper around game_service voting methods.

Provides a dedicated interface for voting operations and vote timer management.
"""

import asyncio
from typing import Optional

from app.services.game_service import game_service

VOTING_DURATION_SECONDS = 30


class VotingService:
    """Manages the voting phase timer and delegates vote operations to game_service."""

    def __init__(self) -> None:
        self._timer_task: Optional[asyncio.Task] = None
        self.time_remaining: int = VOTING_DURATION_SECONDS

    async def start_voting(self) -> None:
        """Start the voting phase with countdown timer."""
        self.time_remaining = VOTING_DURATION_SECONDS
        await game_service.start_voting()
        self._timer_task = asyncio.create_task(self._run_timer())

    async def cast_vote(self, voter_id: str, voted_for_id: str) -> None:
        """Delegate vote casting to game service."""
        await game_service.cast_vote(voter_id, voted_for_id)

    async def end_voting(self) -> dict:
        """Stop timer and end voting."""
        await self.stop_timer()
        return await game_service.end_voting()

    async def stop_timer(self) -> None:
        """Stop the voting countdown timer."""
        await self._stop_timer()

    async def _stop_timer(self) -> None:
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
            try:
                await self._timer_task
            except asyncio.CancelledError:
                pass
        self._timer_task = None

    async def _run_timer(self) -> None:
        """Countdown timer for voting phase."""
        try:
            while self.time_remaining > 0:
                await asyncio.sleep(1)
                self.time_remaining -= 1
            # Auto-end voting when timer expires
            await game_service.end_voting()
        except asyncio.CancelledError:
            pass


# Singleton instance
voting_service = VotingService()
