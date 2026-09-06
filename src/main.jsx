import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Programmatically unregister any stale service workers/PWA cache to force browser updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('Unregistered stale service worker successfully.');
          window.location.reload(); // Force reload to fetch fresh assets
        }
      });
    }
  }).catch((err) => {
    console.error('Error unregistering service worker:', err);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
