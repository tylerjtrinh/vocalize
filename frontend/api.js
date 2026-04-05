// ─────────────────────────────────────────────────────────────────────────────
// SmartSpeak — API Client
//
// Backend team: point API_BASE at your FastAPI server.
// Enable CORS for the origin serving these HTML files.
//
// Expected endpoints:
//   POST /api/analyze          multipart/form-data { video: File }
//   GET  /api/exercises        ?analysisId=<id>   (optional)
//   GET  /api/progress
//   GET  /api/coach/message
//
// All responses must match the shapes documented in each function below.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000';  // ← backend team: change this

// ── POST /api/analyze ────────────────────────────────────────────────────────
// Request:  FormData with field "video" (File)
// Response: {
//   analysisId:        string,
//   transcript:        string,
//   overallScore:      number,           // 0–100
//   metrics: [{
//     label:    string,                  // "Eye Contact" | "Pacing" | "Articulation" | "Emotion and Tone" | "Hand Gestures"
//     score:    number,                  // 0–100
//     feedback: string,
//     tip:      string
//   }],
//   fillerWords: [{ word: string, count: number }],
//   elevenLabsAudioUrl: string | null,   // path served by backend e.g. /static/audio_<id>.mp3
//   recommendations: [{
//     title:     string,
//     channel:   string,
//     url:       string,
//     relevance: string
//   }]
// }
async function analyzeVideo(file) {
  const form = new FormData();
  form.append('video', file);
  const res = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}

// ── GET /api/exercises ───────────────────────────────────────────────────────
// Response: [{
//   id:                   string,
//   type:                 "reading" | "speaking",
//   focus:                string,   // metric this targets
//   level:                string,
//   title:                string,
//   instructions:         string,
//   content:              string,
//   elevenlabsExampleUrl: string | null,
//   tags:                 string[]
// }]
async function getExercises(analysisId) {
  const url = analysisId
    ? `${API_BASE}/api/exercises?analysisId=${analysisId}`
    : `${API_BASE}/api/exercises`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}

// ── GET /api/progress ────────────────────────────────────────────────────────
// Response: [{
//   sessionId:    string,
//   date:         string,   // ISO date e.g. "2026-04-04"
//   overallScore: number,
//   eyeContact:   number,
//   pacing:       number,
//   emotion:      number,
//   articulation: number
// }]
async function getProgress() {
  const res = await fetch(`${API_BASE}/api/progress`);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}

// ── GET /api/coach/message ───────────────────────────────────────────────────
// Response: {
//   message:                string,
//   focusArea:              string,
//   exercisesRecommended:   string[]
// }
async function getCoachMessage() {
  const res = await fetch(`${API_BASE}/api/coach/message`);
  if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
  return res.json();
}
