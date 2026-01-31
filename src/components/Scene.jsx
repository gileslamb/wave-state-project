import { useCallback, useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { useAudio } from '../contexts/AudioContext'
import { checkWebGLAvailability } from '../utils/webgl'
import WebGLErrorBoundary from './WebGLErrorBoundary'
import WebGLFallback from './WebGLFallback'
import CosmologyScene from './CosmologyScene'

const sceneConfig = {
  camera: { position: [0, 0, 55], fov: 50, near: 0.1, far: 2000 },
  gl: {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false,
  },
  dpr: [1, 2],
  frameloop: 'always',
  flat: false,
  linear: false,
}

export default function Scene() {
  const [contextLost, setContextLost] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const { getFFT, getLevel } = useAudio()

  useEffect(() => {
    console.log('[Scene] Component mounted')
    return () => console.log('[Scene] Component unmounting')
  }, [])

  const webglCheck = useMemo(() => {
    const result = checkWebGLAvailability()
    if (result.available) {
      console.log('[WebGL] Pre-check passed:', result.details)
    } else {
      console.error('[WebGL] Pre-check failed:', result.error, result.details)
    }
    return result
  }, [retryKey])

  const handleCreated = useCallback(({ gl }) => {
    console.log('[WebGL] Canvas created successfully')
    gl.setClearColor(0x000000)
    const canvas = gl.domElement

    const onContextLost = (e) => {
      console.group('[WebGL] Context lost')
      console.error('Event:', e)
      console.error('reasonMessage:', e.reasonMessage ?? '(not set)')
      console.error('returnValue:', e.returnValue)
      console.groupEnd()
      e.preventDefault()
      setContextLost(true)
    }
    const onContextRestored = () => {
      console.log('[WebGL] Context restored')
      setContextLost(false)
    }

    canvas.addEventListener('webglcontextlost', onContextLost, false)
    canvas.addEventListener('webglcontextrestored', onContextRestored, false)

    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setContextLost(false)
    setRetryKey((k) => k + 1)
  }, [])

  if (!webglCheck.available) {
    return (
      <WebGLFallback
        onRetry={handleRetry}
        error={webglCheck.error}
        details={webglCheck.details}
      />
    )
  }

  if (contextLost) {
    return <WebGLFallback onRetry={handleRetry} />
  }

  return (
    <WebGLErrorBoundary
      key={retryKey}
      fallback={<WebGLFallback onRetry={handleRetry} />}
    >
      <Canvas
        key={retryKey}
        camera={sceneConfig.camera}
        gl={sceneConfig.gl}
        dpr={sceneConfig.dpr}
        frameloop={sceneConfig.frameloop}
        flat={sceneConfig.flat}
        linear={sceneConfig.linear}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onCreated={handleCreated}
      >
        <color attach="background" args={['#000000']} />

        <CosmologyScene getFFT={getFFT} getLevel={getLevel} />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
      </Canvas>
    </WebGLErrorBoundary>
  )
}
