from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from utils import extract_text_from_url, init_gemini, ask_gemini
from dotenv import load_dotenv
import logging
import os

load_dotenv()

app = FastAPI()

# Allow CORS from your frontend (adjust as needed)
origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini once
gemini = init_gemini()

# Request models
class URLInput(BaseModel):
    url: str

class ChatInput(BaseModel):
    context: str
    question: str

@app.post("/extract")
def extract_url(data: URLInput):
    logger = logging.getLogger(__name__)
    logger.info(f"Received extraction request for URL: {data.url}")
    text = extract_text_from_url(data.url, max_child_urls=30)
    return {"text": text}

@app.post("/chat")
def chat_with_url(data: ChatInput):
    logger = logging.getLogger(__name__)
    logger.info(f"Received chat request. Question: {data.question}")
    response = ask_gemini(gemini, data.context, data.question)
    return {"response": response}