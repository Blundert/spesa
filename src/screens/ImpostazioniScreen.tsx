import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
    qc.clear()
    setShowWipe(false)
    toast(t('settings.cleared'))
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
