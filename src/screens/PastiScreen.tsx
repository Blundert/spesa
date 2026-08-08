import { useState } from 'react'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { dayShort, dayFull, formatWeekLabel, shiftWeek } from '../lib/date'
import { useMealPlan, useSetMealSlotDish, useImportMealPlanToList } from '../hooks/useMealPlan'
import { useDishes, useSaveDish } from '../hooks/useDishes'
import { useCategories, useItems, useUpsertItem } from '../hooks/useItems'
import { useWeekBudget, useSetBuoniAvailable } from '../hooks/useShopping'
import { normalizeName } from '../lib/normalize'
import { BASE_ITEMS } from '../lib/baseItems'
import { BottomSheet } from '../components/BottomSheet'
import type { MealPlanDay } from '../db/repositories/mealPlan'
import type { MealType } from '../db/types'

interface Suggestion {
  name: string
  categoryId: number
}

interface SlotIngredient {
  id: number
  name: string
  checked: boolean
}

interface SlotState {
  dayIndex: number
  mealType: MealType
  nameInput: string
  dishId?: number
  isNewDish: boolean
  hadExisting: boolean
  ingredients: SlotIngredient[]
}

export function PastiScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { week } = useSearch({ from: '/pasti' })
  const { data: days = [] } = useMealPlan(week)
  const { data: dishes = [] } = useDishes()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const { data: budget } = useWeekBudget(week)
  const setBuoni = useSetBuoniAvailable(week)
  const setMealSlotDish = useSetMealSlotDish(week)
  const importToList = useImportMealPlanToList(week)
  const saveDish = useSaveDish()
  const upsertItem = useUpsertItem()
  const buoniAvailable = budget?.buoniAvailable ?? 0

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0

  const [slotState, setSlotState] = useState<SlotState | null>(null)
  const [ingredientInput, setIngredientInput] = useState('')

  const goToWeek = (delta: number) =>
    void navigate({ to: '/pasti', search: { week: shiftWeek(week, delta) } })

  const handleGenerate = () => {
    void navigate({ to: '/lista' })
  }

  const handleImportAndGenerate = () => {
    importToList.mutate(undefined, { onSuccess: () => void navigate({ to: '/lista' }) })
  }

  const openSlot = (day: MealPlanDay, mealType: MealType) => {
    const dishId = mealType === 0 ? day.pranzoDishId : day.cenaDishId
    const dishName = mealType === 0 ? day.pranzo : day.cena
    const selectedIds = mealType === 0 ? day.pranzoSelectedItemIds : day.cenaSelectedItemIds
    const existingId = mealType === 0 ? day.pranzoId : day.cenaId
    const dish = dishId !== undefined ? dishes.find((d) => d.id === dishId) : undefined

    setSlotState({
      dayIndex: day.dayIndex,
      mealType,
      nameInput: dishName,
      dishId,
      isNewDish: false,
      hadExisting: existingId !== undefined,
      ingredients:
        dishId !== undefined
          ? (dish?.ingredients ?? []).map((i) => ({
              id: i.id as number,
              name: i.name,
              checked: selectedIds.includes(i.id as number),
            }))
          : [],
    })
    setIngredientInput('')
  }

  // ── Ricerca piatto (dishId non ancora risolto) ──
  const dishQuery = normalizeName(slotState?.nameInput ?? '')
  const dishMatches =
    dishQuery && slotState && slotState.dishId === undefined && !slotState.isNewDish
      ? dishes
          .filter((d) => normalizeName(d.name).includes(dishQuery))
          .sort((a, b) => {
            const an = normalizeName(a.name)
            const bn = normalizeName(b.name)
            const aStarts = an.startsWith(dishQuery) ? 0 : 1
            const bStarts = bn.startsWith(dishQuery) ? 0 : 1
            if (aStarts !== bStarts) return aStarts - bStarts
            return an.localeCompare(bn)
          })
          .slice(0, 8)
      : []
  const dishExactMatch = dishes.some((d) => normalizeName(d.name) === dishQuery)

  const selectExistingDish = (dishId: number, name: string) => {
    const dish = dishes.find((d) => d.id === dishId)
    setSlotState((prev) =>
      prev
        ? {
            ...prev,
            nameInput: name,
            dishId,
            isNewDish: false,
            ingredients: (dish?.ingredients ?? []).map((i) => ({
              id: i.id as number,
              name: i.name,
              checked: true,
            })),
          }
        : prev,
    )
  }

  const handleCreateNewDish = () => {
    setSlotState((prev) => (prev ? { ...prev, isNewDish: true, dishId: undefined, ingredients: [] } : prev))
  }

  const handleChangeDish = () => {
    setSlotState((prev) =>
      prev ? { ...prev, dishId: undefined, isNewDish: false, ingredients: [], nameInput: '' } : prev,
    )
    setIngredientInput('')
  }

  const toggleIngredient = (id: number) => {
    setSlotState((prev) =>
      prev
        ? { ...prev, ingredients: prev.ingredients.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) }
        : prev,
    )
  }

  // ── Costruzione ingredienti di un piatto nuovo ──
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const itemPool = new Map<string, Suggestion>()
  for (const b of BASE_ITEMS) {
    itemPool.set(normalizeName(b.name), { name: b.name, categoryId: catIdByName.get(b.category) ?? altroId })
  }
  for (const it of items) {
    itemPool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId })
  }

  const selectedIngredientNorm = new Set((slotState?.ingredients ?? []).map((i) => normalizeName(i.name)))
  const ingQuery = normalizeName(ingredientInput)
  const ingredientMatches: Suggestion[] = ingQuery
    ? Array.from(itemPool.values())
        .filter((p) => {
          const n = normalizeName(p.name)
          return !selectedIngredientNorm.has(n) && n.includes(ingQuery)
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
  const ingredientExactInPool = itemPool.has(ingQuery)

  const handleAddIngredient = (name?: string, categoryId?: number) => {
    const finalName = (name ?? ingredientInput).trim()
    if (!finalName || !slotState) return
    const match = categoryId === undefined ? itemPool.get(normalizeName(finalName)) : undefined
    upsertItem.mutate(
      { name: finalName, categoryId: categoryId ?? match?.categoryId ?? altroId },
      {
        onSuccess: (itemId) => {
          setSlotState((prev) => {
            if (!prev) return prev
            if (prev.ingredients.some((i) => i.id === itemId)) return prev
            return { ...prev, ingredients: [...prev.ingredients, { id: itemId, name: finalName, checked: true }] }
          })
        },
      },
    )
    setIngredientInput('')
  }

  const handleRemoveIngredient = (id: number) => {
    setSlotState((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) } : prev))
  }

  const handleSaveSlot = () => {
    if (!slotState) return
    const name = slotState.nameInput.trim()
    if (!name) return

    if (slotState.dishId !== undefined) {
      const selectedItemIds = slotState.ingredients.filter((i) => i.checked).map((i) => i.id)
      setMealSlotDish.mutate(
        {
          dayIndex: slotState.dayIndex,
          mealType: slotState.mealType,
          value: { dishId: slotState.dishId, name, selectedItemIds },
        },
        { onSuccess: () => setSlotState(null) },
      )
      return
    }

    const itemIds = slotState.ingredients.map((i) => i.id)
    saveDish.mutate(
      { name, itemIds },
      {
        onSuccess: (dishId) => {
          setMealSlotDish.mutate(
            {
              dayIndex: slotState.dayIndex,
              mealType: slotState.mealType,
              value: { dishId, name, selectedItemIds: itemIds },
            },
            { onSuccess: () => setSlotState(null) },
          )
        },
      },
    )
  }

  const handleRemoveSlot = () => {
    if (!slotState) return
    setMealSlotDish.mutate(
      { dayIndex: slotState.dayIndex, mealType: slotState.mealType, value: null },
      { onSuccess: () => setSlotState(null) },
    )
  }

  const canSave = slotState !== null && slotState.nameInput.trim() !== '' && (slotState.dishId !== undefined || slotState.isNewDish)

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="flex-none" style={{ height: 'max(16px, env(safe-area-inset-top))' }} />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="flex-1 text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('pasti.title')}</span>
          <Link to="/pasti/storico" className="text-[15px] text-[#9B9B9F] px-1 active:opacity-50">
            {t('nav.history')}
          </Link>
        </div>

        {/* Selettore settimana */}
        <div className="flex items-center justify-between bg-white rounded-[18px] px-2 py-2 mb-[14px]">
          <button
            onClick={() => goToWeek(-1)}
            aria-label={t('pasti.prevWeek')}
            className="w-9 h-9 flex items-center justify-center active:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[15px] text-[#2A2A2C] tabular-nums">{formatWeekLabel(week)}</span>
          <button
            onClick={() => goToWeek(1)}
            aria-label={t('pasti.nextWeek')}
            className="w-9 h-9 flex items-center justify-center active:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        {/* Buoni disponibili questa settimana (opzionale) */}
        <div className="flex items-center justify-between bg-white rounded-[18px] px-4 py-[14px] mb-[14px]">
          <span className="text-base text-[#2A2A2C]">{t('pasti.buoniAvailable')}</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBuoni.mutate(Math.max(0, buoniAvailable - 1))}
              aria-label="-"
              className="w-8 h-8 rounded-full bg-[#F2F2F0] flex items-center justify-center active:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="text-[18px] font-normal text-[#2A2A2C] min-w-[20px] text-center tabular-nums">
              {buoniAvailable}
            </span>
            <button
              onClick={() => setBuoni.mutate(buoniAvailable + 1)}
              aria-label="+"
              className="w-8 h-8 rounded-full bg-[#F2F2F0] flex items-center justify-center active:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        <p className="text-sm text-[#9B9B9F] leading-relaxed mx-1 mb-[18px]">
          {t('pasti.intro')}
        </p>

        <div className="bg-white rounded-[22px] overflow-hidden">
          {days.map((day, i) => (
            <div
              key={`${week}-${day.dayIndex}`}
              className="border-b border-[#ECECEC] last:border-0"
            >
              {/* Day label row */}
              <div className="flex items-center px-[18px] pt-3 pb-0">
                <span className="w-[42px] flex-none text-[13px] font-normal text-[#2A2A2C] tracking-[.2px]">
                  {dayShort(day.dayIndex).toUpperCase()}
                </span>
              </div>
              {/* Pranzo */}
              <MealSlotRow
                label={t('pasti.lunch')}
                value={day.pranzo}
                onClick={() => openSlot(day, 0)}
                borderBottom
              />
              {/* Cena */}
              <MealSlotRow
                label={t('pasti.dinner')}
                value={day.cena}
                onClick={() => openSlot(day, 1)}
                borderBottom={i < days.length - 1}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          className="w-full mt-4 bg-[#2A2A2C] text-white text-[17px] font-normal py-[18px] rounded-[22px] active:scale-[.98] transition-transform"
        >
          {t('pasti.goToList')}
        </button>
        <button
          onClick={handleImportAndGenerate}
          className="w-full mt-2.5 bg-white text-[#2A2A2C] text-[17px] font-normal py-[18px] rounded-[22px] active:scale-[.98] transition-transform"
        >
          {t('pasti.importAndGoToList')}
        </button>
      </div>

      {/* Sheet: piatto + ingredienti per uno slot pasto */}
      <BottomSheet open={slotState !== null} onClose={() => setSlotState(null)}>
        {slotState && (
          <>
            <div className="text-[12px] font-normal tracking-[1.4px] text-[#9B9B9F] uppercase px-0.5 pb-[6px]">
              {dayFull(slotState.dayIndex)} · {t(slotState.mealType === 0 ? 'pasti.lunch' : 'pasti.dinner')}
            </div>

            {slotState.dishId !== undefined ? (
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[20px] font-normal text-[#2A2A2C] truncate">{slotState.nameInput}</span>
                <button
                  onClick={handleChangeDish}
                  className="flex-none text-[13px] text-[#9B9B9F] px-2 py-1 active:opacity-60"
                >
                  {t('pasti.changeDish')}
                </button>
              </div>
            ) : (
              <>
                <input
                  value={slotState.nameInput}
                  onChange={(e) => setSlotState((prev) => (prev ? { ...prev, nameInput: e.target.value } : prev))}
                  placeholder={t('piatti.namePlaceholder')}
                  autoFocus
                  disabled={slotState.isNewDish}
                  className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-2 disabled:opacity-60"
                />
                {!slotState.isNewDish && dishQuery && (
                  <div className="bg-[#F6F6F4] rounded-[14px] overflow-hidden mb-4 divide-y divide-[#ECECEC]">
                    {dishMatches.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => d.id !== undefined && selectExistingDish(d.id, d.name)}
                        className="w-full text-left px-4 py-[11px] text-[14px] text-[#2A2A2C] active:bg-[#ECECEC]"
                      >
                        {d.name}
                      </button>
                    ))}
                    {!dishExactMatch && (
                      <button
                        onClick={handleCreateNewDish}
                        className="w-full text-left px-4 py-[11px] text-[14px] text-[#2A2A2C] active:bg-[#ECECEC]"
                      >
                        {t('pasti.createDish', { name: slotState.nameInput.trim() })}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {(slotState.dishId !== undefined || slotState.isNewDish) && (
              <>
                <div className="text-[11px] font-normal tracking-[1.2px] text-[#9B9B9F] uppercase px-0.5 pb-2">
                  {t('piatti.ingredientsSection')}
                </div>

                {slotState.dishId !== undefined ? (
                  slotState.ingredients.length === 0 ? (
                    <div className="text-[13px] text-[#9B9B9F] mb-3">{t('piatti.noIngredients')}</div>
                  ) : (
                    <div className="bg-[#F6F6F4] rounded-[16px] overflow-hidden mb-4">
                      {slotState.ingredients.map((ing, idx) => (
                        <button
                          key={ing.id}
                          onClick={() => toggleIngredient(ing.id)}
                          className="w-full flex items-center justify-between px-4 py-[13px] text-left active:opacity-70"
                          style={{
                            borderBottom: idx < slotState.ingredients.length - 1 ? '1px solid #E6E6E2' : 'none',
                          }}
                        >
                          <span className="text-[15px] text-[#2A2A2C]">{ing.name}</span>
                          <CheckboxIcon checked={ing.checked} />
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <>
                    {slotState.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {slotState.ingredients.map((ing) => (
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
                  </>
                )}
              </>
            )}

            <button
              onClick={handleSaveSlot}
              disabled={!canSave}
              className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform disabled:opacity-40 mb-3"
            >
              {t('common.save')}
            </button>
            {slotState.hadExisting && (
              <button
                onClick={handleRemoveSlot}
                className="w-full bg-[#F2F2F0] text-[#D14343] text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
              >
                {t('pasti.removeDish')}
              </button>
            )}
          </>
        )}
      </BottomSheet>
    </div>
  )
}

function MealSlotRow({
  label,
  value,
  onClick,
  borderBottom,
}: {
  label: string
  value: string
  onClick: () => void
  borderBottom?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-[18px] text-left"
      style={{ borderBottom: borderBottom ? '1px solid #ECECEC' : 'none' }}
    >
      <span className="w-[42px] flex-none text-[12px] text-[#9B9B9F]">{label}</span>
      <span className={`flex-1 py-4 text-base truncate ${value ? 'text-[#2A2A2C]' : 'text-[#D0D0D4]'}`}>
        {value || '—'}
      </span>
    </button>
  )
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="#2A2A2C" stroke="none" />
        <path d="M7 12.5l3 3 7-7" stroke="#fff" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D0D0D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
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
