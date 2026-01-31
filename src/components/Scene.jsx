import { useCallback, useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, AdaptiveDpr, AdaptiveEvents, Sparkles } from '@react-three/drei'
import { checkWebGLAvailability } from '../utils/webgl'
import WebGLErrorBoundary from './WebGLErrorBoundary'
import WebGLFallback from './WebGLFallback'
import WaveVisual from './WaveVisual'

const sceneConfig = {
  camera: { position: [0, 2, 8], fov: 50, near: 0.1, far: 1000 },
  gl: {
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
    depth: true,
    failIfMajorPerformanceCaveat: false, // allow software renderer fallback
  },
  dpr: [1, 2],
  frameloop: 'always',
  flat: false,
  linear: false,
  xr: undefined, // WebXR session — set when @react-three/xr is added
}

export default function Scene() {
  const [contextLost, setContextLost] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

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
    gl.setClearColor('#030712')
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
    // Note: R3F handles renderer disposal on Canvas unmount via unmountComponentAtNode
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
      <color attach="background" args={['#030712']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-8, 6, 4]} intensity={0.6} color="#00d4ff" distance={30} decay={2} />
      <pointLight position={[8, 4, -4]} intensity={0.4} color="#7b2cbf" distance={25} decay={2} />
      <pointLight position={[0, 2, 8]} intensity={0.5} color="#06b6d4" distance={20} decay={2} />
      <pointLight position={[0, -1, 2]} intensity={0.25} color="#0d9488" />

      <WaveVisual />

      <Sparkles
        count={80}
        scale={18}
        size={2}
        speed={0.4}
        color="#00e5ff"
        opacity={0.6}
        noise={[0.5, 0.5, 0.5]}
        position={[0, 0.5, 0]}
      />

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.45}
        minDistance={4}
        maxDistance={20}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.4}
      />

      <Environment preset="night" environmentIntensity={0.35} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
    </WebGLErrorBoundary>
  )
}
