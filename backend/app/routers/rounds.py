from fastapi import APIRouter

router = APIRouter()


@router.get("/{round_number}/questions")
def get_round_questions(round_number: int):
    return []
