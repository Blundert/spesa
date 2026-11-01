import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { formatCentsPlain } from '../lib/money'
import { MIN_BUONO_VALUE_CENTS } from '../lib/buoniSettings'
import { BottomSheet } from './BottomSheet'

/** Card con gli stepper "numero buoni" e "valore buono" (condivisa da Nuova spesa e Modifica buoni). */
export function BuoniSteppers({
  buoni,
  valueCents,
  onBuoni,
  onValue,
  top,
}: {
  buoni: number
  valueCents: number
  onBuoni: (n: number) => void
  onValue: (v: number) => void
  /** Righe extra in cima alla stessa scheda (es. la scelta della lista). */
  top?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-t-surface2 rounded-[18px] px-4 mb-[14px]">
      {top}
      <div className="flex items-center justify-between py-[14px] border-b border-t-line3">
        <span className="text-base text-t-fg">{t('spesa.buoni')}</span>
        <div className="flex items-center gap-4">
          <StepperBtn onClick={() => onBuoni(Math.max(0, buoni - 1))} label="-">
            <MinusIcon />
          </StepperBtn>
          <span className="text-[18px] font-normal text-t-fg min-w-[20px] text-center tabular-nums">
            {buoni}
          </span>
          <StepperBtn onClick={() => onBuoni(buoni + 1)} label="+">
            <PlusIcon />
          </StepperBtn>
        </div>
      </div>
      <div className="flex items-center justify-between py-[14px]">
        <span className="text-base text-t-fg">{t('spesa.buonoValue')}</span>
        <BuonoValueStepper valueCents={valueCents} onValue={onValue} />
      </div>
    </div>
  )
}

/** Stepper −/+ del valore di un buono: passi da €0,50, minimo €0,50. */
export function BuonoValueStepper({ valueCents, onValue }: { valueCents: number; onValue: (v: number) => void }) {
  return (
    <div className="flex items-center gap-4">
      <StepperBtn onClick={() => onValue(Math.max(MIN_BUONO_VALUE_CENTS, valueCents - 50))} label="-">
        <MinusIcon />
      </StepperBtn>
      <span className="text-[18px] font-normal text-t-fg min-w-[54px] text-center tabular-nums">
        €{formatCentsPlain(valueCents)}
      </span>
      <StepperBtn onClick={() => onValue(valueCents + 50)} label="+">
        <PlusIcon />
      </StepperBtn>
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
      <div className="text-[12px] font-normal tracking-[1.4px] text-t-muted uppercase px-0.5 pb-[14px]">
        {t('spesa.editBuoniTitle')}
      </div>
      <BuoniSteppers buoni={draftBuoni} valueCents={draftVal} onBuoni={setDraftBuoni} onValue={setDraftVal} />
      <button
        onClick={() => onSave(draftBuoni, draftVal)}
        className="w-full bg-t-accent text-t-on text-[17px] font-normal py-[17px] rounded-[18px] active:scale-[.98] transition-transform"
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
      className="w-8 h-8 rounded-full bg-t-surface flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.08)] active:opacity-50"
    >
      {children}
    </button>
  )
}

function MinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
