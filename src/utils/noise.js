/**
 * Simple 2D gradient-like noise for organic curves.
 * Returns value in [0, 1] range.
 */
export function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return (n - Math.floor(n))
}

/**
 * Smoother fractal noise by layering.
 */
export function smoothNoise(x, y, octaves = 3) {
  let value = 0
  let freq = 1
  let amp = 1
  let max = 0
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * freq, y * freq) * amp
    max += amp
    freq *= 2
    amp *= 0.5
  }
  return value / max
}

/**
 * 3D noise for organic curves - combines 2D slices.
 */
export function noise3D(x, y, z) {
  return (smoothNoise(x, y) + smoothNoise(y, z) + smoothNoise(z, x)) / 3
}
