import { Component } from 'react'

export default class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.group('[WebGL Error Boundary] Caught error')
    console.error('Error:', error)
    console.error('Error message:', error?.message ?? String(error))
    console.error('Error name:', error?.name)
    if (error?.stack) console.error('Stack trace:', error.stack)
    console.error('Component stack:', errorInfo?.componentStack ?? '(none)')
    console.error('Full errorInfo:', errorInfo)
    console.groupEnd()
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
