import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { categoryLabel } from '../i18n'
import { formatCentsPlain } from '../lib/money'
import { useListItems, useAddNewItemToList, useRemoveFromList, useUpdateListQuantity } from '../hooks/useListItems'
import { useCategories, useItems } from '../hooks/useItems'
import { normalizeName } from '../lib/normalize'
import { BASE_ITEMS } from '../lib/baseItems'
import { BottomSheet } from '../components/BottomSheet'

interface Suggestion {
  name: string
  categoryId: number
  purchaseCount: number
}

export function ListaScreen() {
  const { t } = useTranslation()
  const [addInput, setAddInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingListRemove, setPendingListRemove] = useState<number | null>(null)

  const { data: listItems = [] } = useListItems()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0
  const addNewItem = useAddNewItemToList(altroId)
  const removeFromList = useRemoveFromList()
  const updateListQuantity = useUpdateListQuantity()

  // Build category map id → name
  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, categoryLabel(t, c.sortOrder, c.name)]))

  // Group by category
  const grouped = categories
    .map((cat) => {
      const catItems = listItems.filter((li) => li.itemCategoryId === cat.id)
      return { cat, items: catItems }
    })
    .filter(({ items }) => items.length > 0)

  // Also add uncategorized items (categoryId not in categories)
  const catIds = new Set(categories.map((c) => c.id))
  const otherItems = listItems.filter((li) => !catIds.has(li.itemCategoryId))
  if (otherItems.length > 0) {
    grouped.push({ cat: { id: 0, name: t('categories.5'), sortOrder: 99 }, items: otherItems })
  }

  // Pool autocomplete: articoli base predefiniti + già usati, deduplicati per nome
  // normalizzato. Gli item esistenti sovrascrivono i base (mantengono la loro categoria).
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const pool = new Map<string, Suggestion>()
  for (const b of BASE_ITEMS) {
    pool.set(normalizeName(b.name), {
      name: b.name,
      categoryId: catIdByName.get(b.category) ?? altroId,
      purchaseCount: 0,
    })
  }
  for (const it of items) {
    pool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId, purchaseCount: it.purchaseCount ?? 0 })
  }

  const inListNorm = new Set(listItems.map((li) => normalizeName(li.itemName)))
  const query = normalizeName(addInput)

  // Template automatico: top-8 articoli per purchaseCount, non già in lista
  const templateSuggestions =
    listItems.length < 3
      ? Array.from(pool.values())
          .filter((p) => p.purchaseCount > 0 && !inListNorm.has(normalizeName(p.name)))
          .sort((a, b) => b.purchaseCount - a.purchaseCount)
          .slice(0, 8)
      : []

  // Match per l'autocomplete (input non vuoto): prima chi inizia col testo, poi alfabetico.
  const matches: Suggestion[] = query
    ? Array.from(pool.values())
        .filter((p) => {
          const n = normalizeName(p.name)
          return !inListNorm.has(n) && n.includes(query)
        })
        .sort((a, b) => {
          const an = normalizeName(a.name)
          const bn = normalizeName(b.name)
          const aStarts = an.startsWith(query) ? 0 : 1
          const bStarts = bn.startsWith(query) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return an.localeCompare(bn)
        })
        .slice(0, 8)
    : []

  // Chip rapide quando l'input è vuoto: i più comprati prima, poi default.
  const quick: Suggestion[] = addInput
    ? []
    : Array.from(pool.values())
        .filter((p) => !inListNorm.has(normalizeName(p.name)))
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 6)

  const exactInPool = pool.has(query)

  const handleAdd = (name?: string, categoryId?: number) => {
    const finalName = (name ?? addInput).trim()
    if (!finalName) return
    const match = categoryId === undefined ? pool.get(normalizeName(finalName)) : undefined
    addNewItem.mutate({ name: finalName, categoryId: categoryId ?? match?.categoryId })
    setAddInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      {/* Header — menu button is in AppShell */}
      <div data-tour="lista-screen" className="flex items-center justify-between px-1 pt-2 pb-[18px]">
        <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('lista.title')}</span>
      </div>

      {/* Add input */}
      <div className="flex items-center gap-2.5 bg-white rounded-2xl px-[18px] py-4 mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          ref={inputRef}
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('lista.addPlaceholder')}
          className="flex-1 border-none outline-none bg-transparent text-base text-[#2A2A2C] placeholder:text-[#9B9B9F]"
        />
      </div>

      {/* Autocomplete (input non vuoto) */}
      {addInput.trim() && (
        <div className="bg-white rounded-2xl overflow-hidden mb-3 divide-y divide-[#ECECEC] shadow-[0_2px_12px_rgba(0,0,0,.05)]">
          {matches.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAdd(p.name, p.categoryId)}
              className="w-full flex items-center justify-between px-[18px] py-[13px] text-left active:bg-[#F6F6F4]"
            >
              <span className="text-base text-[#2A2A2C]">{p.name}</span>
              <span className="text-[12px] text-[#9B9B9F]">{catMap[p.categoryId] ?? t('categories.5')}</span>
            </button>
          ))}
          {!exactInPool && (
            <button
              onClick={() => handleAdd()}
              className="w-full flex items-center justify-between px-[18px] py-[13px] text-left active:bg-[#F6F6F4]"
            >
              <span className="text-base text-[#2A2A2C]">{t('lista.addNamed', { name: addInput.trim() })}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Suggerimenti rapidi (input vuoto) */}
      {quick.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5">
          {quick.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAdd(p.name, p.categoryId)}
              className="flex-none px-[14px] py-2 bg-white border border-[#ECECEC] rounded-full text-sm text-[#5A5A5E] active:bg-[#F0F0EE]"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Template spesa solita */}
      {templateSuggestions.length > 0 && (
        <div className="bg-white rounded-[20px] px-[18px] py-[15px] mb-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-normal text-[#2A2A2C] mb-[3px]">{t('lista.templateTitle')}</div>
            <div className="text-[12px] text-[#9B9B9F] truncate">
              {templateSuggestions
                .slice(0, 5)
                .map((s) => s.name)
                .join(' · ')}
              {templateSuggestions.length > 5 && ' · …'}
            </div>
          </div>
          <button
            onClick={() => {
              templateSuggestions.forEach((s) => addNewItem.mutate({ name: s.name, categoryId: s.categoryId }))
            }}
            className="flex-none bg-[#2A2A2C] text-white text-[14px] px-4 py-[9px] rounded-full active:opacity-70"
          >
            {t('lista.templateLoad')}
          </button>
        </div>
      )}

      {/* Grouped list */}
      {grouped.map(({ cat, items: catItems }) => (
        <div key={cat.id} className="mb-[18px]">
          <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
            {categoryLabel(t, cat.sortOrder, cat.name)}
          </div>
          <div className="bg-white rounded-[20px] overflow-hidden">
            {catItems.map((li, i) => (
              <div
                key={li.id}
                className="flex items-center gap-[13px] px-[18px] py-4"
                style={{ borderBottom: i < catItems.length - 1 ? '1px solid #ECECEC' : 'none' }}
              >
                {/* Stepper quantità */}
                <div className="flex items-center gap-1.5 flex-none">
                  <button
                    onClick={() => {
                      if (li.quantity <= 1) {
                        if (li.id !== undefined) setPendingListRemove(li.id)
                      } else {
                        if (li.id !== undefined) updateListQuantity.mutate({ id: li.id, quantity: li.quantity - 1 })
                      }
                    }}
                    aria-label="-"
                    className="w-7 h-7 rounded-full bg-[#F2F2F0] flex items-center justify-center active:bg-[#E6E6E4]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-[15px] text-[#2A2A2C] min-w-[18px] text-center tabular-nums">{li.quantity}</span>
                  <button
                    onClick={() => { if (li.id !== undefined) updateListQuantity.mutate({ id: li.id, quantity: li.quantity + 1 }) }}
                    aria-label="+"
                    className="w-7 h-7 rounded-full bg-[#F2F2F0] flex items-center justify-center active:bg-[#E6E6E4]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>

                {/* Name + sub */}
                <div className="flex-1 min-w-0">
                  <div className="text-base text-[#2A2A2C] truncate">{li.itemName}</div>
                  <div className="text-[12px] text-[#9B9B9F] mt-0.5">
                    {li.suggestedPriceCents !== null
                      ? `~ €${formatCentsPlain(li.suggestedPriceCents)}`
                      : t('lista.toGet')}
                  </div>
                </div>

                {/* Detail link */}
                <Link
                  to="/item/$itemId"
                  params={{ itemId: String(li.itemId) }}
                  className="w-[30px] h-[30px] flex items-center justify-center flex-none active:opacity-50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C5C5C9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}

      {listItems.length === 0 && (
        <div className="text-center py-16 text-[#9B9B9F] text-sm">
          {t('lista.empty')}
        </div>
      )}

      {/* Conferma rimuovi dalla lista */}
      <BottomSheet open={pendingListRemove !== null} onClose={() => setPendingListRemove(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-6">{t('spesa.removeListConfirmTitle')}</div>
        <button
          onClick={() => {
            if (pendingListRemove !== null) removeFromList.mutate(pendingListRemove)
            setPendingListRemove(null)
          }}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('spesa.removeListConfirm')}
        </button>
        <button
          onClick={() => setPendingListRemove(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </div>
  )
}
