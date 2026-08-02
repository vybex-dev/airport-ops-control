import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DataLoadingOverlay } from './components/ui/DataLoadingOverlay.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataLoadingOverlay />
    <App />
  </StrictMode>,
)
