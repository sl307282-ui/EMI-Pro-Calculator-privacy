import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import './index.css'
import App from './App.jsx'

try {
  CapacitorUpdater.notifyAppReady();
} catch (e) {
  console.warn('CapacitorUpdater.notifyAppReady failed:', e);
}

window.onerror = function(message, source, lineno, colno, error) {
  alert("Error: " + message + " at " + source + ":" + lineno);
  return false;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker for PWA
/* 
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered!', reg))
      .catch(err => console.log('SW Registration Failed!', err));
  });
}
*/
