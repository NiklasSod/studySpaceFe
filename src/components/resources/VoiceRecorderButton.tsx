import { useEffect, useRef, useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'
import { MicFill, StopFill } from 'react-bootstrap-icons'
import { uploadResourceAudio } from '../../api/resource'

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}

interface VoiceRecorderButtonProps {
  onUploaded: (url: string) => void
  disabled?: boolean
}

/**
 * Records a short voice note with MediaRecorder and uploads it to the backend
 * (`POST /api/resources/audio`). On success it calls `onUploaded` with the URL.
 */
function VoiceRecorderButton({
  onUploaded,
  disabled,
}: VoiceRecorderButtonProps) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startRecording = async () => {
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        void handleStop(recorder)
      }

      mediaRecorderRef.current = recorder
      recorder.start()

      setRecording(true)
      setSeconds(0)
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } catch {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  const handleStop = async (recorder: MediaRecorder) => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
    stopStream()
    mediaRecorderRef.current = null

    if (chunksRef.current.length === 0) return

    const mimeType = recorder.mimeType || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    chunksRef.current = []

    const fileName = `voice-note-${Date.now()}.${extensionForMime(mimeType)}`

    try {
      setUploading(true)
      const url = await uploadResourceAudio(blob, fileName)
      onUploaded(url)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not upload voice note.',
      )
    } finally {
      setUploading(false)
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }

  if (recording) {
    return (
      <Button
        variant="danger"
        size="sm"
        onClick={stopRecording}
        className="d-inline-flex align-items-center gap-1"
      >
        <StopFill /> Stop ({seconds}s)
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={startRecording}
        disabled={disabled || uploading}
        className="d-inline-flex align-items-center gap-1"
        title="Record a voice note"
      >
        {uploading ? <Spinner animation="border" size="sm" /> : <MicFill />}
        {uploading ? 'Uploading…' : 'Record voice note'}
      </Button>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </>
  )
}

export default VoiceRecorderButton
