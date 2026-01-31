import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const WAVE_VERTEX = `
  uniform float uTime;
  uniform float uWaveScale;
  uniform float uWaveHeight;
  uniform float uFrequency;
  uniform float uSpeed;
  varying float vElevation;
  varying vec2 vUv;

  // Multi-layered sine waves for organic, meditative motion
  float wave(vec2 pos) {
    float w = 0.0;
    w += sin(pos.x * uFrequency + uTime * uSpeed * 0.8) * 0.4;
    w += sin(pos.y * uFrequency * 1.2 - uTime * uSpeed * 0.6) * 0.4;
    w += sin((pos.x + pos.y) * uFrequency * 0.9 + uTime * uSpeed * 1.0) * 0.35;
    w += sin(length(pos) * uFrequency * 0.6 - uTime * uSpeed * 0.5) * 0.25;
    w += sin(pos.x * uFrequency * 2.0 + pos.y * 0.5 + uTime * uSpeed * 0.7) * 0.15;
    return w * uWaveHeight;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float elev = wave(pos.xy * uWaveScale);
    pos.z += elev;
    vElevation = elev;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const WAVE_FRAGMENT = `
  uniform vec3 uDeepColor;
  uniform vec3 uCrestColor;
  uniform vec3 uGlowColor;
  uniform float uEmissiveStrength;
  uniform float uPulse;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    float n = smoothstep(-0.3, 0.8, (vElevation + 1.0) * 0.5);
    vec3 baseColor = mix(uDeepColor, uCrestColor, n);

    // Emissive glow on crests - bioluminescence
    float crestGlow = pow(max(0.0, n), 2.0) * uEmissiveStrength;
    crestGlow *= 0.8 + 0.2 * uPulse;
    vec3 emissive = uGlowColor * crestGlow;
    vec3 color = baseColor + emissive;

    // Radial edge glow for depth and immersion
    float distFromCenter = length(vUv - 0.5) * 2.0;
    float edgeGlow = smoothstep(0.6, 1.2, distFromCenter) * 0.25;
    color += uGlowColor * edgeGlow;

    gl_FragColor = vec4(color, 0.95);
  }
`

const DEFAULTS = {
  waveScale: 1.0,
  waveHeight: 1.2,
  frequency: 1.4,
  speed: 1.0,
  deepColor: new THREE.Color('#050a18'),
  crestColor: new THREE.Color('#0d5c63'),
  glowColor: new THREE.Color('#00e5ff'),
  emissiveStrength: 1.5,
}

export default function WaveVisual({
  waveScale = DEFAULTS.waveScale,
  waveHeight = DEFAULTS.waveHeight,
  frequency = DEFAULTS.frequency,
  speed = DEFAULTS.speed,
  deepColor = DEFAULTS.deepColor,
  crestColor = DEFAULTS.crestColor,
  glowColor = DEFAULTS.glowColor,
  emissiveStrength = DEFAULTS.emissiveStrength,
  audioLevel = 0,
  segments = 80,
  size = 20,
}) {
  const meshRef = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWaveScale: { value: waveScale },
      uWaveHeight: { value: waveHeight },
      uFrequency: { value: frequency },
      uSpeed: { value: speed },
      uDeepColor: { value: deepColor instanceof THREE.Color ? deepColor : new THREE.Color(deepColor) },
      uCrestColor: { value: crestColor instanceof THREE.Color ? crestColor : new THREE.Color(crestColor) },
      uGlowColor: { value: glowColor instanceof THREE.Color ? glowColor : new THREE.Color(glowColor) },
      uEmissiveStrength: { value: emissiveStrength },
      uPulse: { value: 1 },
    }),
    [waveScale, waveHeight, frequency, speed, deepColor, crestColor, glowColor, emissiveStrength]
  )

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const u = meshRef.current.material.uniforms
    u.uTime.value += delta
    u.uWaveHeight.value = waveHeight + audioLevel * 0.5
    u.uWaveScale.value = waveScale
    u.uFrequency.value = frequency
    u.uSpeed.value = speed
    u.uPulse.value = 0.85 + 0.15 * Math.sin(state.clock.elapsedTime * 0.5)
  })

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, segments, segments)
    g.rotateX(-Math.PI / 2)
    return g
  }, [size, segments])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]} receiveShadow>
      <shaderMaterial
        vertexShader={WAVE_VERTEX}
        fragmentShader={WAVE_FRAGMENT}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite
        depthTest
      />
    </mesh>
  )
}
