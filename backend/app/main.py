import logging

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import game, rounds, players, ws
from app.services.game_service import game_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: try to restore persisted game state
    if game_service.load_from_file():
        logger.info("Restored game state from persisted file")
    else:
        logger.info("No persisted state found, starting fresh")
    yield
    # Shutdown: save current state
    game_service.save_to_file()
    logger.info("Game state saved on shutdown")


app = FastAPI(title="Weakest Link API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game", tags=["game"])
app.include_router(rounds.router, prefix="/api/rounds", tags=["rounds"])
app.include_router(players.router, prefix="/api/players", tags=["players"])
app.include_router(ws.router, prefix="/api/ws", tags=["websocket"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
