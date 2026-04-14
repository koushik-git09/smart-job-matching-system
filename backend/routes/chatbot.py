import os
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from gemini_chat import get_resume_suggestions

router = APIRouter()

logger = logging.getLogger(__name__)


class ChatbotRequest(BaseModel):
    resume_text: str
    query: str


class ChatbotResponse(BaseModel):
    response: str


@router.post("/chatbot", response_model=ChatbotResponse, tags=["Chatbot"])
def chatbot(req: ChatbotRequest):
    try:
        response_text = get_resume_suggestions(req.resume_text, req.query)
        return {"response": response_text}
    except RuntimeError as exc:
        # e.g. missing GEMINI_API_KEY
        logger.exception("Chatbot runtime error")
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Chatbot service error")
        if (os.getenv("CHATBOT_DEBUG_ERRORS") or "").strip() == "1":
            raise HTTPException(status_code=502, detail=f"Chatbot service error: {exc}")
        raise HTTPException(status_code=502, detail="Chatbot service error")
