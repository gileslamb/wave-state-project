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
  varying float vWavePhase;

  // Multi-layered organic waves - flowing, meditative motion
  float wave(vec2 pos) {
    float w = 0.0;
    w += sin(pos.x * uFrequency + uTime * uSpeed * 0.7) * 0.35;
    w += sin(pos.y * uFrequency * 1.15 - uTime * uSpeed * 0.55) * 0.35;
    w += sin((pos.x + pos.y) * uFrequency * 0.85 + uTime * uSpeed * 0.95) * 0.4;
    w += sin(length(pos) * uFrequency * 0.55 - uTime * uSpeed * 0.45) * 0.3;
    w += sin(pos.x * uFrequency * 1.8 + pos.y * 0.6 + uTime * uSpeed * 0.65) * 0.2;
    w += sin((pos.x - pos.y * 0.7) * uFrequency * 1.2 + uTime * uSpeed * 0.8) * 0.25;
    return w * uWaveHeight;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float elev = wave(pos.xy * uWaveScale);
    pos.z += elev;
    vElevation = elev;
    vWavePhase = (elev / uWaveHeight + 1.0) * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const WAVE_FRAGMENT = `
  uniform vec3 uDeepColor;
  uniform vec3 uMidColor;
  uniform vec3 uCrestColor;
  uniform vec3 uGlowColor;
  uniform vec3 uGlowColor2;
  uniform float uEmissiveStrength;
  uniform float uPulse;
  uniform float uColorShift;
  varying float vElevation;
  varying vec2 vUv;
  varying float vWavePhase;

  void main() {
    float n = smoothstep(-0.2, 0.85, vWavePhase);
    float nSharp = pow(n, 1.5);

    // Rich gradient: deep -> mid -> crest with color shift
    vec3 baseColor = mix(uDeepColor, uMidColor, smoothstep(0.0, 0.5, n));
    baseColor = mix(baseColor, uCrestColor, smoothstep(0.3, 0.9, n));

    // Dual-tone emissive glow - bioluminescence from within
    vec3 glow1 = uGlowColor * pow(max(0.0, n), 2.5) * uEmissiveStrength;
    vec3 glow2 = uGlowColor2 * pow(max(0.0, n - 0.3), 1.8) * uEmissiveStrength * 0.6;
    float pulse = 0.88 + 0.12 * uPulse;
    vec3 emissive = (glow1 + glow2) * pulse;

    // Self-illumination - material glows, not just reflects
    vec3 color = baseColor + emissive * 1.2;

    // Soft radial vignette with edge glow
    float distFromCenter = length(vUv - 0.5) * 2.0;
    float edgeGlow = smoothstep(0.5, 1.0, distFromCenter) * 0.2;
    color += mix(uGlowColor, uGlowColor2, 0.5) * edgeGlow;

    // Soft fade at far edges - no harsh cut-off, blends into fog
    float edgeFade = 1.0 - smoothstep(0.85, 1.05, distFromCenter);

    // Subtle shimmer on crests
    float shimmer = sin(vUv.x * 20.0 + vUv.y * 20.0 + uColorShift) * 0.5 + 0.5;
    color += uGlowColor * shimmer * nSharp * 0.08;

    gl_FragColor = vec4(color, 0.97 * edgeFade);
  }
`

const DEFAULTS = {
  waveScale: 0.92,
  waveHeight: 1.8,
  frequency: 1.0,
  speed: 0.9,
  size: 50,
  deepColor: new THREE.Color('#050510'),
  midColor: new THREE.Color('#1a0a2e'),
  crestColor: new THREE.Color('#0d3d56'),
  glowColor: new THREE.Color('#00e5ff'),
  glowColor2: new THREE.Color('#a855f7'),
  emissiveStrength: 2.0,
  segments: 80,
}

export default function WaveVisual({
  waveScale = DEFAULTS.waveScale,
  waveHeight = DEFAULTS.waveHeight,
  frequency = DEFAULTS.frequency,
  speed = DEFAULTS.speed,
  deepColor = DEFAULTS.deepColor,
  midColor = DEFAULTS.midColor,
  crestColor = DEFAULTS.crestColor,
  glowColor = DEFAULTS.glowColor,
  glowColor2 = DEFAULTS.glowColor2,
  emissiveStrength = DEFAULTS.emissiveStrength,
  audioLevel = 0,
  segments = DEFAULTS.segments,
  size = DEFAULTS.size,
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
      uMidColor: { value: midColor instanceof THREE.Color ? midColor : new THREE.Color(midColor) },
      uCrestColor: { value: crestColor instanceof THREE.Color ? crestColor : new THREE.Color(crestColor) },
      uGlowColor: { value: glowColor instanceof THREE.Color ? glowColor : new THREE.Color(glowColor) },
      uGlowColor2: { value: glowColor2 instanceof THREE.Color ? glowColor2 : new THREE.Color(glowColor2) },
      uEmissiveStrength: { value: emissiveStrength },
      uPulse: { value: 1 },
      uColorShift: { value: 0 },
    }),
    [waveScale, waveHeight, frequency, speed, deepColor, midColor, crestColor, glowColor, glowColor2, emissiveStrength]
  )

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const u = meshRef.current.material.uniforms
    const t = state.clock.elapsedTime
    u.uTime.value += delta
    u.uWaveHeight.value = waveHeight + audioLevel * 0.6
    u.uWaveScale.value = waveScale
    u.uFrequency.value = frequency
    u.uSpeed.value = speed
    u.uPulse.value = 0.9 + 0.1 * Math.sin(t * 0.4)
    u.uColorShift.value = t * 0.3
  })

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, segments, segments)
    g.rotateX(-Math.PI / 2)
    return g
  }, [size, segments])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
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
