import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatCents } from '../../lib/money'
import { formatDate } from '../../lib/date'
import { compressImage } from '../../lib/imageUtils'
import { useSupermarkets, useUpdateLoyaltyCard } from '../../hooks/useItems'
import { useSupermarketStats } from '../../hooks/usePriceHistory'
import { useAllSessions } from '../../hooks/useShopping'
import { upsertSupermarket, deleteSupermarket } from '../../db/repositories/supermarkets'
import { qk } from '../../db/queryKeys'
import type { Supermarket } from '../../db/types'
import { PageHeader } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { Modal } from '../components/Modal'

interface Row {
  supermarket: Supermarket
  sessionCount: number
  totalCents: number
  avgCents: number
  lastVisit: number | null
}

const primaryBtn = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: 'none',
  background: '#2A2A2C',
  color: '#fff',
  fontSize: '14px',
  cursor: 'pointer',
}
const secondaryBtn = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: '1px solid #D8D8D6',
  background: '#fff',
  color: '#2A2A2C',
  fontSize: '14px',
  cursor: 'pointer',
}
const dangerBtn = { ...primaryBtn, background: '#D14343' }
const linkBtn = {
  all: 'unset' as const,
  cursor: 'pointer',
  fontSize: '13px',
  color: '#9B9B9F',
}

export function DesktopSupermercatiScreen() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: stats = [] } = useSupermarketStats()
  const { data: sessions = [] } = useAllSessions()
  const updateLoyaltyCard = useUpdateLoyaltyCard()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [cardTarget, setCardTarget] = useState<Supermarket | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)
  const [removeCardOpen, setRemoveCardOpen] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const statsMap = new Map(stats.map((s) => [s.supermarket.id ?? 0, s]))
    const lastMap = new Map<number, number>()
    for (const ses of sessions) {
      lastMap.set(ses.supermarketId, Math.max(lastMap.get(ses.supermarketId) ?? 0, ses.startedAt))
    }
    return supermarkets.map((s) => {
      const st = statsMap.get(s.id ?? 0)
      const count = st?.sessionCount ?? 0
      const total = st?.totalSpentCents ?? 0
      return {
        supermarket: s,
        sessionCount: count,
        totalCents: total,
        avgCents: count > 0 ? Math.round(total / count) : 0,
        lastVisit: lastMap.get(s.id ?? 0) ?? null,
      }
    })
  }, [supermarkets, stats, sessions])

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    await upsertSupermarket(name)
    void qc.invalidateQueries({ queryKey: qk.supermarkets() })
    toast(t('supermercati.added', { name }), { description: t('supermercati.createdDesc') })
    setNewName('')
    setAddOpen(false)
  }

  const handleDelete = async (id: number, name: string) => {
    await deleteSupermarket(id)
    void qc.invalidateQueries({ queryKey: qk.supermarkets() })
    toast(t('supermercati.removed', { name }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cardTarget?.id) return
    try {
      const dataUrl = await compressImage(file)
      updateLoyaltyCard.mutate(
        { id: cardTarget.id, imageDataUrl: dataUrl },
        { onSuccess: () => setCardTarget(null) },
      )
    } catch {
      toast.error(t('supermercati.cardError'))
    }
  }

  const handleRemoveCard = () => {
    if (!cardTarget?.id) return
    updateLoyaltyCard.mutate(
      { id: cardTarget.id, imageDataUrl: null },
      { onSuccess: () => setCardTarget(null) },
    )
  }

  const columns: Column<Row>[] = [
    {
      key: 'name',
      label: t('desktop.supermercati.colName'),
      render: (r) => <span style={{ fontWeight: 500 }}>{r.supermarket.name}</span>,
      sortValue: (r) => r.supermarket.name.toLowerCase(),
    },
    {
      key: 'sessions',
      label: t('desktop.supermercati.colSessions'),
      align: 'right',
      render: (r) => r.sessionCount,
      sortValue: (r) => r.sessionCount,
    },
    {
      key: 'total',
      label: t('desktop.supermercati.colTotal'),
      align: 'right',
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>€{formatCents(r.totalCents)}</span>,
      sortValue: (r) => r.totalCents,
    },
    {
      key: 'avg',
      label: t('desktop.supermercati.colAvg'),
      align: 'right',
      render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>€{formatCents(r.avgCents)}</span>,
      sortValue: (r) => r.avgCents,
    },
    {
      key: 'last',
      label: t('desktop.supermercati.colLast'),
      render: (r) =>
        r.lastVisit === null ? (
          <span style={{ color: '#9B9B9F' }}>{t('desktop.supermercati.never')}</span>
        ) : (
          formatDate(r.lastVisit)
        ),
      sortValue: (r) => r.lastVisit ?? 0,
    },
    {
      key: 'card',
      label: t('desktop.supermercati.colCard'),
      render: (r) => (
        <button
          onClick={() => setCardTarget(r.supermarket)}
          aria-label={t('supermercati.loyaltyCard')}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'block',
            width: '48px',
            height: '30px',
            borderRadius: '7px',
            overflow: 'hidden',
          }}
        >
          {r.supermarket.loyaltyCard ? (
            <img
              src={r.supermarket.loyaltyCard}
              alt={t('supermercati.cardOf', { name: r.supermarket.name })}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                border: '1px dashed #D8D8D6',
                borderRadius: '7px',
                color: '#B5B5BA',
                fontSize: '16px',
              }}
            >
              +
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <button
          onClick={() => {
            const id = r.supermarket.id
            if (id !== undefined) setPendingDelete({ id, name: r.supermarket.name })
          }}
          aria-label={t('supermercati.deleteConfirm')}
          style={{ all: 'unset', cursor: 'pointer', opacity: 0.4, display: 'inline-flex' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      ),
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => void handleFileChange(e)}
      />
      <PageHeader
        title={t('supermercati.title')}
        subtitle={t('desktop.supermercati.subtitle')}
        right={
          <button onClick={() => setAddOpen(true)} style={primaryBtn}>
            {t('supermercati.add')}
          </button>
        }
      />
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <SortableTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.supermarket.id ?? r.supermarket.name}
          defaultSort={{ key: 'name', dir: 'asc' }}
          emptyMessage={t('supermercati.empty')}
        />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('supermercati.newTitle')}>
        <input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('supermercati.namePlaceholder')}
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            border: 'none',
            borderBottom: '1px solid #ECECEC',
            outline: 'none',
            background: 'transparent',
            padding: '10px 2px',
            fontSize: '16px',
            color: '#2A2A2C',
            marginBottom: '20px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={() => setAddOpen(false)} style={secondaryBtn}>
            {t('common.cancel')}
          </button>
          <button onClick={() => void handleAdd()} style={primaryBtn}>
            {t('common.add')}
          </button>
        </div>
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('supermercati.deleteConfirmTitle', { name: pendingDelete?.name ?? '' })}
      >
        <div style={{ fontSize: '14px', color: '#9B9B9F', marginBottom: '20px' }}>
          {t('supermercati.deleteConfirmBody')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={() => setPendingDelete(null)} style={secondaryBtn}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              if (pendingDelete) void handleDelete(pendingDelete.id, pendingDelete.name)
              setPendingDelete(null)
            }}
            style={dangerBtn}
          >
            {t('supermercati.deleteConfirm')}
          </button>
        </div>
      </Modal>

      <Modal open={cardTarget !== null && !removeCardOpen} onClose={() => setCardTarget(null)} title={t('supermercati.loyaltyCard')}>
        {cardTarget?.loyaltyCard ? (
          <>
            <img
              src={cardTarget.loyaltyCard}
              alt={t('supermercati.cardOf', { name: cardTarget.name })}
              style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '12px', background: '#F6F6F4' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <button onClick={() => setRemoveCardOpen(true)} style={{ ...linkBtn, color: '#D14343', fontSize: '14px' }}>
                {t('supermercati.removeCard')}
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={secondaryBtn}>
                {t('supermercati.replaceCard')}
              </button>
            </div>
          </>
        ) : (
          <button onClick={() => fileInputRef.current?.click()} style={{ ...primaryBtn, width: '100%' }}>
            {t('supermercati.addCard')}
          </button>
        )}
      </Modal>

      <Modal open={removeCardOpen} onClose={() => setRemoveCardOpen(false)} title={t('supermercati.removeCardConfirmTitle')}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={() => setRemoveCardOpen(false)} style={secondaryBtn}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              handleRemoveCard()
              setRemoveCardOpen(false)
            }}
            style={dangerBtn}
          >
            {t('supermercati.removeCardConfirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
