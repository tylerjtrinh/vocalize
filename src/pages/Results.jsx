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

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const analysis = state?.analysis
  const feedback = state?.feedback

  const [audioLoading, setAudioLoading] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioEl, setAudioEl] = useState(null)

  //For coach audio feedback
  const [showTranscript, setShowTranscript] = useState(false)

  if (!analysis) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <p className="text-white">No results found.</p>
    </div>
  )

  const voice = analysis.voice_analysis || {}
  const emotion = voice.emotion || {}
  const dynamics = voice.dynamics || {}
  const pauses = voice.pauses || {}
  const overallCategory = feedback ? getCategory(feedback.overall_score) : null

  const handlePlayFeedback = async () => {
    if (!feedback?.spoken_feedback) return

    // If already playing, stop it
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

              {/* Dropdown transcript */}
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

          {/* Score breakdown */}
          {feedback && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6 flex flex-col gap-4">
              <h2 className="text-white text-xl font-semibold mb-2">Breakdown</h2>
              <ScoreBar label="Pacing"     score={feedback.scores?.pacing} />
              <ScoreBar label="Clarity"    score={feedback.scores?.clarity} />
              <ScoreBar label="Confidence" score={feedback.scores?.confidence} />
              <ScoreBar label="Structure"  score={feedback.scores?.structure} />
              <ScoreBar label="Emotion"    score={feedback.scores?.emotion} />
              <ScoreBar label="Dynamics"   score={feedback.scores?.dynamics} />
            </div>
          )}

          {/* Voice Analysis */}
          {voice.tone && (
            <div className="border border-gray-700 rounded-xl p-6 mb-6">
              <h2 className="text-white text-xl font-semibold mb-4">🎙️ Voice Analysis</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-xs mb-1">Tone</p>
                  <p className="text-white capitalize">{voice.tone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Energy</p>
                  <p className="text-white capitalize">{voice.energy}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Clarity</p>
                  <p className="text-white capitalize">{voice.clarity}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Pace</p>
                  <p className="text-white capitalize">{voice.pace_description}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Primary Emotion</p>
                  <p className="text-white capitalize">{emotion.primary}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Secondary Emotion</p>
                  <p className="text-white capitalize">{emotion.secondary}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Emotional Range</p>
                  <p className="text-white capitalize">{emotion.emotional_range}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Authenticity</p>
                  <p className="text-white capitalize">{emotion.authenticity}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Pitch Variation</p>
                  <p className="text-white capitalize">{dynamics.pitch_variation}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Volume Variation</p>
                  <p className="text-white capitalize">{dynamics.volume_variation}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Expressiveness</p>
                  <p className="text-white capitalize">{dynamics.expressiveness}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">Pauses</p>
                  <p className="text-white capitalize">{pauses.usage} ({pauses.count} notable)</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-700">
                <p className="text-gray-500 text-xs mb-2">Observations</p>
                <p className="text-gray-300 leading-relaxed">{voice.observations}</p>
              </div>
              {pauses.effectiveness && (
                <div className="pt-3">
                  <p className="text-gray-500 text-xs mb-2">Pause Effectiveness</p>
                  <p className="text-gray-300 leading-relaxed">{pauses.effectiveness}</p>
                </div>
              )}
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