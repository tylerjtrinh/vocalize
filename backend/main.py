from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from analyze import router as analyze_router
from coach import router as coach_router
from speak import router as speak_router
from video import router as video_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router, prefix="/api/analyze")
app.include_router(coach_router, prefix="/api/coach")
app.include_router(speak_router, prefix="/api/speak")
app.include_router(video_router, prefix="/api/video")

@app.get("/")
def root():
    return {"message": "Vocalize backend is running"}