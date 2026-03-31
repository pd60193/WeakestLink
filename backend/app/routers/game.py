from fastapi import APIRouter

router = APIRouter()


@router.get("/config")
def get_game_config():
    return {}


@router.get("/state")
def get_game_state():
    return {}


@router.post("/action")
def game_action():
    return {"status": "ok"}


@router.post("/reset")
def reset_game():
    return {"status": "ok"}
