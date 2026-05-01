import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// basename matches Vite's `base` setting so deep-linking works under any
// gh-pages subpath without requiring code changes when `base` shifts.
// Strip a single trailing slash so "/" stays as "/" but "/marv/" becomes "/marv".
const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={baseUrl}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
