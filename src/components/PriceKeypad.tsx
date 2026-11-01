import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer } from 'vaul'
import { formatCentsPlain } from '../lib/money'
import {
  backspace,
  centsToExpr,
  evaluate,
  getKeypadMode,
  pressKey,
  setKeypadMode,
  type CalcKey,
  type KeypadMode,
} from '../lib/calc'

interface PriceKeypadProps {
  open: boolean
  onClose: () => void
  /** Label sopra il display (es. nome prodotto). */
  label: string
  /** Testo del bottone di conferma. */
  confirmLabel?: string
  /** Valore iniziale in centesimi. */
  initialCents?: number
  /** Mostra lo stepper quantità. */
  showQuantity?: boolean
  /** Quantità iniziale (default 1). */
  initialQuantity?: number
  /** Ultimo prezzo pagato (per mostrare la variazione). undefined = non mostrare. null = primo acquisto. */
  lastPriceCents?: number | null
  onConfirm: (cents: number, quantity: number) => void
  /** Azione secondaria opzionale (es. "usa il totale calcolato"), mostrata sopra il bottone di conferma. */
  secondaryAction?: { label: string; onTap: () => void }
}

export function PriceKeypad({
  open,
  onClose,
  label,
  confirmLabel,
  initialCents = 0,
  showQuantity = false,
  initialQuantity = 1,
  lastPriceCents,
  onConfirm,
  secondaryAction,
}: PriceKeypadProps) {
  const { t } = useTranslation()
  const confirmText = confirmLabel ?? t('common.confirm')
  const [mode, setMode] = useState<KeypadMode>(getKeypadMode)
  const [cents, setCents] = useState(initialCents)
  const [quantity, setQuantity] = useState(initialQuantity)
  // Modalità calcolatrice: espressione digitata e ultimo risultato valido.
  const [expr, setExpr] = useState(() => centsToExpr(initialCents))
  const [lastValid, setLastValid] = useState(initialCents)

  // All'apertura (o se cambiano i valori iniziali mentre è aperto) riparte da quelli:
  // stato aggiornato durante il render invece che in un effetto.
  const resetKey = open ? `${initialCents}:${initialQuantity}` : null
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    if (open) {
      setMode(getKeypadMode())
      setCents(initialCents)
      setQuantity(initialQuantity)
      setExpr(centsToExpr(initialCents))
      setLastValid(initialCents)
    }
  }

  const result = mode === 'calc' ? evaluate(expr) : cents
  // Con un'espressione non valida si mostra l'ultimo risultato valido, in grigio.
  const shownCents = result ?? lastValid
  const valid = result !== null

  const setCalc = (next: string) => {
    setExpr(next)
    const r = evaluate(next)
    if (r !== null) setLastValid(r)
  }

  // Il valore passa da una modalità all'altra.
  const switchMode = (next: KeypadMode) => {
    if (next === mode) return
    if (next === 'calc') {
      setExpr(centsToExpr(cents))
      setLastValid(cents)
    } else {
      setCents(shownCents)
    }
    setMode(next)
    setKeypadMode(next)
  }

  const digit = (d: number) => setCents((c) => Math.min(c * 10 + d, 9_999_999))
  const dbl = () => setCents((c) => Math.min(c * 100, 9_999_999))
  const del = () => setCents((c) => Math.floor(c / 10))

  const keys: Array<{ label: string; onTap: () => void }> = [
    { label: '1', onTap: () => digit(1) },
    { label: '2', onTap: () => digit(2) },
    { label: '3', onTap: () => digit(3) },
    { label: '4', onTap: () => digit(4) },
    { label: '5', onTap: () => digit(5) },
    { label: '6', onTap: () => digit(6) },
    { label: '7', onTap: () => digit(7) },
    { label: '8', onTap: () => digit(8) },
    { label: '9', onTap: () => digit(9) },
    { label: '00', onTap: dbl },
    { label: '0', onTap: () => digit(0) },
    { label: '⌫', onTap: del },
  ]

  const calcKey = (k: CalcKey) => ({ label: k, onTap: () => setCalc(pressKey(expr, k)) })
  const calcKeys: Array<{ label: string; onTap: () => void; op?: boolean; danger?: boolean; aria?: string }> = [
    calcKey('7'),
    calcKey('8'),
    calcKey('9'),
    { ...calcKey('('), op: true },
    { ...calcKey(')'), op: true },
    calcKey('4'),
    calcKey('5'),
    calcKey('6'),
    { ...calcKey('×'), op: true },
    { ...calcKey('÷'), op: true },
    calcKey('1'),
    calcKey('2'),
    calcKey('3'),
    { ...calcKey('+'), op: true },
    { ...calcKey('−'), op: true },
    calcKey(','),
    calcKey('0'),
    { label: '⌫', onTap: () => setCalc(backspace(expr)), aria: t('keypad.backspace') },
    { ...calcKey('%'), op: true },
    { label: 'C', onTap: () => setCalc(''), op: true, danger: true, aria: t('keypad.clear') },
  ]

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} dismissible>
      <Drawer.Portal>
        {/* Velo con angoli concentrici agli sheet: vedi BottomSheet. */}
        <Drawer.Overlay className="fixed inset-0 z-[80] overflow-hidden">
          <div className="absolute inset-y-0 -inset-x-3 bg-black/32 rounded-t-[42px]" />
        </Drawer.Overlay>
        <Drawer.Content className="fixed bottom-0 z-[90] w-full max-w-[430px] left-1/2 -translate-x-1/2 bg-t-surface rounded-t-[30px] px-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none">
          <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-t-line2 mx-auto mb-4" />

          {/* Modalità + nome */}
          <div className="relative flex items-center justify-center min-h-[30px] mb-[6px]">
            <div className="absolute left-0 flex bg-t-bg rounded-full p-[3px]" role="group">
              <ModeButton active={mode === 'simple'} label={t('keypad.simple')} onTap={() => switchMode('simple')}>
                123
              </ModeButton>
              <ModeButton active={mode === 'calc'} label={t('keypad.calculator')} onTap={() => switchMode('calc')}>
                ±×÷
              </ModeButton>
            </div>
            <div className="text-sm text-t-muted px-[100px] truncate">{label}</div>
          </div>

          {/* Display */}
          <div className="text-center pb-[18px]">
            {/* Espressione (solo calcolatrice; la riga c'è sempre così l'altezza non cambia) */}
            <div
              className={`min-h-[22px] whitespace-nowrap overflow-hidden text-t-muted tracking-[.2px] ${expr.length > 22 ? 'text-[14px]' : 'text-[17px]'}`}
            >
              {mode === 'calc' ? formatExpr(expr) : ''}
            </div>
            <div className={`flex items-baseline justify-center ${valid ? 'text-t-fg' : 'text-t-faint'}`}>
              <span className="text-[30px] font-normal text-t-faint mr-1">€</span>
              <span className="text-[62px] font-light leading-[.95] tabular-nums tracking-[-1.5px]">
                {formatCentsPlain(shownCents)}
              </span>
            </div>
            <PriceCompareRow lastPriceCents={lastPriceCents} cents={shownCents} />
          </div>

          {/* Quantità */}
          {showQuantity && (
            <div className="flex items-center justify-between bg-t-bg rounded-2xl px-4 py-3 mb-[14px]">
              <span className="text-base text-t-fg">{t('common.quantity')}</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="-"
                  className="w-8 h-8 rounded-full bg-t-surface flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.08)] active:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="text-[18px] font-normal text-t-fg min-w-[20px] text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="+"
                  className="w-8 h-8 rounded-full bg-t-surface flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.08)] active:opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Keys */}
          {mode === 'simple' ? (
            <div className="grid grid-cols-3 gap-[10px] mb-[14px]">
              {keys.map((k) => (
                <button
                  key={k.label}
                  onClick={k.onTap}
                  className="h-14 flex items-center justify-center bg-t-bg rounded-2xl text-2xl font-normal text-t-fg active:bg-t-line4 transition-colors select-none"
                >
                  {k.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-[10px] mb-[14px]">
              {calcKeys.map((k) => (
                <button
                  key={k.label}
                  onClick={k.onTap}
                  aria-label={k.aria}
                  className={`h-14 flex items-center justify-center rounded-2xl text-2xl font-normal transition-colors select-none ${
                    k.op ? 'bg-t-line4 active:bg-t-line2' : 'bg-t-bg active:bg-t-line4'
                  } ${k.danger ? 'text-t-danger' : 'text-t-fg'}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          )}

          {secondaryAction && (
            <button
              onClick={() => {
                secondaryAction.onTap()
                onClose()
              }}
              className="w-full bg-t-bg text-t-fg text-[15px] font-normal py-[14px] rounded-[20px] mb-[10px] active:scale-[.98] transition-transform"
            >
              {secondaryAction.label}
            </button>
          )}

          <button
            onClick={() => {
              if (result === null) return
              onConfirm(result, quantity)
              onClose()
            }}
            disabled={!valid}
            className="w-full bg-t-accent text-t-on text-[17px] font-normal py-[18px] rounded-[20px] active:scale-[.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
          >
            {confirmText} €{formatCentsPlain(shownCents)}
            {quantity > 1 ? ` ×${quantity}` : ''}
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function ModeButton({
  active,
  label,
  onTap,
  children,
}: {
  active: boolean
  label: string
  onTap: () => void
  children: string
}) {
  return (
    <button
      onClick={onTap}
      aria-label={label}
      aria-pressed={active}
      className={`text-[13px] px-[11px] py-[5px] rounded-full transition-colors ${
        active ? 'bg-t-surface text-t-fg shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-t-muted'
      }`}
    >
      {children}
    </button>
  )
}

/** Spazi attorno alle operazioni, come nel mockup: "(4,50 − 30%) × 2". */
function formatExpr(expr: string): string {
  return expr.replace(/[+−×÷]/g, (op) => ` ${op} `)
}

function PriceCompareRow({
  lastPriceCents,
  cents,
}: {
  lastPriceCents: number | null | undefined
  cents: number
}) {
  const { t } = useTranslation()
  if (lastPriceCents === undefined || cents === 0) return null
  if (lastPriceCents === null) {
    return <div className="text-[13px] text-t-muted mt-2">{t('spesa.priceFirstBuy')}</div>
  }
  const diff = cents - lastPriceCents
  if (diff === 0) {
    return <div className="text-[13px] text-t-muted mt-2">{t('spesa.priceSame')}</div>
  }
  if (diff > 0) {
    return (
      <div className="text-[13px] mt-2" style={{ color: 'var(--t-danger)' }}>
        {t('spesa.priceHigher', { diff: formatCentsPlain(diff), last: formatCentsPlain(lastPriceCents) })}
      </div>
    )
  }
  return (
    <div className="text-[13px] mt-2" style={{ color: 'var(--t-good2)' }}>
      {t('spesa.priceLower', { diff: formatCentsPlain(-diff), last: formatCentsPlain(lastPriceCents) })}
    </div>
  )
}
