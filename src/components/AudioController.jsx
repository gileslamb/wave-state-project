import { useCallback } from 'react'
import { useAudio } from '../contexts/AudioContext'

export default function AudioController({ onStart }) {
  const {
    loadDefaultTrack,
    play,
    pause,
    isPlaying,
    isReady,
    loading,
    error,
  } = useAudio()

  const handleStart = useCallback(async () => {
    try {
      const loaded = await loadDefaultTrack()
      if (loaded) {
        await play()
        onStart?.()
      }
    } catch (err) {
      console.error('[AudioController] Failed to start:', err)
    }
  }, [loadDefaultTrack, play, onStart])

  if (!isReady && !loading) {
    return (
      <div className="wave-state-ui" style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          aria-label="Start experience"
        >
          {loading ? 'Loading...' : 'Start experience'}
        </button>
        {error && <p className="audio-error">{error}</p>}
      </div>
    )
  }

  return null
}
