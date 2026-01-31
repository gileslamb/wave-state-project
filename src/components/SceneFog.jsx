import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function SceneFog() {
  const { scene } = useThree()

  useEffect(() => {
    scene.fog = new THREE.FogExp2('#030712', 0.045)
    return () => {
      scene.fog = null
    }
  }, [scene])

  return null
}
