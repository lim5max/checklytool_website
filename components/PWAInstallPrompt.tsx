'use client'

import { useEffect } from 'react'

export default function PWAInstallPrompt() {
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })
    }

    // Handle PWA install prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deferredPrompt: any
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e
      
      // Show custom install button or banner
      const installButton = document.getElementById('pwa-install-button')
      if (installButton) {
        installButton.style.display = 'block'
      }
    }

    const handleInstallClick = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt')
          }
          deferredPrompt = null
        })
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    const installButton = document.getElementById('pwa-install-button')
    if (installButton) {
      installButton.addEventListener('click', handleInstallClick)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      if (installButton) {
        installButton.removeEventListener('click', handleInstallClick)
      }
    }
  }, [])

  return null
}