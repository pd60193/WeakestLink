import asyncio
from typing import Optional

from app.services.game_service import game_service


class TimerService:
    """Server-side timer that ticks every second and updates game state."""

    def __init__(self) -> None:
        self._task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start the timer loop. Runs until timer reaches 0 or is stopped."""
        if self._task and not self._task.done():
            return  # Already running
        self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        """Stop the timer loop."""
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None

    async def _run(self) -> None:
        """Timer loop — tick every second."""
        try:
            while True:
                await asyncio.sleep(1)
                state = game_service.state
                if not state.timer_running or state.timer_paused:
                    continue
                await game_service.timer_tick()
                if state.time_remaining <= 0:
                    break
        except asyncio.CancelledError:
            pass


# Singleton instance
timer_service = TimerService()
