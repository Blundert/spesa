import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ShoppingList } from '../db/types'
import { useSupermarkets } from '../hooks/useItems'
import {
  useDeleteList,
  useListItemCounts,
  useReorderLists,
  useRestoreList,
  useShoppingLists,
} from '../hooks/useShoppingLists'
import { activeLists } from '../lib/activeList'
import { BackButton } from '../components/BackButton'
import { BottomSheet } from '../components/BottomSheet'
import { ListEditSheet } from '../components/ListEditSheet'

// Gestione delle liste: ordine delle schede, modifica, archiviate (ripristina / elimina).
export function ListeScreen() {
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

  // Scambia una lista con la vicina; le archiviate tengono il loro posto in coda.
  const move = (index: number, delta: number) => {
    const ids = active.map((l) => l.id as number)
    const [moved] = ids.splice(index, 1)
    ids.splice(index + delta, 0, moved)
    reorder.mutate([...ids, ...archived.map((l) => l.id as number)])
  }

  const subtitle = (l: ShoppingList) =>
    [l.supermarketId !== null ? supermarketNames[l.supermarketId] : undefined, t('lists.items', { count: counts[l.id as number] ?? 0 })]
      .filter(Boolean)
      .join(' · ')

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
      <div className="flex items-center gap-2 pt-2 pb-[18px]">
        <BackButton />
        <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">{t('lists.title')}</span>
      </div>

      <div className="bg-t-surface rounded-[20px] overflow-hidden mb-[10px]">
        {active.map((l, i) => (
          <div
            key={l.id}
            className="flex items-center gap-2 pl-5 pr-3 py-[14px]"
            style={{ borderBottom: i < active.length - 1 ? '1px solid var(--t-line)' : 'none' }}
          >
            <button onClick={() => setEditing(l)} className="flex-1 min-w-0 text-left active:opacity-50">
              <div className="text-base text-t-fg truncate">{l.name}</div>
              <div className="text-[12px] text-t-muted mt-0.5 truncate">{subtitle(l)}</div>
            </button>
            <ArrowButton dir="up" disabled={i === 0} label={t('lists.moveUp', { name: l.name })} onClick={() => move(i, -1)} />
            <ArrowButton
              dir="down"
              disabled={i === active.length - 1}
              label={t('lists.moveDown', { name: l.name })}
              onClick={() => move(i, 1)}
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => setEditing('new')}
        className="w-full flex items-center gap-2.5 bg-t-surface rounded-[20px] px-5 py-4 mb-6 active:bg-t-surface2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-muted)" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-base text-t-muted">{t('lists.newList')}</span>
      </button>

      {archived.length > 0 && (
        <>
          <div className="text-[12px] font-normal tracking-[1.2px] text-t-muted uppercase px-1.5 pb-[13px]">
            {t('lists.archivedSection')}
          </div>
          <div className="bg-t-surface rounded-[20px] overflow-hidden">
            {archived.map((l, i) => (
              <div
                key={l.id}
                className="flex items-center gap-3 px-5 py-[14px]"
                style={{ borderBottom: i < archived.length - 1 ? '1px solid var(--t-line)' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-base text-t-text2 truncate">{l.name}</div>
                  <div className="text-[12px] text-t-muted mt-0.5 truncate">{subtitle(l)}</div>
                </div>
                <button
                  onClick={() =>
                    restore.mutate(l.id as number, { onSuccess: () => toast(t('lists.restored', { name: l.name })) })
                  }
                  className="flex-none text-[14px] text-t-fg bg-t-bg px-3 py-[7px] rounded-full active:opacity-60"
                >
                  {t('lists.restore')}
                </button>
                <button
                  onClick={() => setPendingDelete(l)}
                  className="flex-none text-[14px] text-t-danger px-1 py-[7px] active:opacity-60"
                >
                  {t('lists.delete')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <ListEditSheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        list={editing === 'new' ? null : editing}
        canArchive={active.length > 1}
        supermarkets={supermarkets}
      />

      {/* Conferma eliminazione definitiva di una lista archiviata */}
      <BottomSheet open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-2">
          {t('lists.deleteConfirmTitle', { name: pendingDelete?.name ?? '' })}
        </div>
        <div className="text-[15px] text-t-muted px-0.5 pb-6">{t('lists.deleteConfirmBody')}</div>
        <button
          onClick={() => {
            const target = pendingDelete
            setPendingDelete(null)
            if (target?.id !== undefined) {
              remove.mutate(target.id, { onSuccess: () => toast(t('lists.deleted', { name: target.name })) })
            }
          }}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('lists.deleteConfirm')}
        </button>
        <button
          onClick={() => setPendingDelete(null)}
          className="w-full bg-t-bg text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </div>
  )
}

function ArrowButton({
  dir,
  disabled,
  label,
  onClick,
}: {
  dir: 'up' | 'down'
  disabled: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-8 h-8 flex-none rounded-full bg-t-bg flex items-center justify-center active:bg-t-line4 disabled:opacity-30"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={dir === 'up' ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} />
      </svg>
    </button>
  )
}
