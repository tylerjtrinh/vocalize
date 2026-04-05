import { useState, useRef, useCallback } from 'react'

export function useRecorder() {
  const [state, setState] = useState('idle') // idle | requesting | recording | paused | stopped
  const [duration, setDuration] = useState(0)
  const [blob, setBlob] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const durationRef = useRef(0)

  const start = useCallback(async () => {
    try {
      setState('requesting')
      setError(null)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })

      setStream(mediaStream)

      const mimeType = MediaRecorder.isTypeSupported('video/mp4')
        ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm'

      const recorder = new MediaRecorder(mediaStream, { mimeType })
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(recordedBlob)
        setBlob(recordedBlob)
        setPreviewUrl(url)
        mediaStream.getTracks().forEach(t => t.stop())
        setStream(null)
      }

      recorder.start(250)
      setState('recording')

      durationRef.current = 0
      setDuration(0)
      timerRef.current = setInterval(() => {
        durationRef.current += 1
        setDuration(durationRef.current)
      }, 1000)

    } catch (err) {
      setError(err.message || 'Could not access camera/microphone')
      setState('idle')
    }
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setState('stopped')
  }, [])

  const pause = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause()
      if (timerRef.current) clearInterval(timerRef.current)
      setState('paused')
    }
  }, [])

  const resume = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume()
      timerRef.current = setInterval(() => {
        durationRef.current += 1
        setDuration(durationRef.current)
      }, 1000)
      setState('recording')
    }
  }, [])

  const reset = useCallback(() => {
    if (recorderRef.current?.state !== 'inactive') {
      recorderRef.current?.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    stream?.getTracks().forEach(t => t.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setStream(null)
    setBlob(null)
    setPreviewUrl(null)
    setDuration(0)
    setState('idle')
    setError(null)
    chunksRef.current = []
    durationRef.current = 0
  }, [stream, previewUrl])

  return { state, duration, blob, previewUrl, stream, start, stop, pause, resume, reset, error }
}