import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatCents, formatCentsPlain } from '../../lib/money'
import { formatDate, toWeekKey } from '../../lib/date'
import { getWeekStartDay } from '../../lib/weekSettings'
import { outOfPocketCents } from '../../lib/budgetSelectors'
import { useSupermarkets } from '../../hooks/useItems'
import { useUpdateSession, useEditPastPurchase, useFinishPastSession } from '../../hooks/useShopping'
import { db } from '../../db/db'
import { qk } from '../../db/queryKeys'
import { deleteSession } from '../../db/repositories/sessions'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { StatCard } from '../components/StatCard'
import { AmountModal } from '../components/AmountModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { StorePickerModal } from '../components/StorePickerModal'
import { BuoniModal } from '../components/BuoniModal'

interface PurchaseRow {
  id?: number
  name: string
  quantity: number
  priceCents: number
}

const linkBtn = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  color: '#9B9B9F',
  fontSize: '12px',
  padding: 0,
  textDecoration: 'underline dotted',
} as const

export function DesktopSessioneScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // strict: false — il router registrato per i tipi è quello mobile (id '/shell/…').
  const { sessionId: sessionIdStr } = useParams({ strict: false })
  const sessionId = parseInt(sessionIdStr ?? '', 10)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStorePicker, setShowStorePicker] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null)
  const [showEditTotal, setShowEditTotal] = useState(false)
  const [showEditBuoni, setShowEditBuoni] = useState(false)
  const [showFinishKeypad, setShowFinishKeypad] = useState(false)
  const qc = useQueryClient()

  const { data: supermarkets = [] } = useSupermarkets()
  const { data: session } = useQuery({
    queryKey: qk.session(sessionId),
    queryFn: () => db.sessions.get(sessionId),
  })
  const { data: purchases = [] } = useQuery({
    queryKey: qk.purchases(sessionId),
    queryFn: () => db.purchases.where('sessionId').equals(sessionId).toArray(),
  })
  const { data: items = [] } = useQuery({
    queryKey: qk.items(),
    queryFn: () => db.items.toArray(),
  })

  const updateSession = useUpdateSession()
  const editPurchase = useEditPastPurchase(sessionId, session?.isoWeek ?? '')
  const finishPast = useFinishPastSession(sessionId, session?.isoWeek ?? '')
  const isCompleted = session?.finishedAt !== null && session?.finishedAt !== undefined

  const storeName = supermarkets.find((s) => s.id === session?.supermarketId)?.name ?? '?'
  const computedCents = purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
  const totalCents = session?.confirmedTotalCents ?? computedCents
  const itemMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.name]))
  const rows: PurchaseRow[] = purchases.map((p) => ({
    id: p.id,
    name: itemMap[p.itemId] ?? `#${p.itemId}`,
    quantity: p.quantity,
    priceCents: p.priceCents,
  }))
  const editingPurchase = editingPurchaseId !== null ? (purchases.find((p) => p.id === editingPurchaseId) ?? null) : null

  const patchSession = (patch: Parameters<typeof updateSession.mutate>[0]['patch'], onSuccess?: () => void) => {
    if (!session) return
    updateSession.mutate(
      { id: sessionId, oldIsoWeek: session.isoWeek, patch },
      { onSuccess: () => { onSuccess?.(); toast(t('sessione.saved')) } },
    )
  }

  const handleDelete = async () => {
    const isoWeek = session?.isoWeek
    await deleteSession(sessionId)
    void qc.invalidateQueries({ queryKey: qk.allSessions() })
    void qc.invalidateQueries({ queryKey: qk.session(sessionId) })
    void qc.invalidateQueries({ queryKey: qk.items() })
    if (isoWeek) void qc.invalidateQueries({ queryKey: qk.purchasesForWeek(isoWeek) })
    void navigate({ to: '/storico' })
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!session || !e.target.value) return
    const [y, m, d] = e.target.value.split('-').map((n) => parseInt(n, 10))
    const orig = new Date(session.startedAt)
    const newDate = new Date(y, m - 1, d, orig.getHours(), orig.getMinutes(), orig.getSeconds())
    patchSession({ startedAt: newDate.getTime(), isoWeek: toWeekKey(newDate, getWeekStartDay()) })
  }

  const dateInputValue = session
    ? (() => {
        const d = new Date(session.startedAt)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })()
    : ''

  const columns: Column<PurchaseRow>[] = [
    { key: 'name', label: t('desktop.sessione.colItem'), render: (r) => r.name, sortValue: (r) => r.name },
    { key: 'qty', label: t('desktop.sessione.colQty'), align: 'right', render: (r) => r.quantity, sortValue: (r) => r.quantity },
    {
      key: 'price',
      label: t('desktop.sessione.colUnitPrice'),
      align: 'right',
      render: (r) => formatCents(r.priceCents),
      sortValue: (r) => r.priceCents,
    },
    {
      key: 'total',
      label: t('desktop.sessione.colTotal'),
      align: 'right',
      render: (r) => formatCents(r.priceCents * r.quantity),
      sortValue: (r) => r.priceCents * r.quantity,
    },
  ]

  const btn = { border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '14px', cursor: 'pointer' } as const
  const buoniSpent = session?.buoniSpent ?? 0
  const buoniValue = session?.buoniValueCents ?? 0

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <button
        onClick={() => void navigate({ to: '/storico' })}
        style={{ background: 'none', border: 'none', padding: 0, marginBottom: '12px', color: '#9B9B9F', fontSize: '13px', cursor: 'pointer' }}
      >
        ← {t('storico.title')}
      </button>
      <PageHeader
        title={storeName}
        subtitle={isCompleted ? undefined : t('sessione.notCompleted')}
        right={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowStorePicker(true)} style={{ ...btn, background: '#fff', border: '1px solid #ECECEC', color: '#2A2A2C' }}>
              {t('sessione.editStore')}
            </button>
            {!isCompleted && (
              <button onClick={() => setShowFinishKeypad(true)} style={{ ...btn, background: '#2A2A2C', color: '#fff' }}>
                {t('sessione.finish')}
              </button>
            )}
            <button onClick={() => setShowDeleteConfirm(true)} style={{ ...btn, background: '#fff', border: '1px solid #ECECEC', color: '#D14343' }}>
              {t('sessione.deleteSession')}
            </button>
          </div>
        }
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <StatCard label={t('desktop.sessione.total')} value={`€ ${formatCents(totalCents)}`} sub={session ? formatDate(session.startedAt) : '—'} />
          <div style={{ display: 'flex', gap: '16px', padding: '0 4px' }}>
            {isCompleted && (
              <button onClick={() => setShowEditTotal(true)} aria-label={t('sessione.editTotal')} style={linkBtn}>
                {t('sessione.editTotal')}
              </button>
            )}
            <span style={{ position: 'relative' }}>
              <span style={linkBtn}>{t('sessione.editDate')}</span>
              <input
                type="date"
                value={dateInputValue}
                onChange={handleDateChange}
                aria-label={t('sessione.editDate')}
                style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}
              />
            </span>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <StatCard
            label={t('spesa.buoni')}
            value={`${buoniSpent} ${t('common.buoni')}`}
            sub={`€ ${formatCents(buoniSpent * buoniValue)}`}
          />
          <div style={{ padding: '0 4px' }}>
            {session && (
              <button onClick={() => setShowEditBuoni(true)} aria-label={t('spesa.editBuoni')} style={linkBtn}>
                {t('spesa.editBuoniTitle')}
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StatCard label={t('home.outOfPocket')} value={`€ ${formatCents(outOfPocketCents(totalCents, buoniSpent, buoniValue))}`} />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <SectionTitle>{t('desktop.sessione.purchases')}</SectionTitle>
        <SortableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id ?? r.name}
          onRowClick={(r) => setEditingPurchaseId(r.id ?? null)}
          emptyMessage={t('sessione.noPurchases')}
        />
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('sessione.deleteConfirmTitle')}
        body={t('sessione.deleteConfirmBody')}
        confirmLabel={t('sessione.deleteConfirm')}
        onConfirm={() => void handleDelete()}
      />

      <BuoniModal
        open={showEditBuoni}
        onClose={() => setShowEditBuoni(false)}
        buoni={buoniSpent}
        valueCents={buoniValue}
        onSave={(buoni, valueCents) =>
          patchSession({ buoniSpent: buoni, buoniValueCents: valueCents }, () => setShowEditBuoni(false))
        }
      />

      <StorePickerModal
        open={showStorePicker}
        onClose={() => setShowStorePicker(false)}
        supermarkets={supermarkets}
        currentId={session?.supermarketId ?? null}
        onPick={(supermarketId) => patchSession({ supermarketId }, () => setShowStorePicker(false))}
      />

      <AmountModal
        open={editingPurchaseId !== null}
        onClose={() => setEditingPurchaseId(null)}
        label={editingPurchase ? (itemMap[editingPurchase.itemId] ?? '') : ''}
        confirmLabel={t('common.save')}
        initialCents={editingPurchase?.priceCents ?? 0}
        initialQuantity={editingPurchase?.quantity ?? 1}
        showQuantity
        onConfirm={(cents, quantity) => {
          if (editingPurchaseId === null) return
          editPurchase.mutate(
            { purchaseId: editingPurchaseId, priceCents: cents, quantity },
            { onSuccess: () => { setEditingPurchaseId(null); toast(t('sessione.saved')) } },
          )
        }}
      />

      <AmountModal
        open={showFinishKeypad}
        onClose={() => setShowFinishKeypad(false)}
        label={t('spesa.howMuch')}
        confirmLabel={t('spesa.confirmShopping')}
        initialCents={computedCents}
        onConfirm={(cents) => {
          finishPast.mutate(cents, {
            onSuccess: () => {
              setShowFinishKeypad(false)
              toast(t('spesa.saved'))
              void navigate({ to: '/storico' })
            },
          })
        }}
      />

      <AmountModal
        open={showEditTotal}
        onClose={() => setShowEditTotal(false)}
        label={t('sessione.editTotal')}
        confirmLabel={t('common.save')}
        initialCents={totalCents}
        secondaryAction={
          session?.confirmedTotalCents !== null && session?.confirmedTotalCents !== undefined
            ? {
                label: t('sessione.useComputedTotal', { amount: formatCentsPlain(computedCents) }),
                onTap: () => { setShowEditTotal(false); patchSession({ confirmedTotalCents: null }) },
              }
            : undefined
        }
        onConfirm={(cents) => { setShowEditTotal(false); patchSession({ confirmedTotalCents: cents }) }}
      />
    </div>
  )
}
