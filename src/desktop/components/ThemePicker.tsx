import { useTranslation } from 'react-i18next'
import { THEME_IDS, THEME_PREVIEW, resolveTheme } from '../../lib/theme'
import { setThemePref, useThemePref } from '../../theme/themeStore'
import { SectionTitle } from './PageHeader'

/** Scheda "Aspetto" delle Impostazioni desktop: campioni dei temi e "Segui il sistema". */
export function ThemePicker() {
  const { t } = useTranslation()
  const pref = useThemePref()
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const inUse = resolveTheme(pref, systemDark)

  return (
    <div style={{ background: 'var(--t-surface)', borderRadius: '16px', padding: '24px', gridColumn: '1 / -1', minWidth: 0 }}>
      <SectionTitle>{t('theme.title')}</SectionTitle>
      <div
        role="radiogroup"
        aria-label={t('theme.label')}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '10px',
          opacity: pref.auto ? 0.55 : 1,
          marginBottom: '20px',
        }}
      >
        {THEME_IDS.map((id) => {
          const p = THEME_PREVIEW[id]
          const selected = !pref.auto && pref.theme === id
          return (
            <button
              key={id}
              role="radio"
              aria-checked={selected}
              disabled={pref.auto}
              onClick={() => setThemePref({ theme: id, auto: false })}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '10px',
                textAlign: 'left',
                minWidth: 0,
                background: 'transparent',
                border: selected ? '1.5px solid var(--t-fg)' : '1.5px solid var(--t-line)',
                boxShadow: selected ? '0 0 0 1px var(--t-fg)' : 'none',
                borderRadius: '14px',
                cursor: pref.auto ? 'default' : 'pointer',
                color: 'var(--t-fg)',
              }}
            >
              <span style={{ display: 'flex', height: '34px', borderRadius: '9px', overflow: 'hidden', border: '1px solid var(--t-line)' }}>
                {[p.bg, p.surface, p.accent, p.c1, p.c2, p.c3].map((c, n) => (
                  <i key={n} style={{ flex: 1, background: c }} />
                ))}
              </span>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                {t(`theme.name.${id}`)}
                <span aria-hidden style={{ fontSize: '12px', opacity: selected ? 1 : 0 }}>✓</span>
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--t-muted)', lineHeight: 1.35 }}>{t(`theme.note.${id}`)}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '14px', color: 'var(--t-fg)' }}>{t('theme.auto')}</div>
          <div style={{ fontSize: '13px', color: 'var(--t-muted)' }}>
            {pref.auto ? t('theme.autoInUse', { name: t(`theme.name.${inUse}`) }) : t('theme.autoHint')}
          </div>
        </div>
        <button
          role="switch"
          aria-checked={pref.auto}
          aria-label={t('theme.auto')}
          onClick={() => setThemePref({ theme: pref.theme, auto: !pref.auto })}
          style={{
            position: 'relative',
            width: '46px',
            height: '28px',
            borderRadius: '999px',
            border: 'none',
            flex: 'none',
            cursor: 'pointer',
            background: pref.auto ? 'var(--t-accent)' : 'var(--t-line2)',
            transition: 'background 0.15s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--t-on)',
              transform: pref.auto ? 'translateX(18px)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>
      </div>
    </div>
  )
}
