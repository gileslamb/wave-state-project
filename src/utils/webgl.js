/**
 * Checks if WebGL is available and returns diagnostic info.
 * @returns {{ available: boolean, error?: string, details?: object }}
 */
export function checkWebGLAvailability() {
  try {
    const canvas = document.createElement('canvas')

    // Try WebGL2 first (preferred), then WebGL1
    const gl2 = canvas.getContext('webgl2', {
      failIfMajorPerformanceCaveat: false,
    })
    if (gl2) {
      const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info')
      const renderer = debugInfo
        ? gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'unknown'
      const vendor = debugInfo
        ? gl2.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : gl2.getParameter(gl2.VENDOR)
      // Don't call loseContext() - it can trigger driver-level context loss
      // that affects the main Canvas. Let the temp canvas be GC'd.
      return {
        available: true,
        version: 2,
        details: { renderer, vendor },
      }
    }

    const gl1 = canvas.getContext('webgl', {
      failIfMajorPerformanceCaveat: false,
    })
    if (gl1) {
      const debugInfo = gl1.getExtension('WEBGL_debug_renderer_info')
      const renderer = debugInfo
        ? gl1.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'unknown'
      const vendor = debugInfo
        ? gl1.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : gl1.getParameter(gl1.VENDOR)
      return {
        available: true,
        version: 1,
        details: { renderer, vendor },
      }
    }

    return {
      available: false,
      error: 'Could not get WebGL or WebGL2 context from canvas',
    }
  } catch (err) {
    return {
      available: false,
      error: err?.message ?? String(err),
      details: {
        name: err?.name,
        stack: err?.stack,
      },
    }
  }
}
