import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === '1'
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  const handleInstall = async () => {
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted' || outcome === 'dismissed') {
      setPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="fixed bottom-[100px] left-4 right-4 z-[60] bg-[#2A2A2C] text-white rounded-[22px] px-5 py-4 flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,.35)]">
      <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center flex-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v13M8 12l4 4 4-4M5 19h14" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm font-normal">Installa l'app</div>
        <div className="text-xs text-white/60 mt-0.5">Accesso rapido dalla home</div>
      </div>
      <button onClick={handleInstall} className="text-sm font-normal bg-white/15 px-3 py-1.5 rounded-xl active:bg-white/25">
        Installa
      </button>
      <button onClick={handleDismiss} className="text-white/50 active:text-white/80 ml-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
