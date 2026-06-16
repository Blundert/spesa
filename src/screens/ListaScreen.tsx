import { useState, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { currentISOWeek } from '../lib/date'
import { formatCentsPlain } from '../lib/money'
import { useListItems, useAddNewItemToList } from '../hooks/useListItems'
import { useSessionsByWeek } from '../hooks/useShopping'
import { useCategories, useItems } from '../hooks/useItems'
import { normalizeName } from '../lib/normalize'
import { BASE_ITEMS } from '../lib/baseItems'
import { qk } from '../db/queryKeys'
import { db } from '../db/db'
import { useQuery } from '@tanstack/react-query'

interface Suggestion {
  name: string
  categoryId: number
}

const isoWeek = currentISOWeek()

function usePurchasesForWeek() {
  return useQuery({
    queryKey: qk.purchasesForWeek(isoWeek),
    queryFn: async () => {
      const sessions = await db.sessions.where('isoWeek').equals(isoWeek).toArray()
      if (!sessions.length) return []
      const all = await Promise.all(
        sessions.map((s) => db.purchases.where('sessionId').equals(s.id as number).toArray()),
      )
      return all.flat()
    },
  })
}

export function ListaScreen() {
  const [addInput, setAddInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: listItems = [] } = useListItems()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const { data: purchases = [] } = usePurchasesForWeek()
  const { data: sessions = [] } = useSessionsByWeek(isoWeek)

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0
  const addNewItem = useAddNewItemToList(altroId)

  // "Preso" solo per gli acquisti della spesa in corso (sessione non finita): senza
  // questa restrizione un item già comprato prima in settimana risulterebbe subito preso,
  // perché gli item sono deduplicati e riusano lo stesso id.
  const activeSession = sessions.find((s) => s.finishedAt === null)
  const purchasedItemIds = new Set(
    activeSession
      ? purchases.filter((p) => p.sessionId === activeSession.id).map((p) => p.itemId)
      : [],
  )

  // Build category map id → name
  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, c.name]))

  // Group by category, sorted items with checked last
  const grouped = categories
    .map((cat) => {
      const items = listItems
        .filter((li) => li.itemCategoryId === cat.id)
        .sort((a, b) => {
          const aChecked = purchasedItemIds.has(a.itemId) ? 1 : 0
          const bChecked = purchasedItemIds.has(b.itemId) ? 1 : 0
          return aChecked - bChecked
        })
      return { cat, items }
    })
    .filter(({ items }) => items.length > 0)

  // Also add uncategorized items (categoryId not in categories)
  const catIds = new Set(categories.map((c) => c.id))
  const otherItems = listItems.filter((li) => !catIds.has(li.itemCategoryId))
  if (otherItems.length > 0) {
    grouped.push({ cat: { id: 0, name: 'Altro', sortOrder: 99 }, items: otherItems })
  }

  // Pool autocomplete: articoli base predefiniti + già usati, deduplicati per nome
  // normalizzato. Gli item esistenti sovrascrivono i base (mantengono la loro categoria).
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const pool = new Map<string, Suggestion>()
  for (const b of BASE_ITEMS) {
    pool.set(normalizeName(b.name), {
      name: b.name,
      categoryId: catIdByName.get(b.category) ?? altroId,
    })
  }
  for (const it of items) {
    pool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId })
  }

  const inListNorm = new Set(listItems.map((li) => normalizeName(li.itemName)))
  const query = normalizeName(addInput)

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

  // Chip rapide quando l'input è vuoto: qualche suggerimento non ancora in lista.
  const quick: Suggestion[] = addInput
    ? []
    : Array.from(pool.values())
        .filter((p) => !inListNorm.has(normalizeName(p.name)))
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
      <div className="flex items-center justify-between px-1 pt-2 pb-[18px]">
        <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">Lista</span>
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
          placeholder="Aggiungi un oggetto…"
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
              <span className="text-[12px] text-[#9B9B9F]">{catMap[p.categoryId] ?? 'Altro'}</span>
            </button>
          ))}
          {!exactInPool && (
            <button
              onClick={() => handleAdd()}
              className="w-full flex items-center justify-between px-[18px] py-[13px] text-left active:bg-[#F6F6F4]"
            >
              <span className="text-base text-[#2A2A2C]">Aggiungi “{addInput.trim()}”</span>
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

      {/* Grouped list */}
      {grouped.map(({ cat, items }) => (
        <div key={cat.id} className="mb-[18px]">
          <div className="text-[12px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1.5 pb-[13px]">
            {catMap[cat.id ?? 0] ?? cat.name}
          </div>
          <div className="bg-white rounded-[20px] overflow-hidden">
            {items.map((li, i) => {
              const isChecked = purchasedItemIds.has(li.itemId)
              return (
                <div
                  key={li.id}
                  className="flex items-center gap-[13px] px-[18px] py-4"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid #ECECEC' : 'none' }}
                >
                  {/* Checkbox circle */}
                  <button
                    onClick={() => isChecked ? null : null}
                    className="w-6 h-6 flex-none rounded-full flex items-center justify-center"
                    style={{
                      border: `2px solid ${isChecked ? '#2A2A2C' : '#D8D8D6'}`,
                      background: isChecked ? '#2A2A2C' : 'transparent',
                    }}
                  >
                    {isChecked && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                    )}
                  </button>

                  {/* Name + sub */}
                  <div className="flex-1" style={{ opacity: isChecked ? 0.42 : 1 }}>
                    <div className="text-base text-[#2A2A2C]" style={{ textDecoration: isChecked ? 'line-through' : 'none' }}>
                      {li.itemName}
                    </div>
                    <div className="text-[12px] text-[#9B9B9F] mt-0.5">
                      {isChecked
                        ? `Preso`
                        : li.suggestedPriceCents !== null
                        ? `~ €${formatCentsPlain(li.suggestedPriceCents)}`
                        : 'da prendere'}
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
              )
            })}
          </div>
        </div>
      ))}

      {listItems.length === 0 && (
        <div className="text-center py-16 text-[#9B9B9F] text-sm">
          La lista è vuota. Aggiungi qualcosa sopra.
        </div>
      )}
    </div>
  )
}
