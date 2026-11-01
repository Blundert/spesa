import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  width?: number
}

/** Finestra di dialogo centrata per il desktop (al posto dei bottom sheet del mobile). Esc o clic fuori chiudono. */
export function Modal({ open, onClose, title, children, width = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: `${width}px`,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 12px 44px rgba(0,0,0,0.16)',
        }}
      >
        {title && (
          <div style={{ fontSize: '18px', fontWeight: 500, color: '#2A2A2C', marginBottom: '16px' }}>{title}</div>
        )}
        {children}
      </div>
    </div>
  )
}
