import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ScoreBar from '../components/ScoreBar'
import Navbar from '../components/Navbar'

const getCategory = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400' }
  if (score >= 75) return { label: 'Good', color: 'text-blue-400' }
  if (score >= 60) return { label: 'Fair', color: 'text-yellow-400' }
  if (score >= 40) return { label: 'Needs Work', color: 'text-orange-400' }
  return { label: 'Poor', color: 'text-red-400' }
}

const priorityColor = {
  high: 'text-red-400 border-red-400/30 bg-red-400/5',
  medium: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/5',
  low: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
}

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const analysis = state?.analysis
  const feedback = state?.feedback
  const videoAnalysis = state?.videoAnalysis
  const mode = state?.mode

  const [audioLoading, setAudioLoading] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioEl, setAudioEl] = useState(null)
  const [showTranscript, setShowTranscript] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  if (!analysis) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <p className="text-white">No results found.</p>
    </div>
  )

  const voice = analysis.voice_analysis || {}
  const emotion = voice.emotion || {}
  const pauses = voice.pauses || {}
  const overallCategory = feedback ? getCategory(feedback.overall_score) : null
  const isVideoMode = mode === 'video' && videoAnalysis

  // Helper to get score value from new {score, detail} format
  const s = (key) => feedback?.scores?.[key]?.score ?? feedback?.scores?.[key]
  const d = (key) => feedback?.scores?.[key]?.detail

  const handlePlayFeedback = async () => {
    if (!feedback?.spoken_feedback) return
    if (audioPlaying && audioEl) {
      audioEl.pause()
      audioEl.currentTime = 0
      setAudioPlaying(false)
      return
    }
    try {
      setAudioLoading(true)
      const res = await fetch('/api/speak/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: feedback.spoken_feedback }),
      })
      if (!res.ok) throw new Error('Failed to generate audio')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      setAudioEl(audio)
      setAudioLoading(false)
      setAudioPlaying(true)
      audio.play()
      audio.onended = () => setAudioPlaying(false)
    } catch (e) {
      setAudioLoading(false)
      alert('Failed to play feedback: ' + e.message)
    }
  }

  const voiceScores = [
    { label: 'Pacing',     score: s('pacing') },
    { label: 'Clarity',    score: s('clarity') },
    { label: 'Confidence', score: s('confidence') },
    { label: 'Structure',  score: s('structure') },
    { label: 'Emotion',    score: s('emotion') },
    { label: 'Dynamics',   score: s('dynamics') },
  ]

  const videoScores = isVideoMode ? [
    { label: 'Eye Contact',           score: videoAnalysis.eye_contact?.score },
    { label: 'Posture',               score: videoAnalysis.posture?.score },
    { label: 'Presence',              score: videoAnalysis.presence?.score },
    { label: 'Facial Expressiveness', score: videoAnalysis.facial_expressiveness?.score },
    { label: 'Movement Quality',      score: videoAnalysis.movement_quality?.score },
  ] : []

  const DescField = ({ label, value, detail }) => (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white capitalize text-sm font-medium">{value}</p>
      {detail && <p className="text-gray-400 text-xs mt-0.5">{detail}</p>}
    </div>
  )

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center p-8 pt-20">
        <div className="w-full max-w-3xl">
          <h1 className="text-white text-4xl font-bold mb-8">Your Results</h1>

          {/* Overall score */}
          {feedback && (
            <div className="text-center mb-6">
              <div className="text-white text-8xl font-bold">{feedback.overall_score}</div>
              <div className={`text-2xl font-semibold mt-1 ${overallCategory.color}`}>
                {overallCategory.label}
              </div>
              <div className="text-gray-500 text-sm mt-1">Overall Score</div>
            </div>
          )}

          {/* Play feedback button */}
          {feedback?.spoken_feedback && (
            <div className="flex flex-col items-center mb-8 gap-3">
              <button
                onClick={handlePlayFeedback}
                disabled={audioLoading}
                className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-sm transition-all ${
                  audioPlaying
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-white hover:bg-gray-200 text-black'
                } disabled:opacity-50`}
              >
                {audioLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Loading audio...
                  </>
                ) : audioPlaying ? (
                  <>⏹ Stop Feedback</>
                ) : (
                  <>▶ Play Coach Feedback</>
                )}
              </button>
              <button
                onClick={() => setShowTranscript(t => !t)}
                className="text-gray-500 text-xs hover:text-gray-300 transition-all flex items-center gap-1"
              >
                {showTranscript ? '▲ Hide transcript' : '▼ Show Feedback Transcript'}
              </button>
              {showTranscript && (
                <div className="w-full border border-gray-700 rounded-xl p-4">
                  <p className="text-gray-300 text-sm leading-relaxed">{feedback.spoken_feedback}</p>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-white text-3xl font-bold">{analysis.wpm}</div>
              <div className="text-gray-400 text-sm">WPM</div>
            </div>
            <div className="border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-white text-3xl font-bold">{analysis.word_count}</div>
              <div className="text-gray-400 text-sm">Words</div>
            </div>
            <div className="border border-gray-700 rounded-xl p-4 text-center">
              <div className="text-white text-3xl font-bold">{Math.round(analysis.duration_seconds)}s</div>
              <div className="text-gray-400 text-sm">Duration</div>
            </div>
          </div>

          {/* Score breakdown — dropdown */}
          {feedback && (
            <div className="border border-gray-700 rounded-xl mb-6 overflow-hidden">
              <button
                onClick={() => setBreakdownOpen(o => !o)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-900 transition-all"
              >
                <h2 className="text-white text-xl font-semibold">Breakdown</h2>
                <span className="text-gray-400 text-lg">{breakdownOpen ? '▲' : '▼'}</span>
              </button>
              {breakdownOpen && (
                <div className="px-6 pb-6">
                  {isVideoMode ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <div className="flex flex-col gap-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">🎙️ Voice</p>
                        {voiceScores.map(({ label, score }) => (
                          <ScoreBar key={label} label={label} score={score} />
                        ))}
                      </div>
                      <div className="flex flex-col gap-4">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">🎥 Video</p>
                        {videoScores.map(({ label, score }) => (
                          <ScoreBar key={label} label={label} score={score} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {voiceScores.map(({ label, score }) => (
                        <ScoreBar key={label} label={label} score={score} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Video Analysis */}
          {isVideoMode && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6">
              <h2 className="text-white text-xl font-semibold mb-4">🎥 Video Analysis</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Eye Contact', key: 'eye_contact' },
                  { label: 'Posture', key: 'posture' },
                  { label: 'Presence', key: 'presence' },
                  { label: 'Facial Expressiveness', key: 'facial_expressiveness' },
                  { label: 'Movement Quality', key: 'movement_quality' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="text-gray-500 text-xs mb-1">{label}</p>
                    <p className={`text-sm font-medium ${getCategory(videoAnalysis[key]?.score).color}`}>
                      {getCategory(videoAnalysis[key]?.score).label}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{videoAnalysis[key]?.detail}</p>
                  </div>
                ))}
              </div>
              {videoAnalysis.notable_behaviors?.length > 0 && (
                <div className="pt-4 border-t border-gray-700 mb-4">
                  <p className="text-gray-500 text-xs mb-2">Notable Behaviors</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    {videoAnalysis.notable_behaviors.map((b, i) => <li key={i}>• {b}</li>)}
                  </ul>
                </div>
              )}
              {videoAnalysis.observations && (
                <div className="pt-4 border-t border-gray-700 mb-4">
                  <p className="text-gray-500 text-xs mb-2">Observations</p>
                  <p className="text-gray-300 leading-relaxed text-sm">{videoAnalysis.observations}</p>
                </div>
              )}
              {videoAnalysis.coaching_tips?.length > 0 && (
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-gray-500 text-xs mb-3">Coaching Tips</p>
                  <div className="flex flex-col gap-3">
                    {videoAnalysis.coaching_tips.map((tip, i) => (
                      <div key={i} className={`border rounded-xl p-4 ${priorityColor[tip.priority]}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold uppercase tracking-wider ${priorityColor[tip.priority].split(' ')[0]}`}>
                            {tip.priority}
                          </span>
                          <span className="text-white text-sm font-semibold">{tip.title}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-2">{tip.description}</p>
                        <p className="text-gray-500 text-xs"><span className="text-gray-400 font-medium">Drill: </span>{tip.drill}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice Analysis */}
          {voice.tone && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6">
              <h2 className="text-white text-xl font-semibold mb-4">🎙️ Voice Analysis</h2>

              {/* Color coded — breakdown scores with details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Pacing',     key: 'pacing' },
                  { label: 'Clarity',    key: 'clarity' },
                  { label: 'Confidence', key: 'confidence' },
                  { label: 'Structure',  key: 'structure' },
                  { label: 'Emotion',    key: 'emotion' },
                  { label: 'Dynamics',   key: 'dynamics' },
                ].map(({ label, key }) => {
                  const cat = getCategory(s(key))
                  return (
                    <div key={key}>
                      <p className="text-gray-500 text-xs mb-1">{label}</p>
                      <p className={`text-sm font-medium ${cat.color}`}>{cat.label}</p>
                      {d(key) && <p className="text-gray-400 text-xs mt-0.5">{d(key)}</p>}
                    </div>
                  )
                })}
              </div>

              {/* White descriptive section */}
              <div className="pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <DescField label="Tone"           value={voice.tone?.value}           detail={voice.tone?.detail} />
                  <DescField label="Energy"         value={voice.energy?.value}         detail={voice.energy?.detail} />
                  <DescField label="Expressiveness" value={voice.expressiveness?.value} detail={voice.expressiveness?.detail} />
                  <DescField label="Emotion" value={`${emotion.primary}${emotion.secondary ? ` · ${emotion.secondary}` : ''}`} detail={emotion.emotion_detail} />
                  <DescField label="Emotional Range" value={emotion.emotional_range} detail={emotion.emotional_range_detail} />
                  <DescField label="Pauses" value={`${pauses.usage} (${pauses.count} notable)`} detail={pauses.effectiveness} />
                </div>
              </div>

              {/* Observations */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs mb-2">Observations</p>
                <p className="text-gray-300 leading-relaxed">{voice.observations}</p>
              </div>
            </div>
          )}

          {/* Filler words */}
          {Object.keys(analysis.filler_words || {}).length > 0 && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6">
              <h2 className="text-white text-xl font-semibold mb-4">🚫 Filler Words</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(analysis.filler_words).map(([word, count]) => (
                  <div key={word} className="bg-gray-900 rounded-lg px-4 py-2 text-center">
                    <span className="text-white font-semibold">"{word}"</span>
                    <span className="text-gray-400 text-sm ml-2">{count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & improvements */}
          {feedback && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-700 rounded-xl p-4">
                <h3 className="text-green-400 font-semibold mb-3">✅ Strengths</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  {feedback.strengths?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
              <div className="border border-gray-700 rounded-xl p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">⚡ Improve</h3>
                <ul className="text-gray-300 text-sm space-y-2">
                  {feedback.improvements?.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Coach summary */}
          {feedback?.summary && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6">
              <h2 className="text-white text-xl font-semibold mb-3">Coach Summary</h2>
              <p className="text-gray-300 leading-relaxed">{feedback.summary}</p>
            </div>
          )}

          {/* Transcript */}
          <div className="border border-gray-700 rounded-xl p-6 mb-8">
            <h2 className="text-white text-xl font-semibold mb-3">Transcript</h2>
            <p className="text-gray-300 leading-relaxed">
              {analysis.transcript || 'No speech detected.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/start')}
            className="w-full bg-white text-black font-semibold py-4 rounded-full hover:bg-gray-200 transition-all"
          >
            Practice Again
          </button>

        </div>
      </div>
    </div>
  )
}