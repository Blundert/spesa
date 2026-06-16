import { useState, useEffect } from 'react'
import { Drawer } from 'vaul'
import { formatCentsPlain } from '../lib/money'

interface PriceKeypadProps {
  open: boolean
  onClose: () => void
  /** Label sopra il display (es. nome prodotto). */
  label: string
  /** Testo del bottone di conferma. */
  confirmLabel?: string
  /** Valore iniziale in centesimi. */
  initialCents?: number
  onConfirm: (cents: number) => void
}

export function PriceKeypad({
  open,
  onClose,
  label,
  confirmLabel = 'Conferma',
  initialCents = 0,
  onConfirm,
}: PriceKeypadProps) {
  const [cents, setCents] = useState(initialCents)

  useEffect(() => {
    if (open) setCents(initialCents)
  }, [open, initialCents])

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

  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/32 z-[80]" />
        <Drawer.Content className="fixed left-0 right-0 bottom-0 z-[90] bg-white rounded-t-[30px] px-[22px] pb-[calc(22px+env(safe-area-inset-bottom))] pt-[10px] shadow-[0_-12px_44px_rgba(0,0,0,.16)] outline-none">
          <Drawer.Handle className="w-[38px] h-[5px] rounded-full bg-[#D8D8D6] mx-auto mb-4" />

          {/* Display */}
          <div className="text-center pb-[18px]">
            <div className="text-sm text-[#9B9B9F] mb-[10px]">{label}</div>
            <div className="flex items-baseline justify-center text-[#2A2A2C]">
              <span className="text-[30px] font-normal text-[#B5B5BA] mr-1">€</span>
              <span className="text-[62px] font-light leading-[.95] tabular-nums tracking-[-1.5px]">
                {formatCentsPlain(cents)}
              </span>
            </div>
          </div>

          {/* Keys */}
          <div className="grid grid-cols-3 gap-[10px] mb-[14px]">
            {keys.map((k) => (
              <button
                key={k.label}
                onClick={k.onTap}
                className="h-14 flex items-center justify-center bg-[#F2F2F0] rounded-2xl text-2xl font-normal text-[#2A2A2C] active:bg-[#E6E6E4] transition-colors select-none"
              >
                {k.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { onConfirm(cents); onClose() }}
            className="w-full bg-[#2A2A2C] text-white text-[17px] font-normal py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
          >
            {confirmLabel} €{formatCentsPlain(cents)}
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
