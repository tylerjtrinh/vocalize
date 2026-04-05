# Vocalize 🎙️

> An AI-powered public speaking coach that analyzes your voice and video to help you speak with more clarity, confidence, and impact.

---

## Inspiration

Vocalize started from a simple idea: helping people feel more comfortable expressing themselves out loud. We initially explored ways to support people with language and communication but quickly realized the challenge goes beyond that.

We landed on public speaking and the struggles many people face with it. A lot of people, including our classmates, struggle with speaking confidently — whether it's for presentations, class discussions, or important pitches. It's not always about knowing what to say, but about how to say it clearly and confidently.

That's what led us to create Vocalize. We wanted to build a tool that helps people turn their ideas into clear, structured speech and feel more confident when sharing them. Our goal is to make speaking feel less stressful, more effective, and accessible for everyone.

---

## What it does

Vocalize is a platform that analyzes recorded speech — including both audio and video — to help users improve their speaking skills.

- 🎙️ **Audio analysis** — transcription, filler word detection, pacing, clarity, emotion, dynamics, and confidence scoring
- 🎥 **Video analysis** — eye contact, posture, presence, facial expressiveness, and movement quality
- 🤖 **AI coaching** — personalized feedback, strengths, improvements, and actionable drills
- 🔊 **Voice feedback** — ElevenLabs reads your coaching summary aloud like a real coach
- 📊 **Full breakdown** — color-coded scores for every dimension of your speech
- 📝 **Live transcript** — see your words in real time as you speak

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Tailwind CSS + Vite |
| Backend | Python + FastAPI |
| Transcription + Voice Analysis | Google Gemini |
| Video Analysis | Twelve Labs |
| AI Coaching | Google Gemini |
| Voice Output | ElevenLabs |
| Frontend Hosting | Railway |
| Backend Hosting | Railway |

---

## How we built it

We separated our team into different sections — one focusing on frontend and design, one on speech functions (recording and AI coach speaking feedback), and another on video analysis. After making sure each part worked independently, we integrated everything into the final project.

**Backend routes:**
- `analyze.py` — Gemini audio transcription + voice analysis (tone, energy, emotion, pacing, etc.)
- `coach.py` — Gemini coaching scores, feedback, strengths, improvements, and spoken summary
- `speak.py` — ElevenLabs text-to-speech for vocal coach feedback
- `video.py` — Twelve Labs video upload and visual analysis (eye contact, posture, presence, etc.)

We also built two recorders — one for audio only and one for audio + video — with live browser transcription via the Web Speech API.

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- ffmpeg (`brew install ffmpeg` on Mac)
- API keys for: Gemini, ElevenLabs, Twelve Labs

---

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/vocalize.git
cd vocalize
```

---

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and fill in your API keys
```

**`.env` file:**
```
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
TWELVELABS_API_KEY=your_key_here
TWELVELABS_INDEX_NAME=vocalize
```

**Start the backend:**
```bash
uvicorn main:app --reload
# Runs on http://localhost:8000
```

---

### 3. Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# Runs on http://localhost:5174
```

Open **http://localhost:5174** in your browser.

---

## Challenges we ran into

We had issues getting our product to work across different platforms, as team members used different operating systems (macOS and Windows 11). We also faced challenges with API versioning and integrating multiple external services into a cohesive backend.

---

## Accomplishments we're proud of

We're proud of getting a viable, full-stack AI product up and running in limited time — surpassing our original goals and delivering a functional project that embodies our original mission.

---

## What we learned

We learned a lot about breaking down goals into manageable steps, making it easier to divide work and collaborate. Many of us had limited experience with parts of frontend and backend development, and this project pushed us to learn quickly and help each other.

---

## What's next for Vocalize

- ⚡ Faster performance and smoother overall experience
- 📄 Script generation and upload functionality
- 🗃️ Database to store past sessions and track progress over time
- 🏆 Leaderboard to review top public speakers and learn from them
- 📱 Mobile support

---

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze/` | Audio transcription + voice analysis |
| POST | `/api/coach/feedback` | AI coaching scores + feedback |
| POST | `/api/speak/` | Text → ElevenLabs audio |
| POST | `/api/video/` | Video upload + Twelve Labs analysis |