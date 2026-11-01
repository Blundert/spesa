import { useTranslation } from 'react-i18next'
import { THEME_IDS, THEME_PREVIEW, resolveTheme } from '../lib/theme'
import { setThemePref, useThemePref } from '../theme/themeStore'

// Sezione "Aspetto" delle Impostazioni (mobile): un tema a scelta più "Segui il sistema".
export function ThemePicker() {
  const { t } = useTranslation()
  const pref = useThemePref()
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const inUse = resolveTheme(pref, systemDark)

  return (
    <>
      <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
        {t('theme.title')}
      </div>
      <div
        role="radiogroup"
        aria-label={t('theme.label')}
        className="bg-t-surface rounded-[20px] overflow-hidden mb-3"
        style={{ opacity: pref.auto ? 0.55 : 1 }}
      >
        {THEME_IDS.map((id, i) => {
          const p = THEME_PREVIEW[id]
          const selected = !pref.auto && pref.theme === id
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected}
              disabled={pref.auto}
              onClick={() => setThemePref({ theme: id, auto: false })}
              className="w-full flex items-center gap-3 px-5 py-[14px] active:bg-t-surface2 transition-colors text-left disabled:active:bg-transparent"
              style={{ borderBottom: i < THEME_IDS.length - 1 ? '1px solid var(--t-line)' : 'none' }}
            >
              <span className="flex flex-none rounded-[9px] overflow-hidden border border-t-line h-[30px] w-[66px]">
                {[p.bg, p.surface, p.accent, p.c1, p.c2, p.c3].map((c, n) => (
                  <i key={n} className="flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-base text-t-fg">{t(`theme.name.${id}`)}</span>
                <span className="block text-[13px] text-t-muted leading-snug">{t(`theme.note.${id}`)}</span>
              </span>
              {selected && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-t-fg">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <div className="bg-t-surface rounded-[20px] px-5 py-[13px] flex items-center justify-between gap-4 mb-2">
        <span className="text-base text-t-fg">{t('theme.auto')}</span>
        <button
          role="switch"
          aria-checked={pref.auto}
          aria-label={t('theme.auto')}
          onClick={() => setThemePref({ theme: pref.theme, auto: !pref.auto })}
          className="relative flex-none w-[46px] h-[28px] rounded-full transition-colors"
          style={{ background: pref.auto ? 'var(--t-accent)' : 'var(--t-line2)' }}
        >
          <span
            className="absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-t-on transition-transform"
            style={{ transform: pref.auto ? 'translateX(18px)' : 'none' }}
          />
        </button>
      </div>
      <div className="text-[13px] text-t-muted px-1.5 mb-7">
        {pref.auto ? t('theme.autoInUse', { name: t(`theme.name.${inUse}`) }) : t('theme.autoHint')}
      </div>
    </>
  )
}
