import { useTranslation } from 'react-i18next'
import { changelog } from '../../data/changelog'
import { PageHeader } from '../components/PageHeader'

export function DesktopChangelogScreen() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('en') ? 'en' : 'it'
  const versions = Object.keys(changelog)

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('settings.changelog')} subtitle={t('desktop.changelog.subtitle')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '760px' }}>
        {versions.map((version) => {
          const entry = changelog[version]
          const isCurrent = version === __APP_VERSION__
          return (
            <div key={version} style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '17px', fontWeight: 500, color: '#2A2A2C', fontVariantNumeric: 'tabular-nums' }}>
                  {version}
                </span>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#fff',
                      background: '#2A2A2C',
                      borderRadius: '999px',
                      padding: '2px 9px',
                      lineHeight: 1,
                    }}
                  >
                    {t('settings.current')}
                  </span>
                )}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {entry[lang].map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#B5B5BA', fontSize: '15px', lineHeight: '22px' }}>•</span>
                    <span style={{ fontSize: '15px', color: '#2A2A2C', lineHeight: '22px' }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
