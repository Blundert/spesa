import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary } from './buttonStyles'
import { useShareContent } from '../../hooks/useShareContent'
import { copyToClipboard } from '../../components/share/shareActions'
import type { ShoppingList } from '../../db/types'

/** Desktop: testo pronto e modificabile da copiare, più WhatsApp e Telegram (link di condivisione web). */
export function ShareModal({ list, open, onClose }: { list: ShoppingList | undefined; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const content = useShareContent(list, open)
  // Testo modificato a mano; `null` = quello generato.
  const [edited, setEdited] = useState<string | null>(null)
  const ready = content.status === 'ready'
  const text = edited ?? (ready ? content.text : '')
  const close = () => {
    setEdited(null)
    onClose()
  }
  const openExternal = (href: string) => window.open(href, '_blank', 'noopener,noreferrer')
  return (
    <Modal open={open} onClose={close} title={t('share.title', { name: list?.name ?? '' })} width={520}>
      <textarea
        aria-label={t('share.textLabel')}
        value={text}
        onChange={(e) => setEdited(e.target.value)}
        disabled={!ready}
        rows={10}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: '1px solid var(--t-line)',
          borderRadius: '10px',
          padding: '12px 14px',
          fontSize: '14px',
          fontFamily: 'inherit',
          background: 'var(--t-bg)',
          color: 'var(--t-fg)',
          outline: 'none',
          resize: 'vertical',
          marginBottom: '12px',
        }}
      />
      {content.status === 'tooLong' && <div style={{ fontSize: '13px', color: 'var(--t-muted)', marginBottom: '12px' }}>{t('share.tooLong')}</div>}
      {content.status === 'error' && <div style={{ fontSize: '13px', color: 'var(--t-muted)', marginBottom: '12px' }}>{t('share.failed')}</div>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button disabled={!ready} style={btnPrimary} onClick={() => void copyToClipboard(text, t('share.textCopied'), t)}>
          {t('share.copyText')}
        </button>
        <button
          disabled={!ready}
          style={btnSecondary}
          onClick={() => ready && void copyToClipboard(content.url, t('share.linkCopied'), t)}
        >
          {t('share.copyLink')}
        </button>
        <button disabled={!ready} style={btnSecondary} onClick={() => openExternal(`https://wa.me/?text=${encodeURIComponent(text)}`)}>
          {t('share.whatsapp')}
        </button>
        <button disabled={!ready} style={btnSecondary} onClick={() => openExternal(`https://t.me/share/url?url=${encodeURIComponent(text)}`)}>
          {t('share.telegram')}
        </button>
      </div>
    </Modal>
  )
}
