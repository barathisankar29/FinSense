import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import 'leaflet/dist/leaflet.css'
import App from './App'
import './style.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('FinSense root element was not found.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter basename="/FinSense">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)