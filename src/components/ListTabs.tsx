import { useTranslation } from 'react-i18next'
import type { ShoppingList } from '../db/types'

// Schede delle liste sotto il titolo: la attiva sottolineata con ⌄ (ritoccandola si modifica),
// le altre grigie; il supermercato preimpostato accanto al nome, "+" per crearne una.
export function ListTabs({
  lists,
  activeId,
  supermarketNames,
  onSelect,
  onEdit,
  onCreate,
}: {
  lists: ShoppingList[]
  activeId: number | undefined
  supermarketNames: Record<number, string>
  onSelect: (id: number) => void
  onEdit: () => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  return (
    <div
      data-tour="list-tabs"
      className="flex items-end gap-5 overflow-x-auto -mt-2 mb-[18px] px-1.5 border-b border-[#E0E0DD] [scrollbar-width:none]"
    >
      {lists.map((l) => {
        const active = l.id === activeId
        const store = l.supermarketId !== null ? supermarketNames[l.supermarketId] : undefined
        return (
          <button
            key={l.id}
            onClick={() => (active ? onEdit() : onSelect(l.id as number))}
            aria-label={active ? t('lists.edit', { name: l.name }) : undefined}
            className={`flex-none whitespace-nowrap pt-1.5 pb-2.5 text-[15px] active:opacity-50 ${
              active ? 'text-[#2A2A2C] border-b-2 border-[#2A2A2C] -mb-px' : 'text-[#9B9B9F]'
            }`}
          >
            {l.name}
            {active && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" className="inline-block ml-1 align-[-1px]">
                <path d="M6 9l6 6 6-6" />
              </svg>
            )}
            {store && <span className="text-[12px] text-[#9B9B9F]"> · {store}</span>}
          </button>
        )
      })}
      <button
        onClick={onCreate}
        aria-label={t('lists.newList')}
        className="flex-none pt-1 pb-2.5 px-1 text-[20px] leading-none text-[#9B9B9F] active:opacity-50"
      >
        +
      </button>
    </div>
  )
}
