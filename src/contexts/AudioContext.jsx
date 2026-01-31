import { createContext, useContext, useRef, useState, useCallback } from 'react'

const AudioContext = createContext(null)

export const TRACKS = [
  { path: '/Test%20Music%20/Human%20Being%20v1.wav', name: 'Human Being v1' },
  { path: '/Test%20Music%20/falling.wav', name: 'falling' },
]

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}

export function AudioProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const playerRef = useRef(null)
  const analyserRef = useRef(null)
  const frequencyDataRef = useRef(new Uint8Array(128))
  const playRef = useRef(null)

  const loadTrack = useCallback(async (index) => {
    const clamped = Math.max(0, Math.min(index, TRACKS.length - 1))
    setCurrentTrackIndex(clamped)
    const track = TRACKS[clamped]
    setError(null)
    setLoading(true)
    try {
      const { start, ToneAudioBuffer, Player, Analyser } = await import('tone')
      await start()

      const buffer = await ToneAudioBuffer.fromUrl(track.path)

      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current.dispose()
        playerRef.current = null
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current.dispose()
        analyserRef.current = null
      }

      const player = new Player(buffer).toDestination()
      const analyser = new Analyser('fft', 256)
      player.connect(analyser)

      player.onended = () => {
        setIsPlaying(false)
        if (clamped < TRACKS.length - 1) {
          loadTrack(clamped + 1).then((ok) => ok && playRef.current?.())
        }
      }

      playerRef.current = player
      analyserRef.current = analyser
      frequencyDataRef.current = new Uint8Array(analyser.size)
      setIsReady(true)
      setLoading(false)
      return true
    } catch (err) {
      setError(err?.message ?? 'Failed to load audio')
      setIsReady(false)
      setLoading(false)
      return false
    }
  }, [])

  const loadDefaultTrack = useCallback(async () => {
    return loadTrack(0)
  }, [loadTrack])

  const loadFile = useCallback(async (file) => {
    setError(null)
    try {
      const { start, ToneAudioBuffer, Player, Analyser } = await import('tone')
      await start()

      const arrayBuffer = await file.arrayBuffer()
      const buffer = await ToneAudioBuffer.fromArrayBuffer(arrayBuffer)

      if (playerRef.current) {
        playerRef.current.disconnect()
        playerRef.current.dispose()
        playerRef.current.onended = null
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
        analyserRef.current.dispose()
      }

      const player = new Player(buffer).toDestination()
      const analyser = new Analyser('fft', 256)
      player.connect(analyser)

      playerRef.current = player
      analyserRef.current = analyser
      frequencyDataRef.current = new Uint8Array(analyser.size)
      setIsReady(true)
      setCurrentTrackIndex(-1)
    } catch (err) {
      setError(err?.message ?? 'Failed to load audio')
      setIsReady(false)
    }
  }, [])

  const play = useCallback(async () => {
    if (!playerRef.current) return
    try {
      const { start } = await import('tone')
      await start()
      playerRef.current.start(0)
      setIsPlaying(true)
    } catch (err) {
      setError(err?.message ?? 'Failed to play')
    }
  }, [])

  playRef.current = play

  const pause = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop()
      setIsPlaying(false)
    }
  }, [])

  const nextTrack = useCallback(() => {
    const next = (currentTrackIndex + 1) % TRACKS.length
    loadTrack(next).then((ok) => ok && play())
  }, [currentTrackIndex, loadTrack, play])

  const prevTrack = useCallback(() => {
    const prev = currentTrackIndex <= 0 ? TRACKS.length - 1 : currentTrackIndex - 1
    loadTrack(prev).then((ok) => ok && play())
  }, [currentTrackIndex, loadTrack, play])

  const currentTrackName =
    currentTrackIndex >= 0 && currentTrackIndex < TRACKS.length
      ? TRACKS[currentTrackIndex].name
      : 'Custom'

  const getFrequencyData = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return frequencyDataRef.current
    const data = analyser.getValue()
    if (!(data instanceof Float32Array)) return frequencyDataRef.current
    for (let i = 0; i < Math.min(data.length, 128); i++) {
      const dB = data[i]
      const normalized = Math.max(0, Math.min(1, (dB + 100) / 100))
      frequencyDataRef.current[i] = Math.floor(normalized * 255)
    }
    return frequencyDataRef.current
  }, [])

  const getFFT = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return null
    const data = analyser.getValue()
    if (!(data instanceof Float32Array)) return null
    const bufferLength = data.length
    const dataArray = new Uint8Array(bufferLength)
    for (let i = 0; i < bufferLength; i++) {
      const dB = data[i]
      const normalized = Math.max(0, Math.min(1, (dB + 100) / 100))
      dataArray[i] = Math.floor(normalized * 255)
    }
    return dataArray
  }, [])

  const getLevel = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return 0
    const data = analyser.getValue()
    if (!(data instanceof Float32Array)) return 0
    let sum = 0
    for (let i = 0; i < data.length; i++) {
      const dB = data[i]
      sum += Math.max(0, (dB + 100) / 100)
    }
    return sum / data.length
  }, [])

  const value = {
    isReady,
    isPlaying,
    error,
    loading,
    currentTrackIndex,
    currentTrackName,
    loadFile,
    loadDefaultTrack,
    loadTrack,
    play,
    pause,
    nextTrack,
    prevTrack,
    getFrequencyData,
    getFFT,
    getLevel,
  }

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  )
}
