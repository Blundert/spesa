import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { categoryLabel } from '../i18n'
import { formatCentsPlain } from '../lib/money'
import { useListItems, useAddNewItemToList, useAddToList, useRemoveFromList, useUpdateListQuantity, useClearList } from '../hooks/useListItems'
import { toast } from 'sonner'
import { useCategories, useItems, useSupermarkets } from '../hooks/useItems'
import { compareNames, normalizeName } from '../lib/normalize'
import { pickQuickChips, pickUsualItemIds } from '../lib/listSuggestions'
import { BASE_ITEMS } from '../lib/baseItems'
import { BottomSheet } from '../components/BottomSheet'
import { SectionTitle } from '../components/SectionTitle'
import { useActiveList, useUsualItems } from '../hooks/useShoppingLists'
import { ListTabs } from '../components/ListTabs'
import { ListEditSheet } from '../components/ListEditSheet'
import { activeLists, setActiveListId } from '../lib/activeList'

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
  const [showClear, setShowClear] = useState(false)

  // Pannello lista: 'new' crea, 'edit' modifica la lista aperta.
  const [listSheet, setListSheet] = useState<'new' | 'edit' | null>(null)

  const { lists, list } = useActiveList()
  const tabs = activeLists(lists)
  const listId = list?.id
  const { data: listItems = [] } = useListItems(listId)
  const { data: usualItems = [] } = useUsualItems(listId)
  const { data: supermarkets = [] } = useSupermarkets()
  const supermarketNames = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0
  const addNewItem = useAddNewItemToList(altroId)
  const addToList = useAddToList()
  const removeFromList = useRemoveFromList()
  const clearList = useClearList()
  const updateListQuantity = useUpdateListQuantity()

  // Build category map id → name
  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, categoryLabel(t, c.name)]))

  // Group by category (categorie già in ordine alfabetico; voci in ordine alfabetico)
  const sortedListItems = [...listItems].sort((a, b) => compareNames(a.itemName, b.itemName))
  const grouped = categories
    .map((cat) => {
      const catItems = sortedListItems.filter((li) => li.itemCategoryId === cat.id)
      return { cat, items: catItems }
    })
    .filter(({ items }) => items.length > 0)

  // Also add uncategorized items (categoryId not in categories)
  const catIds = new Set(categories.map((c) => c.id))
  const otherItems = sortedListItems.filter((li) => !catIds.has(li.itemCategoryId))
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

  // Spesa solita della lista: i suoi 8 prodotti più comprati, non già in lista.
  // Una lista senza spese alle spalle non la propone.
  const inListIds = new Set(listItems.map((li) => li.itemId))
  const itemById = new Map(items.map((it) => [it.id ?? 0, it]))
  const templateSuggestions =
    listItems.length < 3
      ? pickUsualItemIds({
          custom: list?.usualItemIds,
          usual: usualItems,
          inListIds,
          knownIds: new Set(itemById.keys()),
        }).map((itemId) => ({ itemId, name: itemById.get(itemId)?.name ?? '' }))
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

  // Chip rapide quando l'input è vuoto: quelli scelti per la lista, altrimenti i più comprati.
  const customQuick: Suggestion[] | undefined = list?.quickItemIds
    ?.map((id) => itemById.get(id))
    .filter((it): it is NonNullable<typeof it> => it !== undefined)
    .map((it) => ({ name: it.name, categoryId: it.categoryId, purchaseCount: it.purchaseCount ?? 0 }))
  const quick: Suggestion[] = addInput
    ? []
    : pickQuickChips({
        pool: Array.from(pool.values()),
        custom: customQuick,
        isInList: (name) => inListNorm.has(normalizeName(name)),
        autoLimit: 6,
      })

  const exactInPool = pool.has(query)

  const handleAdd = (name?: string, categoryId?: number) => {
    const finalName = (name ?? addInput).trim()
    if (!finalName || listId === undefined) return
    const match = categoryId === undefined ? pool.get(normalizeName(finalName)) : undefined
    addNewItem.mutate({ listId, name: finalName, categoryId: categoryId ?? match?.categoryId })
    setAddInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      {/* Header — menu button is in AppShell */}
      <div className="flex items-center justify-between px-1 pt-2 pb-[18px]">
        <SectionTitle active="lista" />
        {listItems.length > 0 && (
          <button onClick={() => setShowClear(true)} className="text-[15px] text-t-muted px-1 active:opacity-50">
            {t('lista.clear')}
          </button>
        )}
      </div>

      <ListTabs
        lists={tabs}
        activeId={listId}
        supermarketNames={supermarketNames}
        onSelect={setActiveListId}
        onEdit={() => setListSheet('edit')}
        onCreate={() => setListSheet('new')}
      />

      {/* Add input */}
      <div className="flex items-center gap-2.5 bg-t-surface rounded-2xl px-[18px] py-4 mb-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <input
          ref={inputRef}
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={t('lista.addPlaceholder')}
          className="flex-1 border-none outline-none bg-transparent text-base text-t-fg placeholder:text-t-muted"
        />
      </div>

      {/* Autocomplete (input non vuoto) */}
      {addInput.trim() && (
        <div className="bg-t-surface rounded-2xl overflow-hidden mb-3 divide-y divide-t-line shadow-[0_2px_12px_rgba(0,0,0,.05)]">
          {matches.map((p) => (
            <button
              key={p.name}
              onClick={() => handleAdd(p.name, p.categoryId)}
              className="w-full flex items-center justify-between px-[18px] py-[13px] text-left active:bg-t-surface2"
            >
              <span className="text-base text-t-fg">{p.name}</span>
              <span className="text-[12px] text-t-muted">{catMap[p.categoryId] ?? t('categories.5')}</span>
            </button>
          ))}
          {!exactInPool && (
            <button
              onClick={() => handleAdd()}
              className="w-full flex items-center justify-between px-[18px] py-[13px] text-left active:bg-t-surface2"
            >
              <span className="text-base text-t-fg">{t('lista.addNamed', { name: addInput.trim() })}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className="flex-none px-[14px] py-2 bg-t-surface border border-t-line rounded-full text-sm text-t-text3 active:bg-t-surface3"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Template spesa solita */}
      {templateSuggestions.length > 0 && (
        <div className="bg-t-surface rounded-[20px] px-[18px] py-[15px] mb-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-normal text-t-fg mb-[3px]">{t('lista.templateTitle')}</div>
            <div className="text-[12px] text-t-muted truncate">
              {templateSuggestions
                .slice(0, 5)
                .map((s) => s.name)
                .join(' · ')}
              {templateSuggestions.length > 5 && ' · …'}
            </div>
          </div>
          <button
            onClick={() => {
              if (listId === undefined) return
              templateSuggestions.forEach((s) => addToList.mutate({ listId, itemId: s.itemId }))
            }}
            className="flex-none bg-t-accent text-t-on text-[14px] px-4 py-[9px] rounded-full active:opacity-70"
          >
            {t('lista.templateLoad')}
          </button>
        </div>
      )}

      {/* Grouped list */}
      {grouped.map(({ cat, items: catItems }) => (
        <div key={cat.id} className="mb-[18px]">
          <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
            {categoryLabel(t, cat.name)}
          </div>
          <div className="bg-t-surface rounded-[20px] overflow-hidden">
            {catItems.map((li, i) => (
              <div
                key={li.id}
                className="flex items-center gap-[13px] px-[18px] py-4"
                style={{ borderBottom: i < catItems.length - 1 ? '1px solid var(--t-line)' : 'none' }}
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
                    className="w-7 h-7 rounded-full bg-t-bg flex items-center justify-center active:bg-t-line4"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="text-[15px] text-t-fg min-w-[18px] text-center tabular-nums">{li.quantity}</span>
                  <button
                    onClick={() => { if (li.id !== undefined) updateListQuantity.mutate({ id: li.id, quantity: li.quantity + 1 }) }}
                    aria-label="+"
                    className="w-7 h-7 rounded-full bg-t-bg flex items-center justify-center active:bg-t-line4"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>

                {/* Name + sub */}
                <div className="flex-1 min-w-0">
                  <div className="text-base text-t-fg truncate">{li.itemName}</div>
                  <div className="text-[12px] text-t-muted mt-0.5">
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t-chev)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}

      {listItems.length === 0 && (
        <div className="text-center py-16 text-t-muted text-sm">
          {t('lista.empty')}
        </div>
      )}

      {/* Conferma svuota lista */}
      <BottomSheet open={showClear} onClose={() => setShowClear(false)}>
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-2">{t('lista.clearConfirmTitle', { name: list?.name })}</div>
        <div className="text-[14px] text-t-muted px-0.5 pb-6">
          {t('lista.clearConfirmBody', { count: listItems.length })}
        </div>
        <button
          onClick={() => {
            if (listId !== undefined) clearList.mutate(listId, { onSuccess: () => toast(t('lista.cleared')) })
            setShowClear(false)
          }}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('lista.clearConfirm')}
        </button>
        <button
          onClick={() => setShowClear(false)}
          className="w-full bg-t-bg text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Nuova lista / modifica della lista aperta */}
      <ListEditSheet
        open={listSheet !== null}
        onClose={() => setListSheet(null)}
        list={listSheet === 'edit' ? (list ?? null) : null}
        canArchive={tabs.length > 1}
        supermarkets={supermarkets}
      />

      {/* Conferma rimuovi dalla lista */}
      <BottomSheet open={pendingListRemove !== null} onClose={() => setPendingListRemove(null)}>
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-6">{t('spesa.removeListConfirmTitle')}</div>
        <button
          onClick={() => {
            if (pendingListRemove !== null) removeFromList.mutate(pendingListRemove)
            setPendingListRemove(null)
          }}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('spesa.removeListConfirm')}
        </button>
        <button
          onClick={() => setPendingListRemove(null)}
          className="w-full bg-t-bg text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </div>
  )
}
