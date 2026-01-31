import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'

// ——— Audio context ———
const AudioContext = createContext(null)

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within AudioProvider')
  return ctx
}

// ——— Analyzer for visual reactivity ———
const ANALYZER_FFT = 256
const ANALYZER_SMOOTHING = 0.8

export function AudioProvider({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const analyzerRef = useRef(null)
  const meterRef = useRef(null)
  const levelRef = useRef(0)

  const getLevel = useCallback(() => levelRef.current, [])

  useEffect(() => {
    let meter
    let analyzer
    import('tone').then(({ Meter, Analyser }) => {
      meter = new Meter({ normalRange: true })
      analyzer = new Analyser('waveform', ANALYZER_FFT)
      analyzer.smoothing = ANALYZER_SMOOTHING
      meterRef.current = meter
      analyzerRef.current = analyzer
    }).catch((err) => console.error('[AudioProvider] Failed to load Tone:', err))
    return () => {
      if (meter) meter.dispose()
      if (analyzer) analyzer.dispose()
    }
  }, [])

  useEffect(() => {
    if (!meterRef.current) return
    const interval = setInterval(() => {
      if (meterRef.current) {
        const level = meterRef.current.getValue()
        levelRef.current = typeof level === 'number' ? level : 0
      }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const start = useCallback(async () => {
    const { start: startTone } = await import('tone')
    await startTone()
    setIsReady(true)
  }, [])

  const connectSource = useCallback((source) => {
    if (!source || !meterRef.current || !analyzerRef.current) return
    source.connect(meterRef.current)
    source.connect(analyzerRef.current)
  }, [])

  const value = {
    isReady,
    isPlaying,
    setIsPlaying,
    getLevel,
    connectSource,
    start,
    getAnalyzer: () => analyzerRef.current,
    getMeter: () => meterRef.current,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

// ——— UI: start audio on first interaction (browser policy) ———
// Tone is lazy-loaded on click to avoid audio context creation before user gesture
// Tone.js exports { start } as a named export, not a default
export default function AudioController({ onStart }) {
  const handleStart = useCallback(async () => {
    console.log('[AudioController] Button clicked')
    try {
      const { start } = await import('tone')
      if (typeof start !== 'function') {
        throw new Error('Tone.start is not a function')
      }
      await start()
      console.log('[AudioController] Tone started, calling onStart')
      if (onStart) {
        onStart()
      } else {
        console.warn('[AudioController] onStart is not defined')
      }
    } catch (err) {
      console.error('[AudioController] Failed to start audio:', err)
    }
  }, [onStart])

  return (
    <div className="wave-state-ui" style={{ pointerEvents: 'auto' }}>
      <button type="button" onClick={handleStart} aria-label="Start audio">
        Start experience
      </button>
    </div>
  )
}
