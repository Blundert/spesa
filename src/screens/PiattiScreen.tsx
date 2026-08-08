import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategories, useItems, useUpsertItem } from '../hooks/useItems'
import { useDishes, useSaveDish, useDeleteDish } from '../hooks/useDishes'
import { normalizeName } from '../lib/normalize'
import { BASE_ITEMS } from '../lib/baseItems'
import { BottomSheet } from '../components/BottomSheet'
import type { DishWithIngredients } from '../db/repositories/dishes'

interface Suggestion {
  name: string
  categoryId: number
}

interface EditorIngredient {
  id: number
  name: string
}

interface EditorState {
  id?: number
  name: string
  ingredients: EditorIngredient[]
}

export function PiattiScreen() {
  const { t } = useTranslation()

  const { data: dishes = [] } = useDishes()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0
  const saveDish = useSaveDish()
  const deleteDish = useDeleteDish()
  const upsertItem = useUpsertItem()

  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const [ingredientInput, setIngredientInput] = useState('')
  const [deleteDishState, setDeleteDishState] = useState<DishWithIngredients | null>(null)

  // Pool autocomplete: articoli base predefiniti + già usati (stesso pattern di ListaScreen).
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const pool = new Map<string, Suggestion>()
  for (const b of BASE_ITEMS) {
    pool.set(normalizeName(b.name), { name: b.name, categoryId: catIdByName.get(b.category) ?? altroId })
  }
  for (const it of items) {
    pool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId })
  }

  const selectedNorm = new Set((editorState?.ingredients ?? []).map((i) => normalizeName(i.name)))
  const ingQuery = normalizeName(ingredientInput)
  const ingredientMatches: Suggestion[] = ingQuery
    ? Array.from(pool.values())
        .filter((p) => {
          const n = normalizeName(p.name)
          return !selectedNorm.has(n) && n.includes(ingQuery)
        })
        .sort((a, b) => {
          const an = normalizeName(a.name)
          const bn = normalizeName(b.name)
          const aStarts = an.startsWith(ingQuery) ? 0 : 1
          const bStarts = bn.startsWith(ingQuery) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return an.localeCompare(bn)
        })
        .slice(0, 8)
    : []
  const ingredientExactInPool = pool.has(ingQuery)

  const openCreate = () => {
    setEditorState({ name: '', ingredients: [] })
    setIngredientInput('')
  }

  const openEdit = (dish: DishWithIngredients) => {
    setEditorState({
      id: dish.id,
      name: dish.name,
      ingredients: dish.ingredients.map((i) => ({ id: i.id as number, name: i.name })),
    })
    setIngredientInput('')
  }

  const handleAddIngredient = (name?: string, categoryId?: number) => {
    const finalName = (name ?? ingredientInput).trim()
    if (!finalName || !editorState) return
    const match = categoryId === undefined ? pool.get(normalizeName(finalName)) : undefined
    upsertItem.mutate(
      { name: finalName, categoryId: categoryId ?? match?.categoryId ?? altroId },
      {
        onSuccess: (itemId) => {
          setEditorState((prev) => {
            if (!prev) return prev
            if (prev.ingredients.some((i) => i.id === itemId)) return prev
            return { ...prev, ingredients: [...prev.ingredients, { id: itemId, name: finalName }] }
          })
        },
      },
    )
    setIngredientInput('')
  }

  const handleRemoveIngredient = (id: number) => {
    setEditorState((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) } : prev))
  }

  const handleSaveDish = () => {
    if (!editorState) return
    const name = editorState.name.trim()
    if (!name) return
    saveDish.mutate(
      { id: editorState.id, name, itemIds: editorState.ingredients.map((i) => i.id) },
      { onSuccess: () => setEditorState(null) },
    )
  }

  const handleConfirmDelete = () => {
    if (!deleteDishState?.id) return
    deleteDish.mutate(deleteDishState.id, { onSuccess: () => setDeleteDishState(null) })
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="px-1 pt-2 pb-[18px]">
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('piatti.title')}</span>
        </div>

        {dishes.length === 0 && (
          <div className="text-center py-10 text-[#9B9B9F] text-sm">{t('piatti.empty')}</div>
        )}

        {dishes.map((dish) => (
          <div key={dish.id} className="flex items-center gap-3 bg-white rounded-[20px] px-5 py-[18px] mb-[10px]">
            <div className="flex-1 min-w-0">
              <div className="text-base font-normal text-[#2A2A2C] truncate">{dish.name}</div>
              <div className="text-[13px] text-[#9B9B9F] mt-0.5">
                {t('piatti.ingredientCount', { count: dish.ingredients.length })}
              </div>
            </div>

            <button
              onClick={() => openEdit(dish)}
              className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
              aria-label={t('piatti.editTitle')}
            >
              <PencilIcon />
            </button>

            <button
              onClick={() => setDeleteDishState(dish)}
              className="w-8 h-8 flex items-center justify-center opacity-40 active:opacity-80 transition-opacity"
              aria-label={t('piatti.deleteConfirm')}
            >
              <TrashIcon />
            </button>
          </div>
        ))}

        <button
          onClick={openCreate}
          className="w-full flex items-center gap-3 bg-white rounded-[20px] px-5 py-[18px] active:bg-[#F6F6F4] transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-[13px] bg-[#F2F2F0] flex items-center justify-center flex-none">
            <PlusIcon />
          </div>
          <span className="text-base text-[#9B9B9F]">{t('piatti.add')}</span>
        </button>
      </div>

      {/* Sheet: crea/modifica piatto */}
      <BottomSheet open={editorState !== null} onClose={() => setEditorState(null)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">
          {editorState?.id !== undefined ? t('piatti.editTitle') : t('piatti.newTitle')}
        </div>
        <input
          value={editorState?.name ?? ''}
          onChange={(e) => setEditorState((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveDish()}
          placeholder={t('piatti.namePlaceholder')}
          autoFocus
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-4"
        />

        <div className="text-[11px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-0.5 pb-2">
          {t('piatti.ingredientsSection')}
        </div>

        {editorState && editorState.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {editorState.ingredients.map((ing) => (
              <button
                key={ing.id}
                onClick={() => handleRemoveIngredient(ing.id)}
                className="flex items-center gap-1.5 px-3 py-[7px] bg-[#F2F2F0] rounded-full text-[13px] text-[#2A2A2C] active:bg-[#E6E6E4]"
              >
                {ing.name}
                <CloseIcon />
              </button>
            ))}
          </div>
        )}
        {editorState && editorState.ingredients.length === 0 && (
          <div className="text-[13px] text-[#9B9B9F] mb-3">{t('piatti.noIngredients')}</div>
        )}

        <input
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
          placeholder={t('piatti.ingredientsPlaceholder')}
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[15px] text-[#2A2A2C] mb-2"
        />

        {ingredientInput.trim() && (
          <div className="bg-[#F6F6F4] rounded-[14px] overflow-hidden mb-4 divide-y divide-[#ECECEC]">
            {ingredientMatches.map((p) => (
              <button
                key={p.name}
                onClick={() => handleAddIngredient(p.name, p.categoryId)}
                className="w-full text-left px-4 py-[11px] text-[14px] text-[#2A2A2C] active:bg-[#ECECEC]"
              >
                {p.name}
              </button>
            ))}
            {!ingredientExactInPool && (
              <button
                onClick={() => handleAddIngredient()}
                className="w-full text-left px-4 py-[11px] text-[14px] text-[#2A2A2C] active:bg-[#ECECEC]"
              >
                {t('piatti.addNamed', { name: ingredientInput.trim() })}
              </button>
            )}
          </div>
        )}

        <button
          onClick={handleSaveDish}
          disabled={!editorState?.name.trim()}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform disabled:opacity-40"
        >
          {t('common.save')}
        </button>
      </BottomSheet>

      {/* Sheet: conferma elimina piatto */}
      <BottomSheet open={deleteDishState !== null} onClose={() => setDeleteDishState(null)}>
        <div className="text-[20px] font-normal text-[#D14343] px-0.5 pb-2">
          {t('piatti.deleteTitle', { name: deleteDishState?.name ?? '' })}
        </div>
        <div className="text-[15px] text-[#9B9B9F] px-0.5 pb-6">{t('piatti.deleteBody')}</div>
        <button
          onClick={handleConfirmDelete}
          className="w-full bg-[#D14343] text-white text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('piatti.deleteConfirm')}
        </button>
        <button
          onClick={() => setDeleteDishState(null)}
          className="w-full bg-[#F2F2F0] text-[#2A2A2C] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>
    </>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9B9B9F" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
