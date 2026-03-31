from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import game, rounds, players

app = FastAPI(title="Weakest Link API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game", tags=["game"])
app.include_router(rounds.router, prefix="/api/rounds", tags=["rounds"])
app.include_router(players.router, prefix="/api/players", tags=["players"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
