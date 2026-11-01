import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ShoppingList, Supermarket } from '../db/types'
import { useArchiveList, useCreateList, useUpdateList } from '../hooks/useShoppingLists'
import { setActiveListId } from '../lib/activeList'
import { BottomSheet } from './BottomSheet'

// Crea una lista (list null) o modifica quella passata: nome, supermercato facoltativo,
// e in modifica "Archivia lista" (assente se è l'ultima attiva).
export function ListEditSheet({
  open,
  onClose,
  list,
  canArchive,
  supermarkets,
}: {
  open: boolean
  onClose: () => void
  list: ShoppingList | null
  canArchive: boolean
  supermarkets: Supermarket[]
}) {
  return (
    <BottomSheet open={open} onClose={onClose} hasInput>
      {/* key: il form riparte dai valori della lista a ogni apertura */}
      {open && (
        <ListForm key={list?.id ?? 'new'} list={list} canArchive={canArchive} supermarkets={supermarkets} onDone={onClose} />
      )}
    </BottomSheet>
  )
}

function ListForm({
  list,
  canArchive,
  supermarkets,
  onDone,
}: {
  list: ShoppingList | null
  canArchive: boolean
  supermarkets: Supermarket[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(list?.name ?? '')
  const [supermarketId, setSupermarketId] = useState<number | null>(list?.supermarketId ?? null)
  const createList = useCreateList()
  const updateList = useUpdateList()
  const archiveList = useArchiveList()

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (list?.id !== undefined) {
      await updateList.mutateAsync({ id: list.id, name: trimmed, supermarketId })
    } else {
      const id = await createList.mutateAsync({ name: trimmed, supermarketId })
      setActiveListId(id)
      toast(t('lists.created', { name: trimmed }))
    }
    onDone()
  }

  const handleArchive = async () => {
    if (list?.id === undefined) return
    await archiveList.mutateAsync(list.id)
    toast(t('lists.archived', { name: list.name }))
    onDone()
  }

  const options: Array<{ id: number | null; label: string }> = [
    { id: null, label: t('lists.noSupermarket') },
    ...supermarkets.map((s) => ({ id: s.id as number, label: s.name })),
  ]

  return (
    <>
      <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">
        {list ? t('lists.editTitle') : t('lists.newTitle')}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('lists.namePlaceholder')}
        data-autofocus={list ? undefined : true}
        onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
        className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-5"
      />

      <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-2">
        {t('lists.supermarket')}
      </div>
      <div className="bg-[#F6F6F4] rounded-[18px] overflow-hidden mb-5">
        {options.map((o, i) => (
          <button
            key={o.id ?? 'none'}
            onClick={() => setSupermarketId(o.id)}
            className="w-full flex items-center justify-between px-[18px] py-[14px] text-left active:bg-[#ECECEC]"
            style={{ borderBottom: i < options.length - 1 ? '1px solid #E6E6E2' : 'none' }}
          >
            <span className={`text-[16px] ${o.id === null ? 'text-[#6E6E72]' : 'text-[#2A2A2C]'}`}>{o.label}</span>
            {supermarketId === o.id && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4 4 10-10" />
              </svg>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => void handleSave()}
        disabled={!name.trim()}
        className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform disabled:opacity-40"
      >
        {list ? t('common.save') : t('lists.create')}
      </button>
      {list && canArchive && (
        <button
          onClick={() => void handleArchive()}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('lists.archive')}
        </button>
      )}
    </>
  )
}
