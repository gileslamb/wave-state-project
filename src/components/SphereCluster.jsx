import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { noise3D } from '../utils/noise'

const DEFAULT_RADIUS_START = 2
const DEFAULT_RADIUS_AT_3MIN = 38
const DEFAULT_EXPANSION_RATE =
  (DEFAULT_RADIUS_AT_3MIN - DEFAULT_RADIUS_START) / 180
const MAX_LINE_LENGTH_RATIO = 0.95
const MAX_BRANCHES = 100
const MAX_POINTS_PER_BRANCH = 80
const MAX_TOTAL_POINTS = 12000
const GROWTH_RATE = 0.022
const BRANCH_CHANCE = 0.008
const DEFAULT_ROT_Y_RAD_PER_S = 0.0028
const ATTRACTION_RANGE = 1.0
const ATTRACTION_STRENGTH = 0.0006
const WRITHING_STRENGTH = 0.004

function clampToSphere(p, radius) {
  const r = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2)
  if (r > radius && r > 0.0001) {
    const s = radius / r
    p[0] *= s
    p[1] *= s
    p[2] *= s
  }
}

function lineLength(points) {
  let len = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    len += Math.sqrt(
      (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 + (b[2] - a[2]) ** 2
    )
  }
  return len
}

export default function SphereCluster({
  position = [0, 0, 0],
  radiusStart = DEFAULT_RADIUS_START,
  expansionRate = DEFAULT_EXPANSION_RATE,
  rotationSpeedY = DEFAULT_ROT_Y_RAD_PER_S,
  getFFT,
  getLevel,
  id = 'alpha',
}) {
  const clusterGroupRef = useRef(null)
  const linesRef = useRef(null)
  const geodesicSphereRef = useRef(null)
  const prevSphereRadiusRef = useRef(radiusStart)
  const branchesRef = useRef(
    Array.from({ length: 12 }, (_, i) => {
      const theta = (i / 12) * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.03
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)
      return { points: [[0, 0, 0], [x, y, z]] }
    })
  )

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(MAX_TOTAL_POINTS * 3)
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, 0)
    return geo
  }, [])

  useFrame((state) => {
    if (!clusterGroupRef.current || !linesRef.current || !getFFT || !getLevel)
      return

    const branches = branchesRef.current
    const fft = getFFT()
    const level = getLevel()
    if (!fft || branches.length === 0) return

    const bass = fft.slice(0, 8).reduce((a, b) => a + b, 0) / 8 / 255
    const mids = fft.slice(8, 40).reduce((a, b) => a + b, 0) / 32 / 255
    const highs = fft.slice(40, 128).reduce((a, b) => a + b, 0) / 88 / 255

    const t = state.clock.elapsedTime
    const dt = 1 / 60

    const sphereRadius = radiusStart + expansionRate * t
    const prevRadius = prevSphereRadiusRef.current
    prevSphereRadiusRef.current = sphereRadius
    const rotY = rotationSpeedY * dt

    clusterGroupRef.current.rotation.y += rotY
    clusterGroupRef.current.position.set(...position)

    if (geodesicSphereRef.current) {
      geodesicSphereRef.current.scale.setScalar(sphereRadius)
    }

    const scaleRatio = prevRadius > 0 ? sphereRadius / prevRadius : 1
    if (scaleRatio > 1.0001) {
      for (const branch of branches) {
        for (let j = 1; j < branch.points.length; j++) {
          const p = branch.points[j]
          p[0] *= scaleRatio
          p[1] *= scaleRatio
          p[2] *= scaleRatio
        }
      }
    }

    const maxLineLength = sphereRadius * MAX_LINE_LENGTH_RATIO
    const intensity = level * 0.3 + 0.6
    const pulseAmount = (0.003 + bass * 0.008) * intensity
    const pulsePhase = t * 0.25
    const growthAmount = (level * 0.2 + mids * 0.25) * GROWTH_RATE
    const branchChanceFrame = BRANCH_CHANCE * (1 + mids * 0.5)
    const writhingAmount = (0.002 + highs * 0.005) * intensity

    const tips = branches.map((b) => ({ pt: b.points[b.points.length - 1] }))
    for (let i = 0; i < tips.length; i++) {
      const pt = tips[i].pt
      let fx = 0,
        fy = 0,
        fz = 0
      for (let j = 0; j < tips.length; j++) {
        if (i === j) continue
        const other = tips[j].pt
        const dx = other[0] - pt[0]
        const dy = other[1] - pt[1]
        const dz = other[2] - pt[2]
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.01
        if (d < ATTRACTION_RANGE && d > 0.02) {
          const f = (ATTRACTION_STRENGTH * intensity) / (d + 0.1)
          fx += (dx / d) * f
          fy += (dy / d) * f
          fz += (dz / d) * f
        }
      }
      pt[0] += fx * dt * 60
      pt[1] += fy * dt * 60
      pt[2] += fz * dt * 60
      clampToSphere(pt, sphereRadius)
    }

    for (const branch of branches) {
      const pts = branch.points
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i]
        const dist = Math.sqrt(p[0] ** 2 + p[1] ** 2 + p[2] ** 2) || 0.01
        const pulse = Math.sin(pulsePhase + i * 0.2) * pulseAmount
        p[0] += (p[0] / dist) * pulse
        p[1] += (p[1] / dist) * pulse
        p[2] += (p[2] / dist) * pulse

        const n1 =
          (noise3D(p[0] * 2 + t * 0.5, p[1] * 2, p[2] * 2) - 0.5) * writhingAmount
        const n2 =
          (noise3D(p[1] * 2 + 10, p[2] * 2 + t * 0.5, p[0] * 2) - 0.5) *
          writhingAmount
        const n3 =
          (noise3D(p[2] * 2 + 20, p[0] * 2 + t * 0.5, p[1] * 2) - 0.5) *
          writhingAmount
        p[0] += n1
        p[1] += n2
        p[2] += n3

        clampToSphere(p, sphereRadius)
      }

      const tip = pts[pts.length - 1]
      const prev = pts[pts.length - 2]
      const currentLength = lineLength(pts)

      if (
        pts.length >= 2 &&
        pts.length < MAX_POINTS_PER_BRANCH &&
        currentLength < maxLineLength &&
        growthAmount > 0.001
      ) {
        const dx = tip[0] - prev[0]
        const dy = tip[1] - prev[1]
        const dz = tip[2] - prev[2]
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001
        const dirX = dx / len
        const dirY = dy / len
        const dirZ = dz / len

        const nx =
          (noise3D(tip[0] * 3 + t * 0.3, tip[1] * 3, tip[2] * 3) - 0.5) * 0.4
        const ny =
          (noise3D(tip[1] * 3 + 50, tip[2] * 3 + t * 0.3, tip[0] * 3) - 0.5) * 0.4
        const nz =
          (noise3D(tip[2] * 3 + 100, tip[0] * 3 + t * 0.3, tip[1] * 3) - 0.5) *
          0.4

        let newX = tip[0] + (dirX + nx) * growthAmount
        let newY = tip[1] + (dirY + ny) * growthAmount
        let newZ = tip[2] + (dirZ + nz) * growthAmount

        const r = Math.sqrt(newX ** 2 + newY ** 2 + newZ ** 2)
        if (r > sphereRadius) {
          const s = sphereRadius / r
          newX *= s
          newY *= s
          newZ *= s
        }

        pts.push([newX, newY, newZ])
      }
    }

    if (Math.random() < branchChanceFrame && branches.length < MAX_BRANCHES) {
      const branch = branches[Math.floor(Math.random() * branches.length)]
      const pts = branch.points
      const tip = pts[pts.length - 1]
      const tipDist = Math.sqrt(tip[0] ** 2 + tip[1] ** 2 + tip[2] ** 2)
      if (tipDist > 0.1 && lineLength(pts) < maxLineLength * 0.8) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const g = Math.max(growthAmount * 2, 0.01)
        const dx = Math.sin(phi) * Math.cos(theta) * g
        const dy = Math.sin(phi) * Math.sin(theta) * g
        const dz = Math.cos(phi) * g
        const newPt = [tip[0] + dx, tip[1] + dy, tip[2] + dz]
        clampToSphere(newPt, sphereRadius)
        branches.push({
          points: [[tip[0], tip[1], tip[2]], newPt],
        })
      }
    }

    const positionAttr = geometry.attributes.position
    const posArray = positionAttr.array
    let idx = 0
    for (const branch of branches) {
      const pts = branch.points
      for (let i = 0; i < pts.length - 1 && idx < MAX_TOTAL_POINTS * 3 - 6; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        posArray[idx++] = a[0]
        posArray[idx++] = a[1]
        posArray[idx++] = a[2]
        posArray[idx++] = b[0]
        posArray[idx++] = b[1]
        posArray[idx++] = b[2]
      }
    }
    positionAttr.needsUpdate = true
    geometry.setDrawRange(0, idx / 3)
  })

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <group ref={clusterGroupRef} position={position}>
      <lineSegments ref={linesRef} geometry={geometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </lineSegments>
      <mesh ref={geodesicSphereRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#555555"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  )
}
