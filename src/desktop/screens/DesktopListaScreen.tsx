import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { categoryLabel } from '../../i18n'
import { formatCents } from '../../lib/money'
import {
  useListItems,
  useAddNewItemToList,
  useAddToList,
  useRemoveFromList,
  useUpdateListQuantity,
  useClearList,
} from '../../hooks/useListItems'
import { useCategories, useItems, useSupermarkets } from '../../hooks/useItems'
import { compareNames, normalizeName } from '../../lib/normalize'
import { BASE_ITEMS } from '../../lib/baseItems'
import { useActiveList, useUsualItems } from '../../hooks/useShoppingLists'
import { activeLists, setActiveListId } from '../../lib/activeList'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { Modal } from '../components/Modal'
import { ListEditModal } from '../components/ListEditModal'
import { btnDanger, btnSecondary } from '../components/buttonStyles'

interface Suggestion {
  name: string
  categoryId: number
  purchaseCount: number
}

const card = { background: '#fff', borderRadius: '16px', padding: '24px' } as const
const stepBtn = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: 'none',
  background: '#F2F2F0',
  color: '#2A2A2C',
  fontSize: '16px',
  cursor: 'pointer',
  lineHeight: 1,
} as const
const chip = {
  padding: '7px 14px',
  background: '#fff',
  border: '1px solid #ECECEC',
  borderRadius: '999px',
  fontSize: '13px',
  color: '#5A5A5E',
  cursor: 'pointer',
} as const

export function DesktopListaScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [addInput, setAddInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingListRemove, setPendingListRemove] = useState<number | null>(null)
  const [showClear, setShowClear] = useState(false)
  const [listModal, setListModal] = useState<'new' | 'edit' | null>(null)

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

  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, categoryLabel(t, c.name)]))

  const sortedListItems = [...listItems].sort((a, b) => compareNames(a.itemName, b.itemName))
  const grouped = categories
    .map((cat) => ({ cat, items: sortedListItems.filter((li) => li.itemCategoryId === cat.id) }))
    .filter(({ items }) => items.length > 0)
  const catIds = new Set(categories.map((c) => c.id))
  const otherItems = sortedListItems.filter((li) => !catIds.has(li.itemCategoryId))
  if (otherItems.length > 0) {
    grouped.push({ cat: { id: 0, name: t('categories.5'), sortOrder: 99 }, items: otherItems })
  }

  // Pool autocomplete: articoli base + già usati, deduplicati per nome normalizzato.
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

  // Spesa solita: i 8 prodotti più comprati della lista, non già presenti.
  const inListIds = new Set(listItems.map((li) => li.itemId))
  const itemById = new Map(items.map((it) => [it.id ?? 0, it]))
  const templateSuggestions =
    listItems.length < 3
      ? usualItems
          .filter((u) => !inListIds.has(u.itemId) && itemById.has(u.itemId))
          .slice(0, 8)
          .map((u) => ({ itemId: u.itemId, name: itemById.get(u.itemId)?.name ?? '' }))
      : []

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

  const quick: Suggestion[] = addInput
    ? []
    : Array.from(pool.values())
        .filter((p) => !inListNorm.has(normalizeName(p.name)))
        .sort((a, b) => b.purchaseCount - a.purchaseCount)
        .slice(0, 10)

  const exactInPool = pool.has(query)

  const handleAdd = (name?: string, categoryId?: number) => {
    const finalName = (name ?? addInput).trim()
    if (!finalName || listId === undefined) return
    const match = categoryId === undefined ? pool.get(normalizeName(finalName)) : undefined
    addNewItem.mutate({ listId, name: finalName, categoryId: categoryId ?? match?.categoryId })
    setAddInput('')
    inputRef.current?.focus()
  }

  const openItem = (itemId: number) =>
    void navigate({ to: '/item/$itemId' as never, params: { itemId: String(itemId) } as never })

  const totalQty = listItems.reduce((n, li) => n + li.quantity, 0)
  const estimate = listItems.reduce((n, li) => n + (li.suggestedPriceCents ?? 0) * li.quantity, 0)

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader
        title={t('lista.title')}
        subtitle={list ? [list.name, list.supermarketId !== null ? supermarketNames[list.supermarketId] : undefined].filter(Boolean).join(' · ') : undefined}
        right={
          listItems.length > 0 ? (
            <button onClick={() => setShowClear(true)} style={btnSecondary}>
              {t('lista.clear')}
            </button>
          ) : undefined
        }
      />

      {/* Schede delle liste */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', borderBottom: '1px solid #E0E0DD', marginBottom: '24px', overflowX: 'auto' }}>
        {tabs.map((l) => {
          const isActive = l.id === listId
          const store = l.supermarketId !== null ? supermarketNames[l.supermarketId] : undefined
          return (
            <button
              key={l.id}
              onClick={() => (isActive ? setListModal('edit') : setActiveListId(l.id as number))}
              aria-label={isActive ? t('lists.edit', { name: l.name }) : undefined}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #2A2A2C' : '2px solid transparent',
                marginBottom: '-1px',
                padding: '6px 2px 12px',
                fontSize: '15px',
                color: isActive ? '#2A2A2C' : '#9B9B9F',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {l.name}
              {isActive && <span aria-hidden> ⌄</span>}
              {store && <span style={{ fontSize: '12px', color: '#9B9B9F' }}> · {store}</span>}
            </button>
          )
        })}
        <button
          onClick={() => setListModal('new')}
          aria-label={t('lists.newList')}
          style={{ background: 'none', border: 'none', padding: '4px 4px 10px', fontSize: '20px', color: '#9B9B9F', cursor: 'pointer' }}
        >
          +
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Colonna principale: aggiunta + voci */}
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <div style={{ ...card, padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span aria-hidden style={{ color: '#9B9B9F', fontSize: '20px' }}>+</span>
            <input
              ref={inputRef}
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={t('lista.addPlaceholder')}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '15px', color: '#2A2A2C' }}
            />
          </div>

          {addInput.trim() && (
            <div style={{ ...card, padding: 0, overflow: 'hidden', marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              {matches.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleAdd(p.name, p.categoryId)}
                  style={suggestRow}
                >
                  <span>{p.name}</span>
                  <span style={{ fontSize: '12px', color: '#9B9B9F' }}>{catMap[p.categoryId] ?? t('categories.5')}</span>
                </button>
              ))}
              {!exactInPool && (
                <button onClick={() => handleAdd()} style={suggestRow}>
                  <span>{t('lista.addNamed', { name: addInput.trim() })}</span>
                  <span style={{ color: '#9B9B9F' }}>+</span>
                </button>
              )}
            </div>
          )}

          {quick.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {quick.map((p) => (
                <button key={p.name} onClick={() => handleAdd(p.name, p.categoryId)} style={chip}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {listItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 0', color: '#9B9B9F', fontSize: '14px' }}>{t('lista.empty')}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
            {grouped.map(({ cat, items: catItems }) => (
              <div key={cat.id} style={card}>
                <SectionTitle>{categoryLabel(t, cat.name)}</SectionTitle>
                {catItems.map((li, i) => (
                  <div
                    key={li.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      borderTop: i === 0 ? 'none' : '1px solid #F2F2F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                      <button
                        aria-label="-"
                        style={stepBtn}
                        onClick={() => {
                          if (li.id === undefined) return
                          if (li.quantity <= 1) setPendingListRemove(li.id)
                          else updateListQuantity.mutate({ id: li.id, quantity: li.quantity - 1 })
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '14px', color: '#2A2A2C' }}>{li.quantity}</span>
                      <button
                        aria-label="+"
                        style={stepBtn}
                        onClick={() => {
                          if (li.id !== undefined) updateListQuantity.mutate({ id: li.id, quantity: li.quantity + 1 })
                        }}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => openItem(li.itemId)}
                      style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '14px', color: '#2A2A2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {li.itemName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9B9B9F', marginTop: '2px' }}>
                        {li.suggestedPriceCents !== null ? `~ € ${formatCents(li.suggestedPriceCents)}` : t('lista.toGet')}
                      </div>
                    </button>
                    <button
                      aria-label={t('desktop.lista.remove')}
                      title={t('desktop.lista.remove')}
                      onClick={() => li.id !== undefined && setPendingListRemove(li.id)}
                      style={{ background: 'none', border: 'none', color: '#B5B5BA', fontSize: '18px', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Colonna laterale: riepilogo e spesa solita */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={card}>
            <SectionTitle>{t('desktop.lista.summary')}</SectionTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
              <span style={{ color: '#9B9B9F' }}>{t('desktop.lista.products')}</span>
              <span>{listItems.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '6px 0' }}>
              <span style={{ color: '#9B9B9F' }}>{t('desktop.lista.pieces')}</span>
              <span>{totalQty}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#9B9B9F', fontSize: '14px' }}>{t('desktop.lista.estimate')}</span>
              <span style={{ fontSize: '20px', fontWeight: 300 }}>€ {formatCents(estimate)}</span>
            </div>
          </div>

          {templateSuggestions.length > 0 && (
            <div style={card}>
              <div style={{ fontSize: '15px', color: '#2A2A2C', marginBottom: '6px' }}>{t('lista.templateTitle')}</div>
              <div style={{ fontSize: '12px', color: '#9B9B9F', marginBottom: '16px' }}>
                {templateSuggestions.map((s) => s.name).join(' · ')}
              </div>
              <button
                onClick={() => {
                  if (listId === undefined) return
                  templateSuggestions.forEach((s) => addToList.mutate({ listId, itemId: s.itemId }))
                }}
                style={{ ...btnSecondary, background: '#2A2A2C', color: '#fff' }}
              >
                {t('lista.templateLoad')}
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showClear}
        onClose={() => setShowClear(false)}
        title={t('lista.clearConfirmTitle', { name: list?.name })}
      >
        <div style={{ fontSize: '14px', color: '#9B9B9F', marginBottom: '24px' }}>
          {t('lista.clearConfirmBody', { count: listItems.length })}
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowClear(false)} style={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              if (listId !== undefined) clearList.mutate(listId, { onSuccess: () => toast(t('lista.cleared')) })
              setShowClear(false)
            }}
            style={btnDanger}
          >
            {t('lista.clearConfirm')}
          </button>
        </div>
      </Modal>

      <ListEditModal
        open={listModal !== null}
        onClose={() => setListModal(null)}
        list={listModal === 'edit' ? (list ?? null) : null}
        canArchive={tabs.length > 1}
        supermarkets={supermarkets}
      />

      <Modal open={pendingListRemove !== null} onClose={() => setPendingListRemove(null)} title={t('spesa.removeListConfirmTitle')}>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={() => setPendingListRemove(null)} style={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              if (pendingListRemove !== null) removeFromList.mutate(pendingListRemove)
              setPendingListRemove(null)
            }}
            style={btnDanger}
          >
            {t('spesa.removeListConfirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

const suggestRow = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 20px',
  background: 'none',
  border: 'none',
  borderBottom: '1px solid #F2F2F0',
  fontSize: '14px',
  color: '#2A2A2C',
  textAlign: 'left',
  cursor: 'pointer',
} as const
