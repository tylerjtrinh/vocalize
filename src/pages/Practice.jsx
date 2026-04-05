import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useRecorder } from '../hooks/useRecorder'

export default function Practice() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [videoMode, setVideoMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [showConsent, setShowConsent] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)

  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const liveVideoRef = useRef(null)

  // Hooks
  const { recording, elapsed, start: startAudio, stop: stopAudio, formatTime } = useAudioRecorder()
  const { state: recorderState, duration, blob: videoBlob, stream, start: startVideo, stop: stopVideo, error: recorderError } = useRecorder()

  const isVideoRecording = recorderState === 'recording' || recorderState === 'paused'

  // Attach live camera stream to video element
  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream
    }
  }, [stream])

  // When video blob is ready, process it
  useEffect(() => {
    if (recorderState === 'stopped' && videoBlob && loading) {
      processVideoRecording(videoBlob)
    }
  }, [recorderState, videoBlob])

  const startLiveTranscription = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
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

  // ── Audio Only ──
  const handleStartAudio = async () => {
    setLiveText('')
    startLiveTranscription()
    await startAudio()
  }

  const handleStopAudio = async () => {
    recognitionRef.current?.stop()
    const result = await stopAudio()
    if (!result) return

    const { blob, durationSeconds } = result
    setLoading(true)

    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    const res = await fetch('/api/analyze/', { method: 'POST', body: formData })
    const analysis = await res.json()
    const wpm = Math.round(analysis.word_count / (durationSeconds / 60))

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
        feedback,
        mode: 'audio'
      }
    })
  }

  // ── Video Mode ──
  const handleVideoModeToggle = (isVideo) => {
    if (isVideo && !consentGiven) {
      setShowConsent(true)
    } else {
      setVideoMode(isVideo)
    }
  }

  const handleConsentAccept = () => {
    setConsentGiven(true)
    setShowConsent(false)
    setVideoMode(true)
  }

  const handleStartVideo = async () => {
    setLiveText('')
    startLiveTranscription()
    startTimeRef.current = Date.now()
    await startVideo()
  }

  const handleStopVideo = () => {
    recognitionRef.current?.stop()
    stopVideo()
    setLoading(true)
  }

  const processVideoRecording = async (blob) => {
    try {
      const durationSeconds = (Date.now() - startTimeRef.current) / 1000

      const audioFormData = new FormData()
      audioFormData.append('audio', blob, 'recording.webm')

      const videoFormData = new FormData()
      videoFormData.append('video', blob, 'recording.webm')

      const [analysisRes, videoRes] = await Promise.all([
        fetch('/api/analyze/', { method: 'POST', body: audioFormData }),
        fetch('/api/video/', { method: 'POST', body: videoFormData }),
      ])

      const analysis = await analysisRes.json()
      const videoAnalysis = await videoRes.json()
      const wpm = Math.round(analysis.word_count / (durationSeconds / 60))

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
          video_analysis: videoAnalysis,
        })
      })
      const feedback = await coachRes.json()

      setLoading(false)
      navigate('/results', {
        state: {
          analysis: { ...analysis, wpm, duration_seconds: durationSeconds },
          videoAnalysis,
          feedback,
          mode: 'video'
        }
      })
    } catch (e) {
      setLoading(false)
      console.error(e)
    }
  }

  return (
    <div className="bg-black min-h-screen">
      <Navbar />

      {/* Consent modal */}
      {showConsent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">📹 Video Privacy Notice</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Your video is temporarily uploaded to <strong className="text-white">Twelve Labs</strong> for visual analysis
              (eye contact, body language, facial expressions). It is <strong className="text-white">permanently deleted
              immediately after analysis</strong> and is never stored or viewed by us.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConsentAccept}
                className="flex-1 bg-white text-black font-semibold py-3 rounded-xl text-sm"
              >
                I Understand, Continue
              </button>
              <button
                onClick={() => setShowConsent(false)}
                className="flex-1 border border-gray-700 text-gray-400 font-semibold py-3 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center px-8 pt-14 min-h-screen">
        <h1 className="text-white text-3xl font-bold mb-8">🎙️ Free Speak</h1>

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Analyzing your speech...</p>
            <p className="text-gray-600 text-sm">This can take 20-40 seconds</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-2xl">

            {/* Toggle */}
            {!recording && !isVideoRecording && (
              <div className="flex items-center bg-gray-900 rounded-full p-1">
                <button
                  onClick={() => handleVideoModeToggle(false)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    !videoMode ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎙️ Audio Only
                </button>
                <button
                  onClick={() => handleVideoModeToggle(true)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    videoMode ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🎥 Audio + Video
                </button>
              </div>
            )}

            {/* Video preview */}
            {videoMode && (
              <div className="w-full relative rounded-2xl overflow-hidden bg-gray-900 aspect-video border border-gray-700">
                {(isVideoRecording || recorderState === 'requesting') ? (
                  <video
                    ref={liveVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-gray-600 text-sm">Camera preview will appear here</p>
                  </div>
                )}
                {recorderState === 'recording' && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-mono">{formatTime(duration)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Audio timer */}
            {recording && (
              <div className="text-red-400 font-mono text-2xl animate-pulse">
                ● {formatTime(elapsed)}
              </div>
            )}

            {/* Record button */}
            {!videoMode ? (
              <button
                onClick={recording ? handleStopAudio : handleStartAudio}
                className={`w-32 h-32 rounded-full text-5xl transition-all ${
                  recording ? 'bg-red-600 hover:bg-red-700' : 'bg-white hover:bg-gray-200'
                }`}
              >
                {recording ? '⏹' : '🎙️'}
              </button>
            ) : (
              <button
                onClick={isVideoRecording ? handleStopVideo : handleStartVideo}
                disabled={recorderState === 'requesting'}
                className={`w-32 h-32 rounded-full text-5xl transition-all disabled:opacity-50 ${
                  isVideoRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-white hover:bg-gray-200'
                }`}
              >
                {recorderState === 'requesting' ? '⏳' : isVideoRecording ? '⏹' : '🎥'}
              </button>
            )}

            <p className="text-gray-500 text-sm">
              {recording || isVideoRecording ? 'Click to stop' : 'Click to start recording'}
            </p>

            {recorderError && (
              <p className="text-red-400 text-sm">{recorderError}</p>
            )}

            {/* Live transcript */}
            {(recording || isVideoRecording || liveText) && (
              <div className="w-full border border-gray-700 rounded-xl p-6 min-h-32">
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