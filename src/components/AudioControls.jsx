import { useAudio } from '../contexts/AudioContext'

export default function AudioControls() {
  const {
    isPlaying,
    play,
    pause,
    prevTrack,
    nextTrack,
    currentTrackName,
    isReady,
  } = useAudio()

  if (!isReady) return null

  return (
    <div className="audio-controls" style={{ pointerEvents: 'auto' }}>
      <div className="audio-controls-row">
        <button
          type="button"
          onClick={prevTrack}
          aria-label="Previous track"
          className="audio-btn-icon"
        >
          ⏮
        </button>
        <button
          type="button"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="audio-btn-icon"
        >
          ⏯
        </button>
        <button
          type="button"
          onClick={nextTrack}
          aria-label="Next track"
          className="audio-btn-icon"
        >
          ⏭
        </button>
      </div>
      <div className="audio-track-name">{currentTrackName}</div>
    </div>
  )
}
