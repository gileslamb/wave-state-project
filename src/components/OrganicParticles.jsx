import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 180
const BOUNDS = 18
const PERCEPTION = 4
const COHESION = 0.0008
const SEPARATION = 0.025
const ALIGNMENT = 0.015
const ATTRACTION = 0.00015
const MAX_SPEED = 0.08
const MAX_FORCE = 0.02

const COLORS = [
  [0, 0.9, 1.0],
  [0.66, 0.33, 0.97],
  [0.02, 0.71, 0.83],
  [0.6, 0.2, 0.95],
]

const POINT_VERTEX = `
  attribute float aScale;
  attribute float aOpacity;
  attribute vec3 aColor;
  varying float vScale;
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    vScale = aScale;
    vOpacity = aOpacity;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 14.0 * aScale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const POINT_FRAGMENT = `
  varying float vScale;
  varying float vOpacity;
  varying vec3 vColor;

  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    float alpha = (1.0 - r * r) * vOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export default function OrganicParticles() {
  const pointsRef = useRef(null)
  const positions = useMemo(() => new Float32Array(COUNT * 3), [])
  const velocities = useMemo(() => new Float32Array(COUNT * 3), [])
  const scales = useMemo(() => new Float32Array(COUNT), [])
  const opacities = useMemo(() => new Float32Array(COUNT), [])
  const colors = useMemo(() => new Float32Array(COUNT * 3), [])

  const particles = useMemo(() => {
    const p = []
    for (let i = 0; i < COUNT; i++) {
      p.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * BOUNDS * 2,
          (Math.random() - 0.3) * BOUNDS,
          (Math.random() - 0.5) * BOUNDS * 2
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
      })
    }
    return p
  }, [])

  const geometry = useMemo(() => {
    particles.forEach((p, i) => {
      positions[i * 3] = p.pos.x
      positions[i * 3 + 1] = p.pos.y
      positions[i * 3 + 2] = p.pos.z
      scales[i] = 0.7
      opacities[i] = 0.5
      const c = COLORS[i % COLORS.length]
      colors[i * 3] = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geo.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    const t = state.clock.elapsedTime
    const flowX = Math.sin(t * 0.15) * 2
    const flowZ = Math.cos(t * 0.12) * 2

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i]
      const pos = p.pos
      const vel = p.vel

      let cohesionForce = new THREE.Vector3(0, 0, 0)
      let separationForce = new THREE.Vector3(0, 0, 0)
      let alignmentForce = new THREE.Vector3(0, 0, 0)
      let count = 0
      let sepCount = 0

      for (let j = 0; j < COUNT; j++) {
        if (i === j) continue
        const other = particles[j]
        const diff = other.pos.clone().sub(pos)
        const d = diff.length()

        if (d < PERCEPTION) {
          cohesionForce.add(other.pos)
          alignmentForce.add(other.vel)
          count++

          if (d < PERCEPTION * 0.5 && d > 0.01) {
            separationForce.add(diff.clone().normalize().divideScalar(d))
            sepCount++
          }
        }
      }

      if (count > 0) {
        cohesionForce.divideScalar(count).sub(pos).multiplyScalar(COHESION)
        alignmentForce.divideScalar(count).sub(vel).multiplyScalar(ALIGNMENT)
      }
      if (sepCount > 0) {
        separationForce.multiplyScalar(SEPARATION)
      }

      const flowCenter = new THREE.Vector3(flowX, 0, flowZ)
      const toFlow = flowCenter.clone().sub(pos).multiplyScalar(ATTRACTION)

      vel.add(cohesionForce)
      vel.add(alignmentForce)
      vel.add(separationForce)
      vel.add(toFlow)

      vel.x += (Math.random() - 0.5) * 0.002
      vel.y += (Math.random() - 0.5) * 0.002
      vel.z += (Math.random() - 0.5) * 0.002

      const speed = vel.length()
      if (speed > MAX_SPEED) vel.multiplyScalar(MAX_SPEED / speed)

      pos.add(vel)

      if (pos.x < -BOUNDS) pos.x = BOUNDS
      if (pos.x > BOUNDS) pos.x = -BOUNDS
      if (pos.y < -BOUNDS * 0.5) pos.y = BOUNDS * 0.5
      if (pos.y > BOUNDS * 0.5) pos.y = -BOUNDS * 0.5
      if (pos.z < -BOUNDS) pos.z = BOUNDS
      if (pos.z > BOUNDS) pos.z = -BOUNDS

      positions[i * 3] = pos.x
      positions[i * 3 + 1] = pos.y
      positions[i * 3 + 2] = pos.z

      scales[i] = 0.6 + Math.sin(t * 0.5 + i * 0.1) * 0.2
      opacities[i] = 0.4 + Math.sin(t * 0.3 + i * 0.15) * 0.15
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aScale.needsUpdate = true
    geometry.attributes.aOpacity.needsUpdate = true
  })

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, 0.5, 0]}>
      <shaderMaterial
        vertexShader={POINT_VERTEX}
        fragmentShader={POINT_FRAGMENT}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
