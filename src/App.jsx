import { useState, Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import AudioController from './components/AudioController'
import './index.css'

function App() {
  const [started, setStarted] = useState(false)

  console.log('[App] Render', { started })

  useEffect(() => {
    console.log('[App] started state changed:', started)
  }, [started])

  const handleStart = () => {
    console.log('[App] handleStart called, setting started=true')
    setStarted(true)
  }

  return (
    <>
      {started ? (
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      ) : (
        <AudioController onStart={handleStart} />
      )}
      <div className="wave-state-ui" aria-hidden>
        <span className="brand">Wave State</span>
        <div className="controls">
          {/* VR button — enable when @react-three/xr is added */}
          <button type="button" disabled aria-label="VR (coming soon)">
            VR
          </button>
        </div>
      </div>
    </>
  )
}

export default App
