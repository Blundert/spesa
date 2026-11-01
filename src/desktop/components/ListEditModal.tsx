import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { ShoppingList, Supermarket } from '../../db/types'
import { useArchiveList, useCreateList, useUpdateList } from '../../hooks/useShoppingLists'
import { setActiveListId } from '../../lib/activeList'
import { Modal } from './Modal'
import { btnPrimary, btnSecondary } from './buttonStyles'

/** Crea una lista (list null) o modifica quella passata: nome, supermercato facoltativo, archivia. */
export function ListEditModal({
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
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose} title={list ? t('lists.editTitle') : t('lists.newTitle')}>
      {open && (
        <ListForm key={list?.id ?? 'new'} list={list} canArchive={canArchive} supermarkets={supermarkets} onDone={onClose} />
      )}
    </Modal>
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

  return (
    <>
      <input
        autoFocus={!list}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('lists.namePlaceholder')}
        onKeyDown={(e) => e.key === 'Enter' && void handleSave()}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '10px 14px',
          marginBottom: '18px',
          borderRadius: '10px',
          border: '1px solid #ECECEC',
          background: '#F6F6F4',
          fontSize: '15px',
          color: '#2A2A2C',
          outline: 'none',
        }}
      />
      <label
        htmlFor="list-supermarket"
        style={{ display: 'block', fontSize: '12px', color: '#9B9B9F', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}
      >
        {t('lists.supermarket')}
      </label>
      <select
        id="list-supermarket"
        value={supermarketId ?? ''}
        onChange={(e) => setSupermarketId(e.target.value === '' ? null : Number(e.target.value))}
        style={{
          width: '100%',
          padding: '10px 12px',
          marginBottom: '24px',
          borderRadius: '10px',
          border: '1px solid #ECECEC',
          background: '#F6F6F4',
          fontSize: '14px',
          color: '#2A2A2C',
        }}
      >
        <option value="">{t('lists.noSupermarket')}</option>
        {supermarkets.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        {list && canArchive && (
          <button onClick={() => void handleArchive()} style={{ ...btnSecondary, marginRight: 'auto' }}>
            {t('lists.archive')}
          </button>
        )}
        <button onClick={onDone} style={btnSecondary}>
          {t('common.cancel')}
        </button>
        <button
          onClick={() => void handleSave()}
          disabled={!name.trim()}
          style={{ ...btnPrimary, opacity: name.trim() ? 1 : 0.4 }}
        >
          {list ? t('common.save') : t('lists.create')}
        </button>
      </div>
    </>
  )
}
