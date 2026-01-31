import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const LIGHT_ORBIT_RADIUS = 10
const LIGHT_HEIGHT = 4

export default function DynamicLights() {
  const light1Ref = useRef(null)
  const light2Ref = useRef(null)
  const light3Ref = useRef(null)
  const light4Ref = useRef(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const slow = t * 0.12
    const medium = t * 0.18

    if (light1Ref.current) {
      light1Ref.current.position.x = Math.sin(slow) * LIGHT_ORBIT_RADIUS
      light1Ref.current.position.z = Math.cos(slow) * LIGHT_ORBIT_RADIUS
      light1Ref.current.position.y = LIGHT_HEIGHT + Math.sin(medium * 0.5) * 0.8
    }
    if (light2Ref.current) {
      light2Ref.current.position.x = Math.sin(slow + Math.PI * 0.5) * LIGHT_ORBIT_RADIUS * 0.8
      light2Ref.current.position.z = Math.cos(slow + Math.PI * 0.5) * LIGHT_ORBIT_RADIUS * 0.8
      light2Ref.current.position.y = LIGHT_HEIGHT * 0.7 + Math.cos(medium * 0.7) * 0.6
    }
    if (light3Ref.current) {
      light3Ref.current.position.x = Math.sin(slow + Math.PI) * LIGHT_ORBIT_RADIUS * 0.9
      light3Ref.current.position.z = Math.cos(slow + Math.PI) * LIGHT_ORBIT_RADIUS * 0.9
      light3Ref.current.position.y = LIGHT_HEIGHT * 1.2 + Math.sin(medium * 0.6) * 0.5
    }
    if (light4Ref.current) {
      light4Ref.current.position.x = Math.sin(slow + Math.PI * 1.5) * LIGHT_ORBIT_RADIUS * 0.7
      light4Ref.current.position.z = Math.cos(slow + Math.PI * 1.5) * LIGHT_ORBIT_RADIUS * 0.7
      light4Ref.current.position.y = LIGHT_HEIGHT * 0.9 + Math.cos(medium * 0.8) * 0.7
    }
  })

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 12, 5]} intensity={0.5} color="#1e3a5f" />
      <pointLight
        ref={light1Ref}
        intensity={0.8}
        color="#00e5ff"
        distance={28}
        decay={2}
        position={[8, 4, 0]}
      />
      <pointLight
        ref={light2Ref}
        intensity={0.6}
        color="#a855f7"
        distance={24}
        decay={2}
        position={[0, 3, 8]}
      />
      <pointLight
        ref={light3Ref}
        intensity={0.5}
        color="#06b6d4"
        distance={22}
        decay={2}
        position={[-8, 5, 0]}
      />
      <pointLight
        ref={light4Ref}
        intensity={0.4}
        color="#ec4899"
        distance={20}
        decay={2}
        position={[0, 3, -8]}
      />
    </>
  )
}
