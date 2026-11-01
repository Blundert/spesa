import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ShoppingList } from '../db/types'

// Riga "Lista  Settimanale · Esselunga ›" nella scheda di Nuova spesa: toccandola si aprono
// le altre liste attive sotto, una sola scelta.
export function ListPickerRow({
  lists,
  value,
  onChange,
  supermarketNames,
}: {
  lists: ShoppingList[]
  value: number | undefined
  onChange: (id: number) => void
  supermarketNames: Record<number, string>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = lists.find((l) => l.id === value)
  const store = (l: ShoppingList | undefined) =>
    l?.supermarketId != null ? supermarketNames[l.supermarketId] : undefined

  return (
    <div className="border-b border-t-line3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-[14px] text-left active:opacity-50"
      >
        <span className="text-base text-t-fg flex-none">{t('lists.label')}</span>
        <span className="min-w-0 truncate text-base text-t-fg">
          {current?.name}
          {store(current) && <span className="text-[14px] text-t-muted"> · {store(current)}</span>}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-faint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ml-1.5 align-[-1px] transition-transform ${open ? 'rotate-90' : ''}`}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-2">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                onChange(l.id as number)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between py-[10px] pl-3 text-left active:opacity-50"
            >
              <span className="text-[15px] text-t-fg">
                {l.name}
                {store(l) && <span className="text-[13px] text-t-muted"> · {store(l)}</span>}
              </span>
              {l.id === value && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
