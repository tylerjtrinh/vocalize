from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
import os
import json
import re

router = APIRouter()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class AnalysisData(BaseModel):
    transcript: str
    wpm: int
    filler_words: dict
    word_count: int
    duration_seconds: float
    voice_analysis: dict = {}

@router.post("/feedback")
async def get_feedback(data: AnalysisData):
    try:
        filler_summary = ", ".join([f'"{w}" ({c}x)' for w, c in data.filler_words.items()]) or "none"

        prompt = f"""
        You are an expert public speaking coach. Analyze this speech and respond ONLY in JSON format.

        SPEECH DATA:
        - Transcript: "{data.transcript}"
        - Words per minute: {data.wpm} (ideal is 120-150 WPM)
        - Duration: {round(data.duration_seconds, 1)} seconds
        - Filler words: {filler_summary}
        - Word count: {data.word_count}

        VOICE ANALYSIS:
        - Tone: {data.voice_analysis.get('tone', 'unknown')}
        - Energy: {data.voice_analysis.get('energy', 'unknown')}
        - Clarity: {data.voice_analysis.get('clarity', 'unknown')}
        - Pace: {data.voice_analysis.get('pace_description', 'unknown')}
        - Pauses: {data.voice_analysis.get('pauses', {})}
        - Dynamics: {data.voice_analysis.get('dynamics', {})}
        - Emotion: {data.voice_analysis.get('emotion', {})}
        - Observations: {data.voice_analysis.get('observations', 'none')}

        Respond in this EXACT JSON format with no extra text:
        {{
            "overall_score": <number 1-100>,
            "spoken_feedback": "<a warm, personal, conversational coaching message. Start with 'Hey,' and talk directly to the speaker. DO NOT mention any numbers or scores. Use categorical language only (e.g. 'your pacing was a bit fast', 'your clarity was excellent', 'your tone came across as flat'). Cover what they did well with reasons why it worked. Only mention improvements if there are genuine ones — if they did really well, just say so and give specific praise. If there are real improvements, explain why they matter. Do not force or invent feedback. Sound like a real coach having a conversation, not reading a report. 3-7 sentences depending on how much genuine feedback there is.>",
            "scores": {{
                "pacing": <number 1-100>,
                "clarity": <number 1-100>,
                "confidence": <number 1-100>,
                "structure": <number 1-100>,
                "emotion": <number 1-100>,
                "dynamics": <number 1-100>
            }},
            "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "summary": "<3-4 sentence coaching summary covering content, voice, and emotion>"
        }}
        """

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=prompt
        )

        text = response.text.strip()
        text = re.sub(r"```json|```", "", text).strip()
        result = json.loads(text)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))