import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { BuoniSteppers } from '../../components/BuoniSheet'

interface BuoniModalProps {
  open: boolean
  onClose: () => void
  buoni: number
  valueCents: number
  onSave: (buoni: number, valueCents: number) => void
}

/** Modifica dei buoni di una spesa (in corso o conclusa), in un dialogo desktop. */
export function BuoniModal({ open, onClose, buoni, valueCents, onSave }: BuoniModalProps) {
  return (
    <Modal open={open} onClose={onClose} width={380}>
      <BuoniBody buoni={buoni} valueCents={valueCents} onSave={onSave} />
    </Modal>
  )
}

// Il corpo si rimonta a ogni apertura: la bozza riparte dai valori correnti.
function BuoniBody({ buoni, valueCents, onSave }: Pick<BuoniModalProps, 'buoni' | 'valueCents' | 'onSave'>) {
  const { t } = useTranslation()
  const [draftBuoni, setDraftBuoni] = useState(buoni)
  const [draftVal, setDraftVal] = useState(valueCents)
  return (
    <>
      <div style={{ fontSize: '18px', fontWeight: 500, color: '#2A2A2C', marginBottom: '16px' }}>
        {t('spesa.editBuoniTitle')}
      </div>
      <BuoniSteppers buoni={draftBuoni} valueCents={draftVal} onBuoni={setDraftBuoni} onValue={setDraftVal} />
      <button
        onClick={() => onSave(draftBuoni, draftVal)}
        style={{ width: '100%', border: 'none', borderRadius: '12px', background: '#2A2A2C', color: '#fff', padding: '13px', fontSize: '15px', cursor: 'pointer' }}
      >
        {t('common.save')}
      </button>
    </>
  )
}
