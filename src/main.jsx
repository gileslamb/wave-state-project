import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode disabled: it double-mounts components in dev, causing R3F Canvas
// to create → dispose → create, which triggers WebGL context loss on the first instance.
createRoot(document.getElementById('root')).render(<App />)
