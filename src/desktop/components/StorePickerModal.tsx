import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from './Modal'
import { qk } from '../../db/queryKeys'

interface StorePickerModalProps {
  open: boolean
  onClose: () => void
  supermarkets: Array<{ id?: number; name: string }>
  currentId: number | null
  onPick: (id: number) => void
}

/** Scelta (o creazione) del supermercato, in un dialogo desktop. */
export function StorePickerModal({ open, onClose, supermarkets, currentId, onPick }: StorePickerModalProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const addAndPick = async () => {
    if (!newName.trim()) return
    const { upsertSupermarket } = await import('../../db/repositories/supermarkets')
    const id = await upsertSupermarket(newName.trim())
    // Aggiorna la cache prima di selezionare, altrimenti il nuovo negozio non viene trovato.
    await qc.invalidateQueries({ queryKey: qk.supermarkets() })
    onPick(id)
    setNewName('')
    setShowAdd(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={t('spesa.chooseStore')} width={400}>
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
        {supermarkets.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id !== undefined && onPick(s.id)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              padding: '13px 6px',
              borderBottom: '1px solid #F2F2F0',
              fontSize: '15px',
              color: '#2A2A2C',
              fontWeight: s.id === currentId ? 600 : 400,
            }}
          >
            {s.name}
            {s.id === currentId && <span aria-hidden>✓</span>}
          </button>
        ))}
      </div>
      {showAdd ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addAndPick()
            }}
            placeholder={t('spesa.storeNamePlaceholder')}
            style={{ flex: 1, border: '1px solid #ECECEC', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={() => void addAndPick()}
            style={{ border: 'none', borderRadius: '10px', background: '#2A2A2C', color: '#fff', padding: '0 16px', fontSize: '14px', cursor: 'pointer' }}
          >
            {t('spesa.addAndSelect')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          style={{ width: '100%', border: '1px solid #ECECEC', borderRadius: '12px', background: '#fff', padding: '12px', fontSize: '14px', cursor: 'pointer', color: '#2A2A2C' }}
        >
          {t('spesa.addStore')}
        </button>
      )}
    </Modal>
  )
}
