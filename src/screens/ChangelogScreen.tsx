import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { changelog } from '../data/changelog'

export function ChangelogScreen() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lang = i18n.language.startsWith('en') ? 'en' : 'it'
  const versions = Object.keys(changelog)

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="h-[54px] flex-none" />
      <div className="flex-1 overflow-y-auto px-5 pb-[40px]">
        {/* Header */}
        <div className="relative flex items-center pt-1 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/impostazioni' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {t('settings.changelog')}
          </span>
        </div>

        {/* Version list */}
        <div className="flex flex-col gap-[10px]">
          {versions.map((version) => {
            const entry = changelog[version]
            const isCurrent = version === __APP_VERSION__
            return (
              <div key={version} className="bg-white rounded-[20px] px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[17px] font-medium text-[#2A2A2C] tabular-nums">
                    {version}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-medium text-white bg-[#2A2A2C] rounded-full px-[9px] py-[2px] leading-none">
                      {t('settings.current')}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col gap-[6px]">
                  {entry[lang].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#B5B5BA] text-[15px] leading-[22px] select-none">•</span>
                      <span className="text-[15px] text-[#2A2A2C] leading-[22px]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
