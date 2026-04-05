from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analyze import router as analyze_router
from coach import router as coach_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/analyze")
app.include_router(coach_router, prefix="/api/coach")

@app.get("/")
def root():
    return {"message": "SpeakIQ backend is running"}