export default function WebGLFallback({ onRetry, error, details }) {
  const errorMessage = error
    ? `Error: ${error}`
    : 'WebGL could not be initialized. This can happen if your browser or device doesn\'t support WebGL, or if another application is using the GPU.'

  return (
    <div className="webgl-fallback" style={fallbackStyles}>
      <div style={fallbackCardStyles}>
        <h2 style={fallbackTitleStyles}>Unable to load 3D view</h2>
        <p style={fallbackTextStyles}>{errorMessage}</p>
        {details && (
          <pre style={detailsStyles}>
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
        <div style={fallbackActionsStyles}>
          <button
            type="button"
            onClick={onRetry}
            style={retryButtonStyles}
            aria-label="Retry loading 3D view"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  )
}

const fallbackStyles = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0e17',
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '2rem',
}

const fallbackCardStyles = {
  maxWidth: '420px',
  textAlign: 'center',
}

const fallbackTitleStyles = {
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '0.75rem',
  letterSpacing: '0.05em',
}

const fallbackTextStyles = {
  fontSize: '0.9rem',
  lineHeight: 1.5,
  opacity: 0.8,
  marginBottom: '1rem',
}

const detailsStyles = {
  fontSize: '0.75rem',
  textAlign: 'left',
  opacity: 0.7,
  marginBottom: '1.5rem',
  padding: '0.75rem',
  background: 'rgba(0,0,0,0.3)',
  borderRadius: '4px',
  overflow: 'auto',
  maxHeight: '120px',
}

const fallbackActionsStyles = {
  display: 'flex',
  justifyContent: 'center',
  gap: '0.75rem',
}

const retryButtonStyles = {
  padding: '0.6rem 1.25rem',
  fontSize: '0.9rem',
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '4px',
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
  transition: 'background 0.2s, border-color 0.2s',
}
