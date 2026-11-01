import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from './Modal'
import { evaluate, centsToExpr } from '../../lib/calc'
import { normalizeAmountInput } from '../../lib/amountInput'
import { formatCents, formatCentsPlain } from '../../lib/money'

interface AmountModalProps {
  open: boolean
  onClose: () => void
  /** Titolo del dialogo (es. nome prodotto). */
  label: string
  confirmLabel?: string
  initialCents?: number
  showQuantity?: boolean
  initialQuantity?: number
  /** Ultimo prezzo pagato: undefined = non mostrare, null = primo acquisto. */
  lastPriceCents?: number | null
  secondaryAction?: { label: string; onTap: () => void }
  onConfirm: (cents: number, quantity: number) => void
}

/** Dialogo desktop per inserire un importo: campo di testo che accetta anche espressioni (2*1,50). */
export function AmountModal(props: AmountModalProps) {
  // Il corpo si rimonta a ogni apertura, così riparte dai valori iniziali.
  return (
    <Modal open={props.open} onClose={props.onClose} title={props.label} width={420}>
      <AmountBody {...props} />
    </Modal>
  )
}

function AmountBody({
  onClose,
  confirmLabel,
  initialCents = 0,
  showQuantity = false,
  initialQuantity = 1,
  lastPriceCents,
  secondaryAction,
  onConfirm,
}: AmountModalProps) {
  const { t } = useTranslation()
  const [expr, setExpr] = useState(() => centsToExpr(initialCents))
  const [quantity, setQuantity] = useState(initialQuantity)
  const result = evaluate(expr)
  const valid = result !== null
  const isExpr = /[+−×÷()%]/.test(expr)

  let hint: string | null = null
  if (lastPriceCents !== undefined && result !== null && result > 0) {
    if (lastPriceCents === null) hint = t('spesa.priceFirstBuy')
    else if (result === lastPriceCents) hint = t('spesa.priceSame')
    else {
      const diff = formatCentsPlain(Math.abs(result - lastPriceCents))
      const last = formatCentsPlain(lastPriceCents)
      hint = t(result > lastPriceCents ? 'spesa.priceHigher' : 'spesa.priceLower', { diff, last })
    }
  }

  const submit = () => {
    if (result !== null) onConfirm(result, quantity)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', borderBottom: '1px solid var(--t-line)', paddingBottom: '8px' }}>
        <span style={{ fontSize: '28px', color: 'var(--t-faint)', marginRight: '6px' }}>€</span>
        <input
          autoFocus
          inputMode="decimal"
          value={expr}
          placeholder="0"
          aria-label={t('desktop.spesa.amount')}
          onChange={(e) => setExpr(normalizeAmountInput(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '40px',
            fontWeight: 300,
            color: valid ? 'var(--t-fg)' : 'var(--t-faint)',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
      </div>
      <div style={{ minHeight: '20px', marginTop: '8px', fontSize: '13px', color: 'var(--t-muted)' }}>
        {isExpr && result !== null && `= ${formatCents(result)}`}
        {!valid && t('desktop.spesa.invalidAmount')}
      </div>
      <div style={{ minHeight: '20px', fontSize: '13px', color: 'var(--t-muted)' }}>{hint}</div>
      <div style={{ fontSize: '12px', color: 'var(--t-faint)', marginBottom: '16px' }}>{t('desktop.spesa.amountHelp')}</div>

      {showQuantity && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--t-surface2)',
            borderRadius: '12px',
            padding: '10px 16px',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '15px', color: 'var(--t-fg)' }}>{t('common.quantity')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button aria-label="-" onClick={() => setQuantity((q) => Math.max(1, q - 1))} style={stepBtn}>
              −
            </button>
            <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '17px', fontVariantNumeric: 'tabular-nums' }}>
              {quantity}
            </span>
            <button aria-label="+" onClick={() => setQuantity((q) => q + 1)} style={stepBtn}>
              +
            </button>
          </div>
        </div>
      )}

      {secondaryAction && (
        <button onClick={secondaryAction.onTap} style={{ ...btn, background: 'var(--t-bg)', color: 'var(--t-fg)', marginBottom: '8px' }}>
          {secondaryAction.label}
        </button>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onClose} style={{ ...btn, background: 'var(--t-bg)', color: 'var(--t-fg)', flex: 1 }}>
          {t('common.cancel')}
        </button>
        <button
          onClick={submit}
          disabled={!valid}
          style={{ ...btn, flex: 2, background: 'var(--t-accent)', color: 'var(--t-on)', opacity: valid ? 1 : 0.4 }}
        >
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </div>
  )
}

const btn = {
  width: '100%',
  border: 'none',
  borderRadius: '12px',
  padding: '13px 16px',
  fontSize: '15px',
  cursor: 'pointer',
} as const

const stepBtn = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--t-surface)',
  fontSize: '18px',
  cursor: 'pointer',
  color: 'var(--t-fg)',
} as const
