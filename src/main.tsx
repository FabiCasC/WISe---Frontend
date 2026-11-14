import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/tokens.css'
import './styles/app.css'
import './styles/home.css'
import './styles/nasa.css'

const host = document.getElementById('root')

if (!host) {
  throw new Error('No se encontró #root en index.html')
}

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
