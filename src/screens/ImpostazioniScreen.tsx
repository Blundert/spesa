import { useTranslation } from 'react-i18next'
import { LANG_KEY, type Lang } from '../i18n'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
]

export function ImpostazioniScreen() {
  const { t, i18n } = useTranslation()
  const current: Lang = i18n.language.startsWith('en') ? 'en' : 'it'

  const setLang = (lng: Lang) => {
    void i18n.changeLanguage(lng)
    localStorage.setItem(LANG_KEY, lng)
  }

  return (
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
      <div className="bg-white rounded-[20px] px-5 py-[17px] flex items-center justify-between">
        <span className="text-base text-[#2A2A2C]">{t('settings.version')}</span>
        <span className="text-[15px] text-[#9B9B9F] tabular-nums">{__APP_VERSION__}</span>
      </div>
    </div>
  )
}
