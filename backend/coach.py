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
    video_analysis: dict = {}

@router.post("/feedback")
async def get_feedback(data: AnalysisData):
    try:
        filler_summary = ", ".join([f'"{w}" ({c}x)' for w, c in data.filler_words.items()]) or "none"

        video_section = ""
        if data.video_analysis:
            video_section = f"""
VIDEO ANALYSIS (from Twelve Labs):
- Eye contact: {data.video_analysis.get('eye_contact', {}).get('score', 'N/A')}/100 — {data.video_analysis.get('eye_contact', {}).get('detail', '')}
- Posture: {data.video_analysis.get('posture', {}).get('score', 'N/A')}/100 — {data.video_analysis.get('posture', {}).get('detail', '')}
- Presence: {data.video_analysis.get('presence', {}).get('score', 'N/A')}/100 — {data.video_analysis.get('presence', {}).get('detail', '')}
- Facial expressiveness: {data.video_analysis.get('facial_expressiveness', {}).get('score', 'N/A')}/100 — {data.video_analysis.get('facial_expressiveness', {}).get('detail', '')}
- Movement quality: {data.video_analysis.get('movement_quality', {}).get('score', 'N/A')}/100 — {data.video_analysis.get('movement_quality', {}).get('detail', '')}
- Notable behaviors: {', '.join(data.video_analysis.get('notable_behaviors', [])) or 'none'}
"""

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
        - Expressiveness: {data.voice_analysis.get('expressiveness', 'unknown')}
        - Emotion: {data.voice_analysis.get('emotion', {})}
        - Observations: {data.voice_analysis.get('observations', 'none')}
        {video_section}

        Respond in this EXACT JSON format with no extra text:
{{
    "overall_score": <number 1-100>,
    "spoken_feedback": "<a warm, personal, conversational coaching message. Start with 'Hey,' and talk directly to the speaker. DO NOT mention any numbers or scores. Use categorical language only (e.g. 'your pacing was a bit fast', 'your clarity was excellent', 'your tone came across as flat'). Be balanced and honest — do not over-praise. Cover what they did well with reasons why it worked. Only mention improvements if there are genuine ones — if there are, go all in and be specific about why it matters. Do not force or invent feedback. Sound like a real coach having a conversation, not reading a report. 4-6 sentences.>",
    "scores": {{
        "pacing":     {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }},
        "clarity":    {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }},
        "confidence": {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }},
        "structure":  {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }},
        "emotion":    {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }},
        "dynamics":   {{ "score": <number 1-100>, "detail": "<one specific observation, max 12 words>" }}
    }},
    "strengths": ["<up to 5 genuine strengths, only include real ones>"],
    "improvements": ["<up to 5 genuine improvements, only include real ones>"],
    "summary": "<3-4 sentence coaching summary covering content, voice, and emotion>",
    "coaching_tips": [
        {{
            "priority": "<high|medium|low>",
            "title": "<short actionable title, max 8 words>",
            "description": "<2-3 sentences explaining the issue and why it matters>",
            "drill": "<specific 1-2 sentence practice exercise the speaker can do today>"
        }}
    ]
}}
Only include coaching_tips for genuine issues. Fewer tips is better than forced ones.
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