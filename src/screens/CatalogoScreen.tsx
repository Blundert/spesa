import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useCategories, useItems } from '../hooks/useItems'
import {
  useAddCategory,
  useRenameCategory,
  useDeleteCategory,
  useRenameItem,
  useMoveItemCategory,
  useDeleteItemFromCatalog,
} from '../hooks/useCatalogo'
import { BottomSheet } from '../components/BottomSheet'
import { db } from '../db/db'
import type { Category, Item } from '../db/types'

export function CatalogoScreen() {
  const { t } = useTranslation()

  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()

  // Categoria: stati sheet
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [renameCat, setRenameCat] = useState<Category | null>(null)
  const [renameCatName, setRenameCatName] = useState('')
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)

  // Articolo: stati sheet
  const [renameItem, setRenameItem] = useState<Item | null>(null)
  const [renameItemName, setRenameItemName] = useState('')
  const [moveCatItem, setMoveCatItem] = useState<Item | null>(null)
  const [moveCatItemCatId, setMoveCatItemCatId] = useState<number>(0)
  const [deleteItemState, setDeleteItemState] = useState<Item | null>(null)

  const addCategory = useAddCategory()
  const renameCategory = useRenameCategory()
  const deleteCategory = useDeleteCategory()
  const renameItemMutation = useRenameItem()
  const moveItemCategory = useMoveItemCategory()
  const deleteItemMutation = useDeleteItemFromCatalog()

  // Mappa categoryId → count articoli
  const itemCountByCategory = categories.reduce<Record<number, number>>((acc, c) => {
    if (c.id !== undefined) acc[c.id] = items.filter((i) => i.categoryId === c.id).length
    return acc
  }, {})

  const handleAddCategory = () => {
    const name = newCatName.trim()
    if (!name) return
    addCategory.mutate(name, {
      onSuccess: () => {
        setNewCatName('')
        setAddCatOpen(false)
      },
    })
  }

  const handleRenameCategory = () => {
    if (!renameCat?.id) return
    const name = renameCatName.trim()
    if (!name) return
    renameCategory.mutate(
      { id: renameCat.id, name },
      { onSuccess: () => setRenameCat(null) },
    )
  }

  const handleDeleteCategory = () => {
    if (!deleteCat?.id) return
    deleteCategory.mutate(deleteCat.id, { onSuccess: () => setDeleteCat(null) })
  }

  const handleRenameItem = () => {
    if (!renameItem?.id) return
    const name = renameItemName.trim()
    if (!name) return
    if (name === renameItem.name) {
      setRenameItem(null)
      return
    }
    renameItemMutation.mutate(
      { id: renameItem.id, name },
      {
        onSuccess: () => {
          toast(t('catalogo.renamed', { name }))
          setRenameItem(null)
        },
      },
    )
  }

  const handleMoveCategory = (categoryId: number) => {
    if (!moveCatItem?.id) return
    if (categoryId === moveCatItem.categoryId) {
      setMoveCatItem(null)
      return
    }
    moveItemCategory.mutate(
      { id: moveCatItem.id, categoryId },
      { onSuccess: () => setMoveCatItem(null) },
    )
  }

  const handleDeleteItem = async (item: Item) => {
    if (!item.id) return
    const count = await db.purchases.where('itemId').equals(item.id).count()
    if (count > 0) {
      toast.error(t('catalogo.deleteItemHasPurchases'))
      return
    }
    setDeleteItemState(item)
  }

  const handleConfirmDeleteItem = () => {
    if (!deleteItemState?.id) return
    deleteItemMutation.mutate(deleteItemState.id, {
      onSuccess: () => setDeleteItemState(null),
    })
  }

  // Raggruppa articoli per categoria
  const itemsByCategory = categories.reduce<Record<number, Item[]>>((acc, c) => {
    if (c.id !== undefined) acc[c.id] = items.filter((i) => i.categoryId === c.id)
    return acc
  }, {})

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="px-1 pt-2 pb-[18px]">
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">
            {t('catalogo.title')}
          </span>
        </div>

        {/* ── Sezione categorie ── */}
        <div className="text-[11px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-1 pb-[10px]">
          {t('catalogo.categoriesSection')}
        </div>

        {categories.map((c) => {
          const count = c.id !== undefined ? (itemCountByCategory[c.id] ?? 0) : 0
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 bg-white rounded-[20px] px-5 py-[18px] mb-[10px]"
            >
              <div className="flex-1 min-w-0">
                <div className="text-base font-normal text-[#2A2A2C] truncate">{c.name}</div>
                <div className="text-[13px] text-[#9B9B9F] mt-0.5">
                  {t('catalogo.itemCount', { count })}
                </div>
              </div>

              {/* Rinomina */}
              <button
                onClick={() => {
                  setRenameCat(c)
                  setRenameCatName(c.name)
                }}
                className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
                aria-label={t('catalogo.renameCategoryTitle')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2A2A2C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>

              {/* Elimina */}
              <button
                onClick={() => count === 0 && setDeleteCat(c)}
                className={`w-8 h-8 flex items-center justify-center transition-opacity ${count > 0 ? 'opacity-20' : 'opacity-40 active:opacity-80'}`}
                aria-label={t('catalogo.deleteCategoryConfirm')}
                aria-disabled={count > 0}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2A2A2C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          )
        })}

        {/* Aggiungi categoria */}
        <button
          onClick={() => setAddCatOpen(true)}
          className="w-full flex items-center gap-3 bg-white rounded-[20px] px-5 py-[18px] mb-[28px] active:bg-[#F6F6F4] transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-[13px] bg-[#F2F2F0] flex items-center justify-center flex-none">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2A2A2C"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-base text-[#9B9B9F]">{t('catalogo.addCategory')}</span>
        </button>

        {/* ── Sezione articoli ── */}
        <div className="text-[11px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-1 pb-[10px]">
          {t('catalogo.itemsSection')}
        </div>

        {items.length === 0 && (
          <div className="text-center py-10 text-[#9B9B9F] text-sm">
            {t('catalogo.emptyItems')}
          </div>
        )}

        {categories.map((c) => {
          const catItems = c.id !== undefined ? (itemsByCategory[c.id] ?? []) : []
          if (catItems.length === 0) return null
          return (
            <div key={c.id} className="mb-[18px]">
              <div className="text-[11px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-1 pb-[10px]">
                {c.name}
              </div>
              <div className="bg-white rounded-[20px] overflow-hidden">
                {catItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-5 py-[15px]"
                    style={{
                      borderBottom: idx < catItems.length - 1 ? '1px solid #ECECEC' : 'none',
                    }}
                  >
                    <span className="flex-1 text-base text-[#2A2A2C] truncate">{item.name}</span>

                    {/* Rinomina */}
                    <button
                      onClick={() => {
                        setRenameItem(item)
                        setRenameItemName(item.name)
                      }}
                      className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
                      aria-label={t('catalogo.renameItemTitle')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2A2A2C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>

                    {/* Cambia categoria */}
                    <button
                      onClick={() => {
                        setMoveCatItem(item)
                        setMoveCatItemCatId(item.categoryId)
                      }}
                      className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
                      aria-label={t('catalogo.changeCategoryTitle')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2A2A2C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </button>

                    {/* Elimina */}
                    <button
                      onClick={() => void handleDeleteItem(item)}
                      className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
                      aria-label={t('catalogo.deleteItemConfirm')}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2A2A2C"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sheet: aggiungi categoria */}
      <BottomSheet open={addCatOpen} onClose={() => setAddCatOpen(false)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">
          {t('catalogo.newCategoryTitle')}
        </div>
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          placeholder={t('catalogo.namePlaceholder')}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-3"
        />
        <button
          onClick={handleAddCategory}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.add')}
        </button>
      </BottomSheet>

      {/* Sheet: rinomina categoria */}
      <BottomSheet open={renameCat !== null} onClose={() => setRenameCat(null)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">
          {t('catalogo.renameCategoryTitle')}
        </div>
        <input
          value={renameCatName}
          onChange={(e) => setRenameCatName(e.target.value)}
          placeholder={t('catalogo.namePlaceholder')}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory()}
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-3"
        />
        <button
          onClick={handleRenameCategory}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.save')}
        </button>
      </BottomSheet>

      {/* Sheet: conferma elimina categoria */}
      <BottomSheet open={deleteCat !== null} onClose={() => setDeleteCat(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('catalogo.deleteCategoryTitle', { name: deleteCat?.name ?? '' })}
        </div>
        <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">
          {t('catalogo.deleteCategoryBody')}
        </div>
        <button
          onClick={handleDeleteCategory}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('catalogo.deleteCategoryConfirm')}
        </button>
        <button
          onClick={() => setDeleteCat(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Sheet: rinomina articolo */}
      <BottomSheet open={renameItem !== null} onClose={() => setRenameItem(null)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">
          {t('catalogo.renameItemTitle')}
        </div>
        <input
          value={renameItemName}
          onChange={(e) => setRenameItemName(e.target.value)}
          placeholder={t('catalogo.itemNamePlaceholder')}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleRenameItem()}
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-4"
        />
        <button
          onClick={handleRenameItem}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.save')}
        </button>
      </BottomSheet>

      {/* Sheet: cambia categoria articolo */}
      <BottomSheet open={moveCatItem !== null} onClose={() => setMoveCatItem(null)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[14px]">
          {t('catalogo.changeCategoryTitle')}
        </div>
        <div className="bg-[#F6F6F4] rounded-[16px] overflow-hidden">
          {categories.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => c.id !== undefined && handleMoveCategory(c.id)}
              className="w-full flex items-center justify-between px-4 py-[15px] active:opacity-60 transition-opacity"
              style={{
                borderBottom: idx < categories.length - 1 ? '1px solid #E6E6E2' : 'none',
              }}
            >
              <span className="text-[16px] text-[#2A2A2C]">{c.name}</span>
              {moveCatItemCatId === c.id && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2A2A2C"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Sheet: conferma elimina articolo */}
      <BottomSheet open={deleteItemState !== null} onClose={() => setDeleteItemState(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('catalogo.deleteItemTitle', { name: deleteItemState?.name ?? '' })}
        </div>
        <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">
          {t('catalogo.deleteItemBody')}
        </div>
        <button
          onClick={handleConfirmDeleteItem}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('catalogo.deleteItemConfirm')}
        </button>
        <button
          onClick={() => setDeleteItemState(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}
