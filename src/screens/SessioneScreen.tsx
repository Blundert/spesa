import { useNavigate, useParams } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatCentsPlain } from '../lib/money'
import { formatShortDate } from '../lib/date'
import { toWeekKey } from '../lib/date'
import { getWeekStartDay } from '../lib/weekSettings'
import { useSupermarkets } from '../hooks/useItems'
import { db } from '../db/db'
import { qk } from '../db/queryKeys'
import { deleteSession } from '../db/repositories/sessions'
import { BottomSheet } from '../components/BottomSheet'
import { PriceKeypad } from '../components/PriceKeypad'
import { useUpdateSession, useEditPastPurchase } from '../hooks/useShopping'

export function SessioneScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { sessionId: sessionIdStr } = useParams({ from: '/storico/$sessionId' })
  const sessionId = parseInt(sessionIdStr, 10)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showStorePicker, setShowStorePicker] = useState(false)
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)
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

  const storeName = supermarkets.find((s) => s.id === session?.supermarketId)?.name ?? '?'
  const computedCents = purchases.reduce((acc, p) => acc + p.priceCents * p.quantity, 0)
  const totalCents = session?.confirmedTotalCents ?? computedCents
  const itemMap = Object.fromEntries(items.map((it) => [it.id ?? 0, it.name]))

  const editingPurchase = editingPurchaseId !== null
    ? purchases.find((p) => p.id === editingPurchaseId) ?? null
    : null

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
    const parts = e.target.value.split('-')
    const y = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    const d = parseInt(parts[2], 10)
    const orig = new Date(session.startedAt)
    const newDate = new Date(y, m - 1, d, orig.getHours(), orig.getMinutes(), orig.getSeconds())
    const newStartedAt = newDate.getTime()
    const newIsoWeek = toWeekKey(newDate, getWeekStartDay())
    updateSession.mutate(
      { id: sessionId, oldIsoWeek: session.isoWeek, patch: { startedAt: newStartedAt, isoWeek: newIsoWeek } },
      { onSuccess: () => toast(t('sessione.saved')) },
    )
  }

  const handlePickStore = (supermarketId: number) => {
    if (!session) return
    updateSession.mutate(
      { id: sessionId, oldIsoWeek: session.isoWeek, patch: { supermarketId } },
      { onSuccess: () => { setShowStorePicker(false); toast(t('sessione.saved')) } },
    )
  }

  const handleConfirmPrice = (cents: number, qty: number) => {
    if (editingPurchaseId === null) return
    editPurchase.mutate(
      { purchaseId: editingPurchaseId, priceCents: cents, quantity: qty },
      { onSuccess: () => { setEditingPurchaseId(null); toast(t('sessione.saved')) } },
    )
  }

  const dateInputValue = session
    ? (() => {
        const d = new Date(session.startedAt)
        const y = d.getFullYear()
        const mo = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${mo}-${day}`
      })()
    : ''

  return (
    <>
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="flex-none" style={{ height: 'max(16px, env(safe-area-inset-top))' }} />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="relative flex items-center pt-2 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/storico' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => setShowStorePicker(true)}
            aria-label={t('sessione.editStore')}
            className="absolute left-1/2 -translate-x-1/2 text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C] max-w-[60%] truncate active:opacity-50"
          >
            {storeName}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            aria-label={t('sessione.deleteSession')}
            className="w-[34px] h-[34px] -mr-1.5 ml-auto flex items-center justify-center opacity-40 active:opacity-80"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-white rounded-[22px] px-6 pt-6 pb-4 mb-[14px] text-center">
          <input
            ref={dateInputRef}
            type="date"
            value={dateInputValue}
            onChange={handleDateChange}
            className="sr-only"
            aria-label={t('sessione.editDate')}
          />
          <button
            onClick={() => dateInputRef.current?.click()}
            className="text-[13px] text-[#9B9B9F] mb-2 underline decoration-dotted underline-offset-2 active:opacity-50"
          >
            {session ? formatShortDate(session.startedAt) : '—'}
          </button>
          <div className="flex items-baseline justify-center text-[#2A2A2C]">
            <span className="text-[30px] font-normal text-[#B5B5BA] mr-1">€</span>
            <span className="text-[64px] font-light tracking-[-1.5px] leading-[.95] tabular-nums">
              {formatCentsPlain(totalCents)}
            </span>
          </div>
          {session && session.buoniSpent > 0 && (
            <div className="text-[13px] text-[#9B9B9F] mt-2 tabular-nums">
              {session.buoniSpent} {t('common.buoni')} · €{formatCentsPlain(session.buoniSpent * session.buoniValueCents)}
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="bg-white rounded-[20px] overflow-hidden">
          {purchases.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setEditingPurchaseId(p.id ?? null)}
              className="w-full flex items-center justify-between px-5 py-4 active:bg-[#F9F9F7] text-left"
              style={{ borderBottom: i < purchases.length - 1 ? '1px solid #ECECEC' : 'none' }}
            >
              <span className="text-[15px] text-[#2A2A2C]">
                {itemMap[p.itemId] ?? `#${p.itemId}`}
                {p.quantity > 1 && (
                  <span className="text-[#9B9B9F] ml-1">×{p.quantity}</span>
                )}
              </span>
              <span className="text-[15px] text-[#5A5A5E] tabular-nums">
                €{formatCentsPlain(p.priceCents * p.quantity)}
              </span>
            </button>
          ))}
          {purchases.length === 0 && (
            <div className="text-center py-8 text-[#9B9B9F] text-sm">{t('sessione.noPurchases')}</div>
          )}
        </div>
      </div>
    </div>

    <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
      <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">{t('sessione.deleteConfirmTitle')}</div>
      <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">{t('sessione.deleteConfirmBody')}</div>
      <button
        onClick={() => void handleDelete()}
        className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
      >
        {t('sessione.deleteConfirm')}
      </button>
      <button
        onClick={() => setShowDeleteConfirm(false)}
        className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
      >
        {t('common.cancel')}
      </button>
    </BottomSheet>

    <StorePickerSheet
      open={showStorePicker}
      onClose={() => setShowStorePicker(false)}
      supermarkets={supermarkets}
      currentId={session?.supermarketId ?? null}
      onPick={handlePickStore}
    />

    <PriceKeypad
      open={editingPurchaseId !== null}
      onClose={() => setEditingPurchaseId(null)}
      label={editingPurchase ? (itemMap[editingPurchase.itemId] ?? '') : ''}
      initialCents={editingPurchase?.priceCents ?? 0}
      initialQuantity={editingPurchase?.quantity ?? 1}
      showQuantity
      onConfirm={handleConfirmPrice}
    />
    </>
  )
}

interface StorePickerSheetProps {
  open: boolean
  onClose: () => void
  supermarkets: Array<{ id?: number; name: string }>
  currentId: number | null
  onPick: (id: number) => void
}

function StorePickerSheet({ open, onClose, supermarkets, currentId, onPick }: StorePickerSheetProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [newName, setNewName] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[14px]">{t('spesa.chooseStore')}</div>
      <div className="flex flex-col gap-0.5 pb-2">
        {supermarkets.map((s) => (
          <button
            key={s.id}
            onClick={() => s.id !== undefined && onPick(s.id)}
            className="flex items-center justify-between px-1.5 py-[15px] border-b border-[#ECECEC] active:opacity-50 text-left"
          >
            <span className={`text-[17px] text-[#2A2A2C] ${s.id === currentId ? 'font-semibold' : 'font-normal'}`}>
              {s.name}
            </span>
            {s.id === currentId && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4 4 10-10" />
              </svg>
            )}
          </button>
        ))}
      </div>
      {showAdd ? (
        <div className="mt-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t('spesa.storeNamePlaceholder')}
            autoFocus
            className="w-full border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-3"
          />
          <button
            onClick={async () => {
              if (!newName.trim()) return
              const { upsertSupermarket } = await import('../db/repositories/supermarkets')
              const id = await upsertSupermarket(newName.trim())
              await qc.invalidateQueries({ queryKey: qk.supermarkets() })
              onPick(id)
              setNewName('')
              setShowAdd(false)
            }}
            className="w-full bg-[#2A2A2C] text-white py-[15px] rounded-2xl text-[16px] active:scale-[.98] transition-transform"
          >
            {t('spesa.addAndSelect')}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-2 w-full border border-[#E0E0DE] bg-white text-[#2A2A2C] text-[16px] py-[15px] rounded-2xl active:bg-[#F6F6F4]"
        >
          {t('spesa.addStore')}
        </button>
      )}
    </BottomSheet>
  )
}
