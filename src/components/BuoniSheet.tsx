import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCentsPlain } from '../lib/money'
import { BottomSheet } from './BottomSheet'

/** Card con gli stepper "numero buoni" e "valore buono" (condivisa da Nuova spesa e Modifica buoni). */
export function BuoniSteppers({
  buoni,
  valueCents,
  onBuoni,
  onValue,
}: {
  buoni: number
  valueCents: number
  onBuoni: (n: number) => void
  onValue: (v: number) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-[#F6F6F4] rounded-[18px] px-4 mb-[14px]">
      <div className="flex items-center justify-between py-[14px] border-b border-[#E6E6E2]">
        <span className="text-base text-[#2A2A2C]">{t('spesa.buoni')}</span>
        <div className="flex items-center gap-4">
          <StepperBtn onClick={() => onBuoni(Math.max(0, buoni - 1))} label="-">
            <MinusIcon />
          </StepperBtn>
          <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[20px] text-center tabular-nums">
            {buoni}
          </span>
          <StepperBtn onClick={() => onBuoni(buoni + 1)} label="+">
            <PlusIcon />
          </StepperBtn>
        </div>
      </div>
      <div className="flex items-center justify-between py-[14px]">
        <span className="text-base text-[#2A2A2C]">{t('spesa.buonoValue')}</span>
        <div className="flex items-center gap-4">
          <StepperBtn onClick={() => onValue(Math.max(50, valueCents - 50))} label="-">
            <MinusIcon />
          </StepperBtn>
          <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[54px] text-center tabular-nums">
            €{formatCentsPlain(valueCents)}
          </span>
          <StepperBtn onClick={() => onValue(valueCents + 50)} label="+">
            <PlusIcon />
          </StepperBtn>
        </div>
      </div>
    </div>
  )
}

/** Bottom sheet per modificare i buoni di una spesa (in corso o conclusa). */
export function EditBuoniSheet({
  open,
  onClose,
  buoni,
  valueCents,
  onSave,
}: {
  open: boolean
  onClose: () => void
  /** Valori correnti, usati come punto di partenza a ogni apertura. */
  buoni: number
  valueCents: number
  onSave: (buoni: number, valueCents: number) => void
}) {
  const { t } = useTranslation()
  const [draftBuoni, setDraftBuoni] = useState(buoni)
  const [draftVal, setDraftVal] = useState(valueCents)

  const [prevOpen, setPrevOpen] = useState(open)

  // Riparte dai valori correnti a ogni apertura (aggiornamento in render, niente effect).
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setDraftBuoni(buoni)
      setDraftVal(valueCents)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[14px]">
        {t('spesa.editBuoniTitle')}
      </div>
      <BuoniSteppers buoni={draftBuoni} valueCents={draftVal} onBuoni={setDraftBuoni} onValue={setDraftVal} />
      <button
        onClick={() => onSave(draftBuoni, draftVal)}
        className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[17px] rounded-[18px] active:scale-[.98] transition-transform"
      >
        {t('common.save')}
      </button>
    </BottomSheet>
  )
}

function StepperBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.08)] active:opacity-50"
    >
      {children}
    </button>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
