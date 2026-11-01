import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  title: string
  body?: string
  confirmLabel: string
  onConfirm: () => void
}

/** Conferma di un'azione distruttiva (al posto dei bottom sheet rossi del mobile). */
export function ConfirmModal({ open, onClose, title, body, confirmLabel, onConfirm }: ConfirmModalProps) {
  const { t } = useTranslation()
  const btn = { border: 'none', borderRadius: '12px', padding: '12px 20px', fontSize: '14px', cursor: 'pointer' } as const
  return (
    <Modal open={open} onClose={onClose} width={400}>
      <div style={{ fontSize: '18px', fontWeight: 500, color: 'var(--t-danger)', marginBottom: '8px' }}>{title}</div>
      {body && <div style={{ fontSize: '14px', color: 'var(--t-muted)', marginBottom: '8px' }}>{body}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
        <button onClick={onClose} style={{ ...btn, background: 'var(--t-bg)', color: 'var(--t-fg)' }}>
          {t('common.cancel')}
        </button>
        <button onClick={onConfirm} style={{ ...btn, background: 'var(--t-danger)', color: 'var(--t-on)' }}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
