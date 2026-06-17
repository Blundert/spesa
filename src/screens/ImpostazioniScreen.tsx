import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { PWAInstallElement } from '@khmyznikov/pwa-install'
import { LANG_KEY, type Lang } from '../i18n'
import { wipeAllData } from '../db/db'
import { BottomSheet } from '../components/BottomSheet'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

export function ImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const qc = useQueryClient()
  const [showWipe, setShowWipe] = useState(false)
  const current: Lang = i18n.language.startsWith('en') ? 'en' : 'it'

  const setLang = (lng: Lang) => {
    void i18n.changeLanguage(lng)
    localStorage.setItem(LANG_KEY, lng)
  }

  const handleWipe = async () => {
    await wipeAllData()
    // invalidateQueries (non clear): forza il refetch delle query ATTIVE, così la
    // bottom bar in AppShell si aggiorna sul posto senza dover navigare.
    await qc.invalidateQueries()
    setShowWipe(false)
    toast(t('settings.cleared'))
  }

  const handleInstall = () => {
    document.querySelector<PWAInstallElement>('pwa-install')?.showDialog(true)
  }

  // Forza il check di un nuovo service worker e ricarica: con registerType
  // 'autoUpdate' (skipWaiting) la nuova versione si attiva al reload.
  const handleUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.update()))
    }
    window.location.reload()
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="px-1 pt-2 pb-[18px]">
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {t('settings.title')}
          </span>
        </div>

        {/* Lingua */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
          {t('settings.language')}
        </div>
        <div className="bg-white rounded-[20px] overflow-hidden mb-7">
          {LANGS.map((l, i) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className="w-full flex items-center justify-between px-5 py-[17px] active:bg-[#F6F6F4] transition-colors text-left"
              style={{ borderBottom: i < LANGS.length - 1 ? '1px solid #ECECEC' : 'none' }}
            >
              <span className="text-base text-[#2A2A2C]">{l.label}</span>
              {current === l.code && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Installa */}
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-between bg-white rounded-[20px] px-5 py-[17px] mb-7 active:bg-[#F6F6F4] transition-colors text-left"
        >
          <span className="text-base text-[#2A2A2C]">{t('install.title')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v13M8 12l4 4 4-4M5 19h14" />
          </svg>
        </button>

        {/* Aggiorna app (service worker) */}
        <button
          onClick={() => void handleUpdate()}
          className="w-full flex items-center justify-between bg-white rounded-[20px] px-5 py-[17px] mb-7 active:bg-[#F6F6F4] transition-colors text-left"
        >
          <span className="text-base text-[#2A2A2C]">{t('settings.refresh')}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" />
          </svg>
        </button>

        {/* Versione */}
        <div className="bg-white rounded-[20px] px-5 py-[17px] flex items-center justify-between mb-7">
          <span className="text-base text-[#2A2A2C]">{t('settings.version')}</span>
          <span className="text-[15px] text-[#9B9B9F] tabular-nums">{__APP_VERSION__}</span>
        </div>

        {/* Dati */}
        <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
          {t('settings.data')}
        </div>
        <button
          onClick={() => setShowWipe(true)}
          className="w-full bg-white rounded-[20px] px-5 py-[17px] text-left text-base text-[#D14343] active:bg-[#F6F6F4] transition-colors"
        >
          {t('settings.deleteAll')}
        </button>
      </div>

      {/* Drawer di conferma azzeramento */}
      <BottomSheet open={showWipe} onClose={() => setShowWipe(false)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('settings.confirmTitle')}
        </div>
        <p className="text-sm text-[#6E6E72] px-0.5 pb-4 leading-relaxed">
          {t('settings.confirmBody')}
        </p>
        <button
          onClick={() => void handleWipe()}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-2 active:scale-[.98] transition-transform"
        >
          {t('settings.deleteConfirm')}
        </button>
        <button
          onClick={() => setShowWipe(false)}
          className="w-full bg-[#ECECEA] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}
