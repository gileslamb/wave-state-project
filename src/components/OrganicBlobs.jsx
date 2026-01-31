import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const BLOB_COUNT = 10
const ATTRACTION_RANGE = 4
const ATTRACTION_STRENGTH = 0.00004
const MERGE_DISTANCE = 1.2
const SPLIT_THRESHOLD = 2.2
const SPLIT_CHANCE = 0.00005
const MAX_SPEED = 0.008
const DRIFT_STRENGTH = 0.00015
const BOUNDS = 8

const BLOB_COLORS = [
  [0, 0.9, 1.0],
  [0.6, 0.2, 0.95],
  [0.02, 0.7, 0.85],
  [0.5, 0.3, 1.0],
  [0.1, 0.85, 0.9],
]

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = `
  uniform vec3 uBlobs[10];
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 pos = vUv * 2.0 - 1.0;
    pos.x *= 1.2;

    float field = 0.0;
    vec3 glow = vec3(0.0);
    float maxInfluence = 0.0;

    for (int i = 0; i < 10; i++) {
      vec2 blobPos = uBlobs[i].xy;
      float r = uBlobs[i].z * 2.5;
      float d = length(pos - blobPos) + 0.001;
      float influence = (r * r) / (d * d);
      field += influence;

      float w = influence / (field + 0.001);
      float hue = float(i) * 0.2 + uTime * 0.02;
      vec3 c = vec3(
        0.5 + 0.5 * sin(hue),
        0.5 + 0.5 * sin(hue + 2.094),
        0.5 + 0.5 * sin(hue + 4.188)
      );
      c = mix(vec3(0.0, 0.9, 1.0), vec3(0.6, 0.2, 0.95), float(i) / 10.0);
      glow = mix(glow, c, w);
    }

    float edge = smoothstep(0.92, 1.08, field);
    float softEdge = smoothstep(0.5, 1.0, field);
    vec3 color = glow * softEdge * 2.0;
    float alpha = edge * 0.9;

    gl_FragColor = vec4(color, alpha);
  }
`

function createBlob(i) {
  return {
    x: (Math.random() - 0.5) * BOUNDS * 1.5,
    y: (Math.random() - 0.5) * BOUNDS * 1.5,
    r: 0.4 + Math.random() * 0.5,
    vx: 0,
    vy: 0,
    color: BLOB_COLORS[i % BLOB_COLORS.length],
  }
}

export default function OrganicBlobs() {
  const meshRef = useRef(null)
  const blobsRef = useRef(
    Array.from({ length: BLOB_COUNT }, (_, i) => createBlob(i))
  )

  const uniforms = useMemo(
    () => ({
      uBlobs: {
        value: Array.from({ length: 10 }, () => new THREE.Vector3(0, 0, 0.5)),
      },
      uTime: { value: 0 },
    }),
    []
  )

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(24, 24, 1, 1)
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state) => {
    if (!meshRef.current) return
    const blobs = blobsRef.current
    const t = state.clock.elapsedTime
    const dt = 0.016

    const driftX = Math.sin(t * 0.03) * 0.5 + Math.sin(t * 0.07) * 0.3
    const driftY = Math.cos(t * 0.04) * 0.5 + Math.cos(t * 0.06) * 0.3

    for (let i = 0; i < blobs.length; i++) {
      const b = blobs[i]
      let fx = 0,
        fy = 0

      for (let j = 0; j < blobs.length; j++) {
        if (i === j) continue
        const o = blobs[j]
        const dx = o.x - b.x
        const dy = o.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy) + 0.01

        if (d < ATTRACTION_RANGE && d > 0.5) {
          const f = ATTRACTION_STRENGTH / (d * d)
          fx += (dx / d) * f
          fy += (dy / d) * f
        }
      }

      fx += (driftX - b.x) * DRIFT_STRENGTH
      fy += (driftY - b.y) * DRIFT_STRENGTH

      fx += (Math.random() - 0.5) * 0.0002
      fy += (Math.random() - 0.5) * 0.0002

      b.vx += fx * dt
      b.vy += fy * dt

      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy)
      if (speed > MAX_SPEED) {
        b.vx *= MAX_SPEED / speed
        b.vy *= MAX_SPEED / speed
      }

      b.vx *= 0.995
      b.vy *= 0.995

      b.x += b.vx * dt * 60
      b.y += b.vy * dt * 60

      b.x = Math.max(-BOUNDS, Math.min(BOUNDS, b.x))
      b.y = Math.max(-BOUNDS, Math.min(BOUNDS, b.y))

      if (
        b.r > SPLIT_THRESHOLD &&
        blobs.length < BLOB_COUNT &&
        Math.random() < SPLIT_CHANCE
      ) {
        b.r *= 0.7
        blobs.push({
          x: b.x + (Math.random() - 0.5) * 2,
          y: b.y + (Math.random() - 0.5) * 2,
          r: b.r * 0.8,
          vx: (Math.random() - 0.5) * 0.01,
          vy: (Math.random() - 0.5) * 0.01,
          color: BLOB_COLORS[blobs.length % BLOB_COLORS.length],
        })
      }
    }

    for (let i = blobs.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const a = blobs[i]
        const b = blobs[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy)

        if (d < MERGE_DISTANCE && d > 0.01) {
          const totalR = a.r + b.r
          a.x = (a.x * a.r + b.x * b.r) / totalR
          a.y = (a.y * a.r + b.y * b.r) / totalR
          a.r = Math.min(totalR * 0.6, 2.5)
          a.vx = (a.vx + b.vx) * 0.5
          a.vy = (a.vy + b.vy) * 0.5
          blobs.splice(j, 1)
          break
        }
      }
    }

    const u = meshRef.current.material.uniforms
    u.uTime.value = t
    for (let i = 0; i < 10; i++) {
      const b = blobs[i] || { x: -20, y: -20, r: 0.001 }
      u.uBlobs.value[i].set(b.x / BOUNDS, b.y / BOUNDS, (b.r / BOUNDS) * 1.5)
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, 0]}>
      <shaderMaterial
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
