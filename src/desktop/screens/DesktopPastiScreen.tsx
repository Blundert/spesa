import { useState } from 'react'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { Modal } from '../components/Modal'
import { IngredientEditor, type EditorIngredient } from '../components/IngredientEditor'
import { dayShort, dayFull, formatWeekLabelWithYear, shiftWeek } from '../../lib/date'
import { useMealPlan, useSetMealSlotDish, useImportMealPlanToList } from '../../hooks/useMealPlan'
import { useDishes, useSaveDish } from '../../hooks/useDishes'
import { useActiveList } from '../../hooks/useShoppingLists'
import { useWeekBudget, useSetBuoniAvailable } from '../../hooks/useShopping'
import { activeLists, getMealsListId, pickList, setActiveListId, setMealsListId } from '../../lib/activeList'
import { normalizeName } from '../../lib/normalize'
import type { MealPlanDay } from '../../db/repositories/mealPlan'
import type { MealType, ShoppingList } from '../../db/types'

interface SlotIngredient extends EditorIngredient {
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

const primaryBtn = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: 'none',
  background: '#2A2A2C',
  color: '#fff',
  fontSize: '14px',
  cursor: 'pointer',
}
const secondaryBtn = { ...primaryBtn, background: '#F2F2F0', color: '#2A2A2C' }
const iconBtn = {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  border: 'none',
  background: '#F2F2F0',
  color: '#2A2A2C',
  fontSize: '18px',
  cursor: 'pointer',
  lineHeight: 1,
}
const textInput = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #ECECEC',
  background: '#F6F6F4',
  fontSize: '15px',
  color: '#2A2A2C',
  outline: 'none',
}
const suggestionStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  padding: '10px 14px',
  border: 'none',
  borderBottom: '1px solid #ECECEC',
  background: 'transparent',
  fontSize: '14px',
  color: '#2A2A2C',
  cursor: 'pointer',
}
const labelStyle = { fontSize: '11px', fontWeight: 500, letterSpacing: '1.2px', color: '#9B9B9F', margin: '16px 0 10px' }

export function DesktopPastiScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // strict: false — l'id di rotta desktop (`/desktop-shell/pasti`) non coincide con quello del router mobile registrato per i tipi.
  const { week } = useSearch({ strict: false }) as { week: string }
  const { data: days = [] } = useMealPlan(week)
  const { data: dishes = [] } = useDishes()
  const { data: budget } = useWeekBudget(week)
  const setBuoni = useSetBuoniAvailable(week)
  const setMealSlotDish = useSetMealSlotDish(week)
  const importToList = useImportMealPlanToList(week)
  const saveDish = useSaveDish()
  const { lists } = useActiveList()
  const buoniAvailable = budget?.buoniAvailable ?? 0

  const [importPick, setImportPick] = useState<number | null>(null)
  const importTarget = lists.find((l) => l.id === importPick)
  const [slot, setSlot] = useState<SlotState | null>(null)

  const goToWeek = (delta: number) => void navigate({ to: '/pasti', search: { week: shiftWeek(week, delta) } })

  // Con più liste si sceglie dove mettere gli ingredienti (proposta: l'ultima usata per i pasti).
  const importInto = (target: ShoppingList) => {
    const listId = target.id as number
    setImportPick(null)
    setMealsListId(listId)
    importToList.mutate(
      { listId, listName: target.name },
      {
        onSuccess: () => {
          setActiveListId(listId)
          void navigate({ to: '/lista' })
        },
      },
    )
  }

  const handleImport = () => {
    const choices = activeLists(lists)
    if (choices.length > 1) setImportPick(pickList(lists, getMealsListId())?.id ?? null)
    else if (choices[0]) importInto(choices[0])
  }

  const openSlot = (day: MealPlanDay, mealType: MealType) => {
    const dishId = mealType === 0 ? day.pranzoDishId : day.cenaDishId
    const selectedIds = mealType === 0 ? day.pranzoSelectedItemIds : day.cenaSelectedItemIds
    const existingId = mealType === 0 ? day.pranzoId : day.cenaId
    const dish = dishId !== undefined ? dishes.find((d) => d.id === dishId) : undefined
    setSlot({
      dayIndex: day.dayIndex,
      mealType,
      nameInput: mealType === 0 ? day.pranzo : day.cena,
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
  }

  const dishQuery = normalizeName(slot?.nameInput ?? '')
  const dishMatches =
    dishQuery && slot && slot.dishId === undefined && !slot.isNewDish
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
    setSlot((prev) =>
      prev
        ? {
            ...prev,
            nameInput: name,
            dishId,
            isNewDish: false,
            ingredients: (dish?.ingredients ?? []).map((i) => ({ id: i.id as number, name: i.name, checked: true })),
          }
        : prev,
    )
  }

  const toggleIngredient = (id: number) =>
    setSlot((prev) =>
      prev ? { ...prev, ingredients: prev.ingredients.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)) } : prev,
    )

  const handleSave = () => {
    if (!slot) return
    const name = slot.nameInput.trim()
    if (!name) return
    const { dayIndex, mealType } = slot

    if (slot.dishId !== undefined) {
      const selectedItemIds = slot.ingredients.filter((i) => i.checked).map((i) => i.id)
      setMealSlotDish.mutate(
        { dayIndex, mealType, value: { dishId: slot.dishId, name, selectedItemIds } },
        { onSuccess: () => setSlot(null) },
      )
      return
    }

    const itemIds = slot.ingredients.map((i) => i.id)
    saveDish.mutate(
      { name, itemIds },
      {
        onSuccess: (dishId) =>
          setMealSlotDish.mutate(
            { dayIndex, mealType, value: { dishId, name, selectedItemIds: itemIds } },
            { onSuccess: () => setSlot(null) },
          ),
      },
    )
  }

  const handleRemove = () => {
    if (!slot) return
    setMealSlotDish.mutate(
      { dayIndex: slot.dayIndex, mealType: slot.mealType, value: null },
      { onSuccess: () => setSlot(null) },
    )
  }

  const canSave = slot !== null && slot.nameInput.trim() !== '' && (slot.dishId !== undefined || slot.isNewDish)
  const meals: { type: MealType; label: string }[] = [
    { type: 0, label: t('pasti.lunch') },
    { type: 1, label: t('pasti.dinner') },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <PageHeader
        title={t('nav.meals')}
        subtitle={t('desktop.pasti.subtitle')}
        right={
          <Link to="/pasti/storico" style={{ fontSize: '14px', color: '#9B9B9F', textDecoration: 'none' }}>
            {t('pianificazioni.link')}
          </Link>
        }
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#fff',
          borderRadius: '16px',
          padding: '16px 24px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={iconBtn} onClick={() => goToWeek(-1)} aria-label={t('pasti.prevWeek')}>
            ‹
          </button>
          <span style={{ fontSize: '16px', color: '#2A2A2C', minWidth: '200px', textAlign: 'center' }}>
            {formatWeekLabelWithYear(week)}
          </span>
          <button style={iconBtn} onClick={() => goToWeek(1)} aria-label={t('pasti.nextWeek')}>
            ›
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: '#2A2A2C' }}>{t('pasti.buoniAvailable')}</span>
          <button style={iconBtn} onClick={() => setBuoni.mutate(Math.max(0, buoniAvailable - 1))} aria-label="-">
            −
          </button>
          <span style={{ fontSize: '18px', minWidth: '24px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {buoniAvailable}
          </span>
          <button style={iconBtn} onClick={() => setBuoni.mutate(buoniAvailable + 1)} aria-label="+">
            +
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', overflowX: 'auto' }}>
        <p style={{ fontSize: '13px', color: '#9B9B9F', margin: '0 0 16px' }}>{t('desktop.pasti.intro')}</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px repeat(7, minmax(110px, 1fr))',
            gap: '8px',
            alignItems: 'stretch',
          }}
        >
          <div />
          {days.map((day) => (
            <div
              key={`h-${day.dayIndex}`}
              style={{ fontSize: '12px', fontWeight: 500, color: '#9B9B9F', letterSpacing: '0.5px', padding: '0 4px' }}
            >
              {dayShort(day.dayIndex).toUpperCase()}
            </div>
          ))}
          {meals.map((m) => (
            <MealRow
              key={m.type}
              label={m.label}
              days={days}
              mealType={m.type}
              week={week}
              onOpen={(d) => openSlot(d, m.type)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
        <button style={primaryBtn} onClick={handleImport}>
          {t('pasti.importAndGoToList')}
        </button>
        <button style={{ ...secondaryBtn, background: '#fff' }} onClick={() => void navigate({ to: '/lista' })}>
          {t('pasti.goToList')}
        </button>
      </div>

      <Modal open={importPick !== null} onClose={() => setImportPick(null)} title={t('pasti.chooseList')} width={420}>
        <div style={{ background: '#F6F6F4', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          {activeLists(lists).map((l) => (
            <button
              key={l.id}
              onClick={() => setImportPick(l.id as number)}
              style={{ ...suggestionStyle, display: 'flex', justifyContent: 'space-between', fontWeight: l.id === importPick ? 500 : 400 }}
            >
              <span>{l.name}</span>
              {l.id === importPick && <span aria-hidden>✓</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button style={secondaryBtn} onClick={() => setImportPick(null)}>
            {t('common.cancel')}
          </button>
          <button style={primaryBtn} onClick={() => importTarget && importInto(importTarget)}>
            {t('pasti.addToList', { name: importTarget?.name })}
          </button>
        </div>
      </Modal>

      <Modal
        open={slot !== null}
        onClose={() => setSlot(null)}
        title={slot ? `${dayFull(slot.dayIndex)} · ${t(slot.mealType === 0 ? 'pasti.lunch' : 'pasti.dinner')}` : undefined}
        width={520}
      >
        {slot && (
          <>
            {slot.dishId !== undefined ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '18px', color: '#2A2A2C' }}>{slot.nameInput}</span>
                <button
                  style={{ ...secondaryBtn, padding: '6px 12px', fontSize: '13px' }}
                  onClick={() =>
                    setSlot((prev) =>
                      prev ? { ...prev, dishId: undefined, isNewDish: false, ingredients: [], nameInput: '' } : prev,
                    )
                  }
                >
                  {t('pasti.changeDish')}
                </button>
              </div>
            ) : (
              <>
                <input
                  value={slot.nameInput}
                  onChange={(e) => setSlot((prev) => (prev ? { ...prev, nameInput: e.target.value } : prev))}
                  placeholder={t('piatti.namePlaceholder')}
                  autoFocus
                  disabled={slot.isNewDish}
                  style={{ ...textInput, opacity: slot.isNewDish ? 0.6 : 1 }}
                />
                {!slot.isNewDish && dishQuery && (
                  <div style={{ background: '#F6F6F4', borderRadius: '10px', overflow: 'hidden', marginTop: '6px' }}>
                    {dishMatches.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => d.id !== undefined && selectExistingDish(d.id, d.name)}
                        style={suggestionStyle}
                      >
                        {d.name}
                      </button>
                    ))}
                    {!dishExactMatch && (
                      <button
                        onClick={() =>
                          setSlot((prev) => (prev ? { ...prev, isNewDish: true, dishId: undefined, ingredients: [] } : prev))
                        }
                        style={suggestionStyle}
                      >
                        {t('pasti.createDish', { name: slot.nameInput.trim() })}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {(slot.dishId !== undefined || slot.isNewDish) && (
              <>
                <div style={labelStyle}>{t('piatti.ingredientsSection')}</div>
                {slot.dishId !== undefined ? (
                  slot.ingredients.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#9B9B9F' }}>{t('piatti.noIngredients')}</div>
                  ) : (
                    <div style={{ background: '#F6F6F4', borderRadius: '12px', overflow: 'hidden' }}>
                      {slot.ingredients.map((ing) => (
                        <label
                          key={ing.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderBottom: '1px solid #ECECEC',
                            fontSize: '14px',
                            color: '#2A2A2C',
                            cursor: 'pointer',
                          }}
                        >
                          <input type="checkbox" checked={ing.checked} onChange={() => toggleIngredient(ing.id)} />
                          {ing.name}
                        </label>
                      ))}
                    </div>
                  )
                ) : (
                  <IngredientEditor
                    ingredients={slot.ingredients}
                    onAdd={(ing) =>
                      setSlot((prev) =>
                        prev && !prev.ingredients.some((i) => i.id === ing.id)
                          ? { ...prev, ingredients: [...prev.ingredients, { ...ing, checked: true }] }
                          : prev,
                      )
                    }
                    onRemove={(id) =>
                      setSlot((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) } : prev))
                    }
                  />
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '24px' }}>
              <div>
                {slot.hadExisting && (
                  <button style={{ ...secondaryBtn, color: '#D14343' }} onClick={handleRemove}>
                    {t('pasti.removeDish')}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={secondaryBtn} onClick={() => setSlot(null)}>
                  {t('common.cancel')}
                </button>
                {(slot.dishId !== undefined || slot.isNewDish) && (
                  <button style={{ ...primaryBtn, opacity: canSave ? 1 : 0.4 }} disabled={!canSave} onClick={handleSave}>
                    {t('common.save')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}

function MealRow({
  label,
  days,
  mealType,
  week,
  onOpen,
}: {
  label: string
  days: MealPlanDay[]
  mealType: MealType
  week: string
  onOpen: (day: MealPlanDay) => void
}) {
  return (
    <>
      <div style={{ fontSize: '12px', color: '#9B9B9F', paddingTop: '14px' }}>{label}</div>
      {days.map((day) => {
        const value = mealType === 0 ? day.pranzo : day.cena
        return (
          <button
            key={`${week}-${day.dayIndex}-${mealType}`}
            onClick={() => onOpen(day)}
            style={{
              minHeight: '72px',
              padding: '12px',
              borderRadius: '12px',
              border: value ? '1px solid #ECECEC' : '1px dashed #D8D8D6',
              background: value ? '#F6F6F4' : 'transparent',
              color: value ? '#2A2A2C' : '#B5B5BA',
              fontSize: '14px',
              textAlign: 'left',
              cursor: 'pointer',
              wordBreak: 'break-word',
            }}
          >
            {value || '+'}
          </button>
        )
      })}
    </>
  )
}
