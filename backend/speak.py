from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from elevenlabs.client import ElevenLabs
import os
import io

router = APIRouter()

client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

VOICE_ID = "U3TIKdpecikcU5Itm5fn"  # "George" - warm, coaching voice

class SpeakRequest(BaseModel):
    text: str

@router.post("/")
async def text_to_speech(req: SpeakRequest):
    try:
        audio = client.text_to_speech.convert(
            voice_id=VOICE_ID,
            text=req.text,
            model_id="eleven_turbo_v2",
        )

        audio_bytes = io.BytesIO()
        for chunk in audio:
            audio_bytes.write(chunk)
        audio_bytes.seek(0)

        return StreamingResponse(
            audio_bytes,
            media_type="audio/mpeg",
        )

    except Exception as e:
        print(f"ElevenLabs error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))