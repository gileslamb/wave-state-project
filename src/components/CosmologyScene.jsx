import SphereCluster from './SphereCluster'

/**
 * Cosmology of consciousness - renders one or more sphere clusters.
 *
 * Future evolution (after 2-3 min):
 * - Second cluster appears in distance
 * - Planetary/orbital motion - spheres orbit each other
 * - Third, fourth clusters - solar system of consciousness
 * - Each sphere at different brainwave states (Delta, Theta, Alpha, Beta, Gamma)
 * - Gravitational attraction between spheres
 * - Camera zoom out to see full system
 *
 * To add more spheres: add <SphereCluster position={[x,y,z]} ... /> with
 * different positions for orbital placement.
 */
export default function CosmologyScene({ getFFT, getLevel }) {
  return (
    <SphereCluster
      position={[0, 0, 0]}
      getFFT={getFFT}
      getLevel={getLevel}
      id="alpha"
    />
  )
}
