import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function useServiceWorkerUpdate() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()
  return {
    needsUpdate: needRefresh,
    applyUpdate: () => void updateServiceWorker(true),
  }
}

export function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    function handle(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handle)
    return () => window.removeEventListener('beforeinstallprompt', handle)
  }, [])

  return {
    canInstall: !!prompt,
    install() {
      if (!prompt) return
      void prompt.prompt()
      setPrompt(null)
    },
  }
}
