import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ShoppingList } from '../../db/types'
import { useSupermarkets } from '../../hooks/useItems'
import {
  useDeleteList,
  useListItemCounts,
  useReorderLists,
  useRestoreList,
  useShoppingLists,
} from '../../hooks/useShoppingLists'
import { activeLists } from '../../lib/activeList'
import { compareNames } from '../../lib/normalize'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { Modal } from '../components/Modal'
import { ListEditModal } from '../components/ListEditModal'
import { btnDanger, btnPrimary, btnSecondary } from '../components/buttonStyles'

const card = { background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' } as const
const linkBtn = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '14px' } as const

export function DesktopListeScreen() {
  const { t } = useTranslation()
  const { data: lists = [] } = useShoppingLists()
  const { data: counts = {} } = useListItemCounts()
  const { data: supermarkets = [] } = useSupermarkets()
  const reorder = useReorderLists()
  const restore = useRestoreList()
  const remove = useDeleteList()
  const [editing, setEditing] = useState<ShoppingList | 'new' | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ShoppingList | null>(null)

  const active = activeLists(lists)
  const archived = lists.filter((l) => l.archivedAt !== null)
  const supermarketNames = Object.fromEntries(supermarkets.map((s) => [s.id ?? 0, s.name]))
  const storeOf = (l: ShoppingList) => (l.supermarketId !== null ? (supermarketNames[l.supermarketId] ?? '') : '')

  // Scambia una lista con la vicina; le archiviate tengono il loro posto in coda.
  const move = (index: number, delta: number) => {
    const ids = active.map((l) => l.id as number)
    const [moved] = ids.splice(index, 1)
    ids.splice(index + delta, 0, moved)
    reorder.mutate([...ids, ...archived.map((l) => l.id as number)])
  }

  const arrow = (index: number, delta: number, label: string, glyph: string) => {
    const disabled = index + delta < 0 || index + delta >= active.length
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          move(index, delta)
        }}
        disabled={disabled}
        aria-label={label}
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: 'none',
          background: '#F2F2F0',
          color: '#2A2A2C',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.3 : 1,
          marginLeft: '6px',
        }}
      >
        {glyph}
      </button>
    )
  }

  const activeColumns: Column<ShoppingList>[] = [
    {
      key: 'order',
      label: '#',
      render: (l) => active.findIndex((a) => a.id === l.id) + 1,
      sortValue: (l) => active.findIndex((a) => a.id === l.id),
    },
    { key: 'name', label: t('desktop.liste.colName'), render: (l) => l.name, sortValue: (l) => l.name.toLowerCase() },
    {
      key: 'store',
      label: t('lists.supermarket'),
      render: (l) => storeOf(l) || '—',
      sortValue: (l) => storeOf(l).toLowerCase(),
    },
    {
      key: 'items',
      label: t('desktop.liste.colItems'),
      align: 'right',
      render: (l) => t('lists.items', { count: counts[l.id as number] ?? 0 }),
      sortValue: (l) => counts[l.id as number] ?? 0,
    },
    {
      key: 'move',
      label: t('desktop.liste.colOrder'),
      align: 'right',
      render: (l) => {
        const i = active.findIndex((a) => a.id === l.id)
        return (
          <span style={{ whiteSpace: 'nowrap' }}>
            {arrow(i, -1, t('lists.moveUp', { name: l.name }), '▲')}
            {arrow(i, 1, t('lists.moveDown', { name: l.name }), '▼')}
          </span>
        )
      },
    },
  ]

  const archivedColumns: Column<ShoppingList>[] = [
    { key: 'name', label: t('desktop.liste.colName'), render: (l) => l.name, sortValue: (l) => l.name.toLowerCase() },
    {
      key: 'store',
      label: t('lists.supermarket'),
      render: (l) => storeOf(l) || '—',
      sortValue: (l) => storeOf(l).toLowerCase(),
    },
    {
      key: 'items',
      label: t('desktop.liste.colItems'),
      align: 'right',
      render: (l) => t('lists.items', { count: counts[l.id as number] ?? 0 }),
      sortValue: (l) => counts[l.id as number] ?? 0,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (l) => (
        <span style={{ display: 'inline-flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() =>
              restore.mutate(l.id as number, { onSuccess: () => toast(t('lists.restored', { name: l.name })) })
            }
            style={{ ...linkBtn, color: '#2A2A2C' }}
          >
            {t('lists.restore')}
          </button>
          <button onClick={() => setPendingDelete(l)} style={{ ...linkBtn, color: '#D14343' }}>
            {t('lists.delete')}
          </button>
        </span>
      ),
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader
        title={t('lists.title')}
        subtitle={t('desktop.liste.subtitle')}
        right={
          <button onClick={() => setEditing('new')} style={btnPrimary}>
            + {t('lists.newList')}
          </button>
        }
      />

      <div style={card}>
        <SectionTitle>{t('desktop.liste.activeSection')}</SectionTitle>
        <SortableTable
          columns={activeColumns}
          rows={active}
          rowKey={(l) => l.id as number}
          defaultSort={{ key: 'order', dir: 'asc' }}
          onRowClick={(l) => setEditing(l)}
        />
      </div>

      {archived.length > 0 && (
        <div style={card}>
          <SectionTitle>{t('lists.archivedSection')}</SectionTitle>
          <SortableTable
            columns={archivedColumns}
            rows={[...archived].sort((a, b) => compareNames(a.name, b.name))}
            rowKey={(l) => l.id as number}
          />
        </div>
      )}

      <ListEditModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        list={editing === 'new' ? null : editing}
        canArchive={active.length > 1}
        supermarkets={supermarkets}
      />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('lists.deleteConfirmTitle', { name: pendingDelete?.name ?? '' })}
      >
        <div style={{ fontSize: '14px', color: '#9B9B9F', marginBottom: '24px' }}>{t('lists.deleteConfirmBody')}</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={() => setPendingDelete(null)} style={btnSecondary}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              const target = pendingDelete
              setPendingDelete(null)
              if (target?.id !== undefined) {
                remove.mutate(target.id, { onSuccess: () => toast(t('lists.deleted', { name: target.name })) })
              }
            }}
            style={btnDanger}
          >
            {t('lists.deleteConfirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
