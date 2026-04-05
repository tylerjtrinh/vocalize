import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const start = useCallback(async () => {
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

    mediaRecorder.start(100)
    setRecording(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    return { stream, mimeType }
  }, [])

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current
      if (!mediaRecorder) return resolve(null)

      mediaRecorder.onstop = () => {
        const durationSeconds = (Date.now() - startTimeRef.current) / 1000
        const mimeType = mediaRecorder.mimeType
        const blob = new Blob(chunksRef.current, { type: mimeType })
        resolve({ blob, durationSeconds })
      }

      mediaRecorder.stream.getTracks().forEach(t => t.stop())
      mediaRecorder.stop()
      clearInterval(timerRef.current)
      setRecording(false)
    })
  }, [])

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return { recording, elapsed, start, stop, formatTime }
}