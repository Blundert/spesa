import type { ReactNode } from 'react'

/** Gruppo della spesa: intestazione in maiuscolo e card arrotondata con le righe dentro. */
export function ShopGroup({ title, className, children }: { title: string; className: string; children: ReactNode }) {
  return (
    <div className={className}>
      <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">{title}</div>
      <div className="bg-t-surface rounded-[20px] overflow-hidden">{children}</div>
    </div>
  )
}

/** Riga di un gruppo: separatore sotto, tranne l'ultima. `padding` è la classe del padding verticale. */
export function ShopRow({ last, padding, children }: { last: boolean; padding: string; children: ReactNode }) {
  return (
    <div
      className={`flex items-center px-[18px] ${padding}`}
      style={{ borderBottom: last ? 'none' : '1px solid var(--t-line)' }}
    >
      {children}
    </div>
  )
}

/** Cerchio vuoto: voce ancora da prendere. */
export function OpenCircle() {
  return <div className="w-6 h-6 flex-none rounded-full border-2 border-t-line2" />
}

/** Cerchio pieno con la spunta: voce nel carrello; toccarlo la rimette tra quelle da prendere. */
export function CheckedCircle({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-6 h-6 flex-none rounded-full bg-t-accent flex items-center justify-center active:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l4 4 10-10" />
      </svg>
    </button>
  )
}
