from fastapi import APIRouter, UploadFile, File, HTTPException
import asyncio
import json
import os
import re
import subprocess
import tempfile
from twelvelabs import TwelveLabs

router = APIRouter()

TWELVELABS_API_KEY = os.getenv("TWELVELABS_API_KEY")
TWELVELABS_INDEX_NAME = os.getenv("TWELVELABS_INDEX_NAME", "speakiq")

_index_id = None

def get_client():
    return TwelveLabs(api_key=TWELVELABS_API_KEY)

def get_or_create_index(client) -> str:
    global _index_id
    if _index_id:
        return _index_id

    for idx in client.indexes.list():
        if idx.index_name == TWELVELABS_INDEX_NAME:
            _index_id = idx.id
            return _index_id

    created = client.indexes.create(
        index_name=TWELVELABS_INDEX_NAME,
        models=[
            {"model_name": "marengo3.0", "model_options": ["visual", "audio"]},
            {"model_name": "pegasus1.2", "model_options": ["visual", "audio"]},
        ],
    )
    _index_id = created.id
    return _index_id

def fix_video_with_ffmpeg(input_path: str) -> str:
    output_path = input_path.rsplit('.', 1)[0] + '_fixed.mp4'
    try:
        result = subprocess.run(
            ['ffmpeg', '-i', input_path, '-c:v', 'libx264', '-c:a', 'aac', '-y', output_path],
            capture_output=True, timeout=120
        )
        if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            os.unlink(input_path)
            return output_path
    except Exception as e:
        print(f"ffmpeg error: {e}")
    return input_path

def upload_and_index(client, video_path: str) -> str:
    import time
    index_id = get_or_create_index(client)
    with open(video_path, "rb") as f:
        mime = "video/mp4" if video_path.endswith(".mp4") else "video/webm"
        task = client.tasks.create(
            index_id=index_id,
            video_file=(os.path.basename(video_path), f, mime),
        )
    while True:
        t = client.tasks.retrieve(task.id)
        if t.status == "ready":
            return t.video_id
        if t.status == "failed":
            raise RuntimeError(f"Twelve Labs indexing failed: {t.status}")
        time.sleep(5)

def analyze_video(client, video_id: str) -> dict:
    prompt = """Analyze this public speaking video carefully. Return ONLY valid JSON with this exact structure:
{
  "eye_contact": {
    "score": <int 0-100>,
    "detail": "<one specific observation, max 12 words>"
  },
  "posture": {
    "score": <int 0-100>,
    "detail": "<one specific observation, max 12 words>"
  },
  "presence": {
    "score": <int 0-100>,
    "detail": "<one specific observation about physical presence and body language, max 12 words>"
  },
  "facial_expressiveness": {
    "score": <int 0-100>,
    "detail": "<one specific observation, max 12 words>"
  },
  "movement_quality": {
    "score": <int 0-100>,
    "detail": "<one specific observation about gestures and body movement, max 12 words>"
  },
  "notable_behaviors": ["<specific observed behavior>"],
  "observations": "<3-4 sentences describing the speaker's physical presence and visual delivery>",
  "coaching_tips": [
    {
      "priority": "<high|medium|low>",
      "title": "<short actionable title, max 8 words>",
      "description": "<2-3 sentences explaining the issue and why it matters>",
      "drill": "<specific 1-2 sentence practice exercise the speaker can do today>"
    }
  ]
}

SCORING RULES — be critical and honest, use the full range:
- 90-100: Truly exceptional, rarely given
- 75-89: Solid with only minor issues
- 60-74: Adequate but noticeable room for improvement
- 40-59: Clear issues that need work
- 0-39: Significant problems

Do NOT default to high scores. If someone is nervous, fidgeting, avoiding eye contact, slouching, or has distracting movements — reflect that accurately in the score. Be a strict but fair coach. Only include coaching_tips for genuine issues — fewer tips is better than forced ones."""

    result = client.analyze(video_id=video_id, prompt=prompt)
    raw = result.data if hasattr(result, "data") else str(result)
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'\{[\s\S]+\}', cleaned)
        if match:
            return json.loads(match.group(0))
        return {
            "eye_contact": {"score": 50, "detail": "Could not analyze eye contact."},
            "posture": {"score": 50, "detail": "Could not analyze posture."},
            "presence": {"score": 50, "detail": "Could not analyze presence."},
            "facial_expressiveness": {"score": 50, "detail": "Could not analyze facial expressiveness."},
            "movement_quality": {"score": 50, "detail": "Could not analyze movement."},
            "notable_behaviors": [],
            "observations": "Video analysis unavailable.",
            "coaching_tips": [],
        }

def cleanup_video(client, video_id: str, index_id: str):
    try:
        client.indexes.videos.delete(index_id=index_id, id=video_id)
    except Exception:
        pass

@router.post("/")
async def analyze_video_file(video: UploadFile = File(...)):
    tmp_path = None
    video_id = None
    client = get_client()

    try:
        contents = await video.read()
        suffix = ".webm" if "webm" in (video.content_type or "") else ".mp4"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        loop = asyncio.get_event_loop()
        fixed_path = await loop.run_in_executor(None, fix_video_with_ffmpeg, tmp_path)
        tmp_path = fixed_path

        video_id = await loop.run_in_executor(None, upload_and_index, client, tmp_path)
        result = await loop.run_in_executor(None, analyze_video, client, video_id)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if video_id:
            index_id = get_or_create_index(client)
            await asyncio.get_event_loop().run_in_executor(
                None, cleanup_video, client, video_id, index_id
            )
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass