import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { seedPakistaniPrices } from './services/seedPrices'

// Seed realistic Pakistani grocery prices on first launch
seedPakistaniPrices();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
