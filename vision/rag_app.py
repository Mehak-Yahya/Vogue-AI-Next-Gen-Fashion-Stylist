import sys
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Add the "RAG Model" folder to Python's system path so we can import query_rag
sys.path.append(os.path.join(os.path.dirname(__file__), "RAG Model"))

from query_rag import query_rag_chatbot

app = FastAPI(title="Vogue AI — RAG Knowledge Engine", version="1.0.0")

class ChatRequest(BaseModel):
    season: str = ""
    question: str = ""
    history: list[dict[str, str]] = []

@app.get("/")
def health_check():
    return {"status": "RAG Chatbot Service is active and running."}

@app.post("/chat-rag")
async def chat_rag(payload: ChatRequest):
    """
    RAG Chatbot Endpoint: Accepts an optional seasonal match and user question,
    queries ChromaDB, and returns evidence-backed fashion guidance.
    """
    try:
        result = query_rag_chatbot(payload.season, payload.question, payload.history)
        return {"success": True, "data": result}
    except Exception as e:
        return {"success": False, "error": str(e)}