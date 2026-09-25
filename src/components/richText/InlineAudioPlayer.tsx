import { useEffect, useRef, useState } from 'react'
import { PauseFill, PlayFill } from 'react-bootstrap-icons'

interface InlineAudioPlayerProps {
  src: string
}

/**
 * Compact 1rem × 1rem play/pause toggle for an inline voice note.
 */
export default function InlineAudioPlayer({ src }: InlineAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  return (
    <span className="rich-text-audio">
      <audio ref={audioRef} src={src} preload="none" />
      <button
        type="button"
        className="rich-text-audio-btn"
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        title={playing ? 'Pause voice note' : 'Play voice note'}
      >
        {playing ? <PauseFill /> : <PlayFill />}
      </button>
    </span>
  )
}
