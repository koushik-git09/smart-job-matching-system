from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from gemini_chat import get_resume_suggestions

router = APIRouter()


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
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Chatbot service error")
