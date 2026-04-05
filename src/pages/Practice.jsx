import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Practice() {
  const { state } = useLocation()
  const navigate = useNavigate()
  
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [videoMode, setVideoMode] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)

  const startRecording = async () => {
    // Start live transcription via Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (e) => {
        let text = ''
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript
        }
        setLiveText(text)
      }
      recognition.start()
      recognitionRef.current = recognition
    }

    // Start audio recording for Gemini
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const mediaRecorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []
    startTimeRef.current = Date.now()

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setLoading(true)

      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      // Step 1: Gemini transcription + voice analysis
      const res = await fetch('/api/analyze/', { method: 'POST', body: formData })
      const analysis = await res.json()

      const wpm = Math.round(analysis.word_count / (durationSeconds / 60))

      // Step 2: Gemini coaching feedback
      const coachRes = await fetch('/api/coach/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: analysis.transcript,
          wpm,
          filler_words: analysis.filler_words,
          word_count: analysis.word_count,
          duration_seconds: durationSeconds,
          voice_analysis: analysis.voice_analysis,
        })
      })
      const feedback = await coachRes.json()

      setLoading(false)
      navigate('/results', {
        state: {
          analysis: { ...analysis, wpm, duration_seconds: durationSeconds },
          feedback
        }
      })
    }

    mediaRecorder.start(100)
    setRecording(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-8 pt-14 min-h-screen">
        <h1 className="text-white text-3xl font-bold mb-8">🎙️ Free Speak</h1>

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Analyzing your speech...</p>
            <p className="text-gray-600 text-sm">This can take 20-30 seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
            {recording && (
              <div className="text-red-400 font-mono text-2xl animate-pulse">
                ● {formatTime(elapsed)}
              </div>
            )}

            {/* Audio / Video toggle */}
            {!recording && (
              <div className="flex items-center bg-gray-900 rounded-full p-1">
                <button
                  onClick={() => setVideoMode(false)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    !videoMode ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎙️ Audio Only
                </button>
                <button
                  onClick={() => setVideoMode(true)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    videoMode ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎥 Audio + Video
                </button>
              </div>
            )}

            <button
              onClick={recording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full text-5xl transition-all ${
                recording ? 'bg-red-600 hover:bg-red-700' : 'bg-white hover:bg-gray-200'
              }`}
            >
              {recording ? '⏹' : '🎙️'}
            </button>

            <p className="text-gray-500">
              {recording ? 'Click to stop' : 'Click to start recording'}
            </p>

            {(recording || liveText) && (
              <div className="w-full border border-gray-700 rounded-xl p-6 mt-4 min-h-32">
                <p className="text-gray-500 text-xs mb-2">Live transcript</p>
                <p className="text-white leading-relaxed">
                  {liveText || <span className="text-gray-600 italic">Listening...</span>}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

