import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { db } from '../../db/db'
import { qk } from '../../db/queryKeys'
import { categoryLabel } from '../../i18n'
import { currentWeek } from '../../lib/date'
import { formatCents, formatCentsPlain } from '../../lib/money'
import { liveSpendSummary } from '../../lib/budgetSelectors'
import { compareNames, normalizeName } from '../../lib/normalize'
import { BASE_ITEMS } from '../../lib/baseItems'
import {
  useSessionsByWeek,
  usePurchasesBySession,
  useCreateSession,
  useFinishSession,
  useAddPurchase,
  useRemovePurchase,
  useUpdatePurchase,
  useUpdateSession,
} from '../../hooks/useShopping'
import {
  useListItems,
  useRemovePurchasedFromList,
  useRemoveFromList,
  useAddToList,
  useAddNewItemToList,
} from '../../hooks/useListItems'
import { useSupermarkets, useCategories, useItems } from '../../hooks/useItems'
import { useActiveList } from '../../hooks/useShoppingLists'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { StatCard } from '../components/StatCard'
import { Modal } from '../components/Modal'
import { AmountModal } from '../components/AmountModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { StorePickerModal } from '../components/StorePickerModal'
import { BuoniModal } from '../components/BuoniModal'

interface OffListSuggestion {
  name: string
  categoryId: number
}

interface PriceTarget {
  itemId: number
  name: string
  purchaseId?: number
  priceCents?: number
  quantity?: number
  lastPriceCents?: number | null
}

interface TodoRow {
  id?: number
  itemId: number
  itemName: string
  suggestedPriceCents: number | null
}

interface CartRow {
  id?: number
  itemId: number
  name: string
  priceCents: number
  quantity: number
}

const isoWeek = currentWeek()

const card = { background: '#fff', borderRadius: '16px', padding: '24px' } as const
const primaryBtn = {
  border: 'none',
  borderRadius: '12px',
  background: '#2A2A2C',
  color: '#fff',
  padding: '11px 20px',
  fontSize: '14px',
  cursor: 'pointer',
} as const
const ghostBtn = {
  border: '1px solid #ECECEC',
  borderRadius: '12px',
  background: '#fff',
  color: '#2A2A2C',
  padding: '10px 16px',
  fontSize: '14px',
  cursor: 'pointer',
} as const
const iconBtn = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#9B9B9F',
  fontSize: '13px',
  padding: '4px 8px',
} as const

export function DesktopSpesaScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // strict: false — nel router desktop /spesa sta dentro lo shell, con id diverso da quello mobile registrato per i tipi.
  const { buoni, val, list: searchListId } = useSearch({ strict: false }) as {
    buoni: number
    val: number
    list?: number
  }
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [priceTarget, setPriceTarget] = useState<PriceTarget | null>(null)
  const [newItemTarget, setNewItemTarget] = useState<{ name: string; categoryId?: number } | null>(null)
  const [showStorePicker, setShowStorePicker] = useState(false)
  const [showNewItem, setShowNewItem] = useState(false)
  const [showCard, setShowCard] = useState(false)
  const [showEditBuoni, setShowEditBuoni] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [pendingListRemove, setPendingListRemove] = useState<number | null>(null)
  const [pendingCartRemove, setPendingCartRemove] = useState<{ id: number; itemId: number } | null>(null)

  const { data: sessions = [] } = useSessionsByWeek(isoWeek)
  const { data: supermarkets = [] } = useSupermarkets()
  const { lists, list: activeList } = useActiveList()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const catMap = Object.fromEntries(categories.map((c) => [c.id ?? 0, categoryLabel(t, c.name)]))
  const itemNameMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.name]))
  const itemLastPriceMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.lastPriceCents]))
  const altroCategoryId = categories.find((c) => c.name === 'Altro')?.id ?? 0

  // Pool autocomplete per "Aggiungi fuori lista": articoli base predefiniti + già usati.
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const offListPool = new Map<string, OffListSuggestion>()
  for (const b of BASE_ITEMS) {
    offListPool.set(normalizeName(b.name), { name: b.name, categoryId: catIdByName.get(b.category) ?? altroCategoryId })
  }
  for (const it of items) {
    offListPool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId })
  }
  const offListQuery = normalizeName(newItemName)
  const offListMatches: OffListSuggestion[] = offListQuery
    ? Array.from(offListPool.values())
        .filter((p) => normalizeName(p.name).includes(offListQuery))
        .sort((a, b) => {
          const an = normalizeName(a.name)
          const bn = normalizeName(b.name)
          const aStarts = an.startsWith(offListQuery) ? 0 : 1
          const bStarts = bn.startsWith(offListQuery) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return an.localeCompare(bn)
        })
        .slice(0, 8)
    : []

  // Usa la sessione più recente non finita, o quella attiva manualmente
  const activeSession =
    sessions.find((s) => s.id === activeSessionId && s.finishedAt === null) ??
    sessions.find((s) => s.finishedAt === null) ??
    null

  const { data: purchases = [] } = usePurchasesBySession(activeSession?.id ?? 0)

  // Lista della spesa: quella della sessione; per una spesa nuova quella scelta all'avvio.
  const listId = activeSession ? activeSession.listId : (searchListId ?? activeList?.id)
  const { data: listItems = [] } = useListItems(listId)
  const sessionList = lists.find((l) => l.id === listId)

  const createSession = useCreateSession(isoWeek)
  const finishSession = useFinishSession(isoWeek)
  const addPurchase = useAddPurchase(isoWeek)
  const removePurchase = useRemovePurchase(activeSession?.id ?? 0)
  const updatePurchase = useUpdatePurchase(activeSession?.id ?? 0)
  const updateSession = useUpdateSession()
  const removeFromList = useRemoveFromList()
  const addToList = useAddToList()
  const addNewItemToList = useAddNewItemToList(altroCategoryId)
  const removePurchasedFromList = useRemovePurchasedFromList()
  const qc = useQueryClient()

  const liveBuoni = activeSession?.buoniSpent ?? buoni
  const liveVal = activeSession?.buoniValueCents ?? val
  const summary = liveSpendSummary(purchases, liveBuoni, liveVal)

  const activeSupermarket = activeSession
    ? (supermarkets.find((s) => s.id === activeSession.supermarketId) ?? null)
    : null
  const supermarketName = activeSupermarket?.name ?? (activeSession ? '?' : '—')

  // Se la spesa in corso non ha un supermercato valido si apre la scelta del negozio
  // (quando la condizione diventa vera; stato aggiornato durante il render).
  const needsStore = activeSession !== null && activeSupermarket === null && supermarkets.length > 0
  const [prevNeedsStore, setPrevNeedsStore] = useState(false)
  if (needsStore !== prevNeedsStore) {
    setPrevNeedsStore(needsStore)
    if (needsStore) setShowStorePicker(true)
  }

  const handleStartSession = async (supermarketId: number) => {
    if (listId === undefined) return
    const id = await createSession.mutateAsync({
      supermarketId,
      buoniSpent: buoni,
      buoniValueCents: val,
      listId,
    })
    setActiveSessionId(id)
    setShowStorePicker(false)
  }

  const handleSaveBuoni = (buoniSpent: number, buoniValueCents: number) => {
    setShowEditBuoni(false)
    if (!activeSession?.id) return
    updateSession.mutate(
      { id: activeSession.id, oldIsoWeek: activeSession.isoWeek, patch: { buoniSpent, buoniValueCents } },
      { onSuccess: () => toast(t('sessione.saved')) },
    )
  }

  // Categoria di un item fuori lista: quella scelta, altrimenti da un match esatto
  // (Item esistente o articolo base), altrimenti "Altro". Dati letti freschi.
  const resolveOffListCategory = async (target: { name: string; categoryId?: number }): Promise<number> => {
    if (target.categoryId !== undefined) return target.categoryId
    const { getItems } = await import('../../db/repositories/items')
    const { getCategories } = await import('../../db/repositories/categories')
    const [cats, allItems] = await Promise.all([getCategories(), getItems()])
    const byName = new Map(cats.map((c) => [c.name, c.id ?? 0]))
    const altroId = byName.get('Altro') ?? 0
    const normalized = normalizeName(target.name)
    const existingItem = allItems.find((it) => normalizeName(it.name) === normalized)
    const baseMatch = BASE_ITEMS.find((b) => normalizeName(b.name) === normalized)
    return existingItem?.categoryId ?? (baseMatch ? (byName.get(baseMatch.category) ?? altroId) : altroId)
  }

  // Fuori lista senza prezzo: finisce tra le voci "da prendere"; il prezzo si inserisce dopo.
  const handleAddOffListWithoutPrice = async (target: { name: string; categoryId?: number }) => {
    if (listId === undefined) return
    const categoryId = await resolveOffListCategory(target)
    await addNewItemToList.mutateAsync({ listId, name: target.name, categoryId })
    toast(t('spesa.addedWithoutPrice', { name: target.name }), {
      description: t('spesa.addedWithoutPriceHint'),
    })
    setNewItemTarget(null)
    setNewItemName('')
  }

  const handleConfirmPrice = async (cents: number, quantity: number) => {
    if (!activeSession?.id) return
    if (priceTarget) {
      if (priceTarget.purchaseId !== undefined) {
        await updatePurchase.mutateAsync({ id: priceTarget.purchaseId, priceCents: cents, quantity })
      } else {
        await addPurchase.mutateAsync({
          sessionId: activeSession.id,
          itemId: priceTarget.itemId,
          priceCents: cents,
          quantity,
        })
        const oop = Math.max(0, summary.spentCents + cents * quantity - liveBuoni * liveVal)
        toast(t('spesa.itemAdded', { name: priceTarget.name }), {
          description: t('spesa.outOfPocketAmount', { amount: formatCentsPlain(oop) }),
        })
      }
      setPriceTarget(null)
    } else if (newItemTarget) {
      const { upsertItem } = await import('../../db/repositories/items')
      const categoryId = await resolveOffListCategory(newItemTarget)
      const itemId = await upsertItem(newItemTarget.name, categoryId, cents)
      await addPurchase.mutateAsync({ sessionId: activeSession.id, itemId, priceCents: cents, quantity })
      toast(t('spesa.itemAdded', { name: newItemTarget.name }), { description: formatCents(cents) })
      setNewItemTarget(null)
      setNewItemName('')
    }
  }

  const handleChangeStore = async (supermarketId: number) => {
    if (!activeSession?.id) {
      await handleStartSession(supermarketId)
      return
    }
    await db.sessions.update(activeSession.id, { supermarketId })
    void qc.invalidateQueries({ queryKey: qk.sessions(isoWeek) })
    setShowStorePicker(false)
  }

  const handleConfirmFinish = async (cents: number) => {
    if (!activeSession?.id) return
    setShowFinishConfirm(false)
    await finishSession.mutateAsync({ sessionId: activeSession.id, confirmedTotalCents: cents })
    if (listId !== undefined) {
      await removePurchasedFromList.mutateAsync({ listId, itemIds: purchases.map((p) => p.itemId) })
    }
    toast(t('spesa.saved'), { description: `${supermarketName} · ${formatCents(cents)}` })
    void navigate({ to: '/storico' })
  }

  // Depenna: annulla l'acquisto e rimette la voce tra "da prendere" (anche se era fuori lista).
  const uncheckCart = async (purchaseId: number, itemId: number) => {
    await removePurchase.mutateAsync(purchaseId)
    if (listId !== undefined && !listItems.some((l) => l.itemId === itemId)) {
      await addToList.mutateAsync({ listId, itemId })
    }
  }

  // Elimina del tutto una voce dal carrello: rimuove l'acquisto e, se era in lista, anche dalla lista.
  const eliminateCart = async (purchaseId: number, itemId: number) => {
    await removePurchase.mutateAsync(purchaseId)
    const li = listItems.find((l) => l.itemId === itemId)
    if (li?.id !== undefined) await removeFromList.mutateAsync(li.id)
  }

  const startOffList = (target: { name: string; categoryId?: number }) => {
    setNewItemTarget(target)
    setShowNewItem(false)
  }

  const purchasedItemIds = new Set(purchases.map((p) => p.itemId))
  const todoItems = listItems.filter((li) => !purchasedItemIds.has(li.itemId))
  const cartRows: CartRow[] = purchases.map((p) => ({
    id: p.id,
    itemId: p.itemId,
    priceCents: p.priceCents,
    quantity: p.quantity,
    name:
      itemNameMap[p.itemId] ??
      listItems.find((li) => li.itemId === p.itemId)?.itemName ??
      `item ${p.itemId}`,
  }))

  // Da prendere per categoria: categorie in ordine alfabetico
  const todoByCategory = new Map<number, TodoRow[]>()
  for (const li of todoItems) {
    const rows = todoByCategory.get(li.itemCategoryId) ?? []
    rows.push(li)
    todoByCategory.set(li.itemCategoryId, rows)
  }
  const categoryLabelOf = (catId: number) => catMap[catId] ?? t('categories.5')
  const todoGroups = Array.from(todoByCategory.entries()).sort(([a], [b]) =>
    compareNames(categoryLabelOf(a), categoryLabelOf(b)),
  )

  const askPrice = (r: TodoRow) =>
    setPriceTarget({ itemId: r.itemId, name: r.itemName, lastPriceCents: itemLastPriceMap[r.itemId] ?? null })

  const todoColumns: Column<TodoRow>[] = [
    {
      key: 'name',
      label: t('desktop.spesa.colItem'),
      render: (r) => r.itemName,
      sortValue: (r) => r.itemName,
    },
    {
      key: 'suggested',
      label: t('desktop.spesa.colSuggested'),
      align: 'right',
      render: (r) => (r.suggestedPriceCents !== null ? `${t('spesa.about')} ${formatCents(r.suggestedPriceCents)}` : '—'),
      sortValue: (r) => r.suggestedPriceCents,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <button
          aria-label={t('spesa.removeItem')}
          onClick={(e) => {
            e.stopPropagation()
            if (r.id !== undefined) setPendingListRemove(r.id)
          }}
          style={iconBtn}
        >
          ✕
        </button>
      ),
    },
  ]

  const cartColumns: Column<CartRow>[] = [
    {
      key: 'check',
      label: '',
      render: (r) => (
        <button
          aria-label={t('spesa.uncheck')}
          title={t('spesa.uncheck')}
          onClick={(e) => {
            e.stopPropagation()
            if (r.id !== undefined) void uncheckCart(r.id, r.itemId)
          }}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: 'none',
            background: '#2A2A2C',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          ✓
        </button>
      ),
    },
    { key: 'name', label: t('desktop.spesa.colItem'), render: (r) => r.name, sortValue: (r) => r.name },
    {
      key: 'qty',
      label: t('desktop.spesa.colQty'),
      align: 'right',
      render: (r) => r.quantity,
      sortValue: (r) => r.quantity,
    },
    {
      key: 'price',
      label: t('desktop.spesa.colUnitPrice'),
      align: 'right',
      render: (r) => formatCents(r.priceCents),
      sortValue: (r) => r.priceCents,
    },
    {
      key: 'total',
      label: t('desktop.spesa.colTotal'),
      align: 'right',
      render: (r) => formatCents(r.priceCents * r.quantity),
      sortValue: (r) => r.priceCents * r.quantity,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <button
          aria-label={t('spesa.removeItem')}
          onClick={(e) => {
            e.stopPropagation()
            if (r.id !== undefined) setPendingCartRemove({ id: r.id, itemId: r.itemId })
          }}
          style={iconBtn}
        >
          ✕
        </button>
      ),
    },
  ]

  const storePicker = (
    <StorePickerModal
      open={showStorePicker}
      onClose={() => setShowStorePicker(false)}
      supermarkets={supermarkets}
      currentId={activeSession?.supermarketId ?? null}
      onPick={(id) => void handleChangeStore(id)}
    />
  )

  if (!activeSession) {
    return (
      <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
        <PageHeader title={t('spesa.startTitle')} />
        <div style={{ ...card, textAlign: 'center', padding: '56px 24px' }}>
          <p style={{ fontSize: '15px', color: '#9B9B9F', margin: '0 0 24px' }}>{t('spesa.choosePrompt')}</p>
          <button onClick={() => setShowStorePicker(true)} style={{ ...primaryBtn, padding: '14px 28px', fontSize: '15px' }}>
            {t('spesa.chooseStore')}
          </button>
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => void navigate({ to: '/lista' })} style={{ ...iconBtn, fontSize: '14px' }}>
              {t('spesa.backToWeek')}
            </button>
          </div>
        </div>
        {storePicker}
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <PageHeader
        title={supermarketName}
        subtitle={sessionList?.name}
        right={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowStorePicker(true)} style={ghostBtn}>
              {t('desktop.spesa.changeStore')}
            </button>
            {activeSupermarket?.loyaltyCard && (
              <button onClick={() => setShowCard(true)} style={ghostBtn}>
                {t('supermercati.viewCard')}
              </button>
            )}
            <button onClick={() => setShowNewItem(true)} style={ghostBtn}>
              {t('spesa.addOffList')}
            </button>
            <button onClick={() => setShowFinishConfirm(true)} style={primaryBtn}>
              {t('desktop.spesa.finishShopping')}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <StatCard label={t('home.outOfPocket')} value={`€ ${formatCents(summary.outOfPocketCents)}`} />
        <StatCard
          label={t('statistiche.totalSpent')}
          value={`€ ${formatCents(summary.spentCents)}`}
          sub={t('spesa.itemsInCart', { count: cartRows.length })}
        />
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          <StatCard
            label={t('spesa.buoni')}
            value={`${liveBuoni} ${t('common.buoni')}`}
            sub={`€ ${formatCents(liveBuoni * liveVal)}`}
          />
          <button
            onClick={() => setShowEditBuoni(true)}
            aria-label={t('spesa.editBuoni')}
            style={{ ...iconBtn, position: 'absolute', top: '14px', right: '16px', textDecoration: 'underline dotted' }}
          >
            {t('spesa.editBuoniTitle')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionTitle>{t('spesa.toGet')}</SectionTitle>
          {todoGroups.length === 0 && (
            <div style={{ ...card, color: '#9B9B9F', fontSize: '14px', textAlign: 'center' }}>
              {t('desktop.spesa.nothingToGet')}
            </div>
          )}
          {todoGroups.map(([catId, rows]) => (
            <div key={catId} style={{ ...card, marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: '#9B9B9F',
                  marginBottom: '4px',
                }}
              >
                {categoryLabelOf(catId)}
              </div>
              <SortableTable
                columns={todoColumns}
                rows={rows}
                rowKey={(r) => r.id ?? r.itemId}
                defaultSort={{ key: 'name', dir: 'asc' }}
                onRowClick={askPrice}
              />
            </div>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <SectionTitle>{t('spesa.inCart')}</SectionTitle>
          <div style={card}>
            <SortableTable
              columns={cartColumns}
              rows={cartRows}
              rowKey={(r) => r.id ?? r.itemId}
              onRowClick={(r) =>
                setPriceTarget({
                  itemId: r.itemId,
                  name: r.name,
                  purchaseId: r.id,
                  priceCents: r.priceCents,
                  quantity: r.quantity,
                  lastPriceCents: itemLastPriceMap[r.itemId] ?? null,
                })
              }
              emptyMessage={t('desktop.spesa.emptyCart')}
            />
          </div>
        </div>
      </div>

      {storePicker}

      <BuoniModal
        open={showEditBuoni}
        onClose={() => setShowEditBuoni(false)}
        buoni={liveBuoni}
        valueCents={liveVal}
        onSave={handleSaveBuoni}
      />

      {/* Prezzo/quantità — da lista (aggiungi o modifica) */}
      <AmountModal
        open={priceTarget !== null}
        onClose={() => setPriceTarget(null)}
        label={priceTarget?.name ?? ''}
        confirmLabel={priceTarget?.purchaseId !== undefined ? t('common.save') : t('spesa.addToCart')}
        showQuantity
        initialCents={priceTarget?.priceCents ?? 0}
        initialQuantity={priceTarget?.quantity ?? 1}
        lastPriceCents={priceTarget?.lastPriceCents}
        onConfirm={(c, q) => void handleConfirmPrice(c, q)}
      />

      {/* Nuovo item fuori lista */}
      <Modal open={showNewItem} onClose={() => setShowNewItem(false)} title={t('spesa.offListTitle')} width={440}>
        <input
          autoFocus
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={t('spesa.itemNamePlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newItemName.trim()) startOffList({ name: newItemName.trim() })
          }}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #ECECEC',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '15px',
            outline: 'none',
            marginBottom: '12px',
          }}
        />
        {offListMatches.length > 0 && (
          <div style={{ background: '#F6F6F4', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
            {offListMatches.map((p) => (
              <button
                key={p.name}
                onClick={() => startOffList({ name: p.name, categoryId: p.categoryId })}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  fontSize: '14px',
                  color: '#2A2A2C',
                  borderBottom: '1px solid #ECECEC',
                }}
              >
                <span>{p.name}</span>
                <span style={{ fontSize: '12px', color: '#9B9B9F' }}>{catMap[p.categoryId] ?? t('categories.5')}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            if (newItemName.trim()) startOffList({ name: newItemName.trim() })
          }}
          style={{ ...primaryBtn, width: '100%', padding: '13px' }}
        >
          {t('spesa.continue')}
        </button>
      </Modal>

      {/* Prezzo — fuori lista */}
      <AmountModal
        open={newItemTarget !== null}
        onClose={() => setNewItemTarget(null)}
        label={newItemTarget?.name ?? ''}
        confirmLabel={t('spesa.addToCart')}
        showQuantity
        onConfirm={(c, q) => void handleConfirmPrice(c, q)}
        secondaryAction={
          newItemTarget
            ? { label: t('spesa.addWithoutPrice'), onTap: () => void handleAddOffListWithoutPrice(newItemTarget) }
            : undefined
        }
      />

      {/* Importo confermato a fine spesa: precompilato col totale calcolato, modificabile. */}
      <AmountModal
        open={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        label={t('spesa.howMuch')}
        confirmLabel={t('spesa.confirmShopping')}
        initialCents={summary.spentCents}
        onConfirm={(c) => void handleConfirmFinish(c)}
      />

      <ConfirmModal
        open={pendingListRemove !== null}
        onClose={() => setPendingListRemove(null)}
        title={t('spesa.removeListConfirmTitle')}
        confirmLabel={t('spesa.removeListConfirm')}
        onConfirm={() => {
          if (pendingListRemove !== null) removeFromList.mutate(pendingListRemove)
          setPendingListRemove(null)
        }}
      />

      <ConfirmModal
        open={pendingCartRemove !== null}
        onClose={() => setPendingCartRemove(null)}
        title={t('spesa.removeCartConfirmTitle')}
        confirmLabel={t('spesa.removeCartConfirm')}
        onConfirm={() => {
          if (pendingCartRemove) void eliminateCart(pendingCartRemove.id, pendingCartRemove.itemId)
          setPendingCartRemove(null)
        }}
      />

      {/* Tessera fedeltà */}
      <Modal open={showCard && !!activeSupermarket?.loyaltyCard} onClose={() => setShowCard(false)} width={560}>
        {activeSupermarket?.loyaltyCard && (
          <img
            src={activeSupermarket.loyaltyCard}
            alt={t('supermercati.cardOf', { name: activeSupermarket.name })}
            style={{ width: '100%', borderRadius: '12px', objectFit: 'contain' }}
          />
        )}
      </Modal>
    </div>
  )
}
