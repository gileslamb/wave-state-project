import { useState, Suspense } from 'react'
import { AudioProvider } from './contexts/AudioContext'
import Scene from './components/Scene'
import AudioController from './components/AudioController'
import AudioControls from './components/AudioControls'
import './index.css'

function App() {
  const [started, setStarted] = useState(false)

  return (
    <AudioProvider>
      {started ? (
        <Suspense fallback={null}>
          <Scene />
          <div className="wave-state-ui">
            <AudioControls />
            <span className="brand">Wave State</span>
          </div>
        </Suspense>
      ) : (
        <>
          <div className="wave-state-ui start-screen">
            <AudioController onStart={() => setStarted(true)} />
          </div>
        </>
      )}
    </AudioProvider>
  )
}

export default App
