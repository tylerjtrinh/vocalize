from fastapi import APIRouter, UploadFile, File, HTTPException
from google import genai
import os
import base64
import json
import re

router = APIRouter()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@router.post("/")
async def analyze_audio(audio: UploadFile = File(...)):
    try:
        contents = await audio.read()
        audio_b64 = base64.b64encode(contents).decode("utf-8")

        prompt = """
        Listen to this audio carefully. Transcribe it and do a deep analysis of both the content AND the voice.
        Respond ONLY in this exact JSON format with no extra text:
        {
            "transcript": "<exact word for word transcript>",
            "word_count": <number>,
            "filler_words": {
                "um": <count>,
                "uh": <count>,
                "like": <count>,
                "basically": <count>,
                "literally": <count>,
                "right": <count>
            },
            "voice_analysis": {
                "tone": "<e.g. confident, nervous, monotone, energetic, calm, authoritative>",
                "energy": "<low, medium, high>",
                "clarity": "<poor, fair, good, excellent>",
                "pace_description": "<too fast, slightly fast, good, slightly slow, too slow>",
                "pauses": {
                    "usage": "<none, too few, appropriate, too many>",
                    "effectiveness": "<e.g. pauses are well placed for emphasis, pauses feel awkward, no pauses used>",
                    "count": <estimated number of notable pauses>
                },
                "dynamics": {
                    "pitch_variation": "<monotone, slight variation, good variation, very dynamic>",
                    "volume_variation": "<flat, slight variation, good variation, very dynamic>",
                    "expressiveness": "<low, medium, high>"
                },
                "emotion": {
                    "primary": "<e.g. nervous, confident, excited, bored, passionate, anxious, calm>",
                    "secondary": "<e.g. hopeful, uncertain, enthusiastic>",
                    "authenticity": "<forced, neutral, genuine>",
                    "emotional_range": "<flat, limited, moderate, wide>"
                },
                "observations": "<3-4 sentences about how the person sounds, covering tone, emotion, and delivery>"
            }
        }
        Only include filler words with count > 0. If no speech detected use empty transcript.
        """

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite-preview",
            contents=[
                {"inline_data": {"mime_type": "audio/webm", "data": audio_b64}},
                prompt
            ]
        )

        text = response.text.strip()
        text = re.sub(r"```json|```", "", text).strip()
        result = json.loads(text)

        return {
            "transcript": result.get("transcript", ""),
            "word_count": result.get("word_count", 0),
            "filler_words": {k: v for k, v in result.get("filler_words", {}).items() if v > 0},
            "voice_analysis": result.get("voice_analysis", {}),
            "wpm": 0,
            "duration_seconds": 0,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))