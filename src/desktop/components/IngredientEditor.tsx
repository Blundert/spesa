import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCategories, useItems, useUpsertItem } from '../../hooks/useItems'
import { normalizeName } from '../../lib/normalize'
import { BASE_ITEMS } from '../../lib/baseItems'

export interface EditorIngredient {
  id: number
  name: string
}

interface Suggestion {
  name: string
  categoryId: number
}

interface IngredientEditorProps {
  ingredients: EditorIngredient[]
  onAdd: (ingredient: EditorIngredient) => void
  onRemove: (id: number) => void
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid var(--t-line)',
  background: 'var(--t-surface2)',
  fontSize: '14px',
  color: 'var(--t-fg)',
  outline: 'none',
}

const suggestionStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'left' as const,
  padding: '10px 14px',
  border: 'none',
  borderBottom: '1px solid var(--t-line)',
  background: 'transparent',
  fontSize: '14px',
  color: 'var(--t-fg)',
  cursor: 'pointer',
}

/** Chip degli ingredienti + campo con autocompletamento (articoli base e già usati). */
export function IngredientEditor({ ingredients, onAdd, onRemove }: IngredientEditorProps) {
  const { t } = useTranslation()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const upsertItem = useUpsertItem()
  const [input, setInput] = useState('')

  const altroId = categories.find((c) => c.name === 'Altro')?.id ?? 0
  const catIdByName = new Map(categories.map((c) => [c.name, c.id ?? 0]))
  const pool = new Map<string, Suggestion>()
  for (const b of BASE_ITEMS) {
    pool.set(normalizeName(b.name), { name: b.name, categoryId: catIdByName.get(b.category) ?? altroId })
  }
  for (const it of items) pool.set(normalizeName(it.name), { name: it.name, categoryId: it.categoryId })

  const selectedNorm = new Set(ingredients.map((i) => normalizeName(i.name)))
  const query = normalizeName(input)
  const matches: Suggestion[] = query
    ? Array.from(pool.values())
        .filter((p) => {
          const n = normalizeName(p.name)
          return !selectedNorm.has(n) && n.includes(query)
        })
        .sort((a, b) => {
          const an = normalizeName(a.name)
          const bn = normalizeName(b.name)
          const aStarts = an.startsWith(query) ? 0 : 1
          const bStarts = bn.startsWith(query) ? 0 : 1
          if (aStarts !== bStarts) return aStarts - bStarts
          return an.localeCompare(bn)
        })
        .slice(0, 8)
    : []
  const exactInPool = pool.has(query)

  const add = (name?: string, categoryId?: number) => {
    const finalName = (name ?? input).trim()
    if (!finalName) return
    const match = categoryId === undefined ? pool.get(normalizeName(finalName)) : undefined
    upsertItem.mutate(
      { name: finalName, categoryId: categoryId ?? match?.categoryId ?? altroId },
      { onSuccess: (itemId) => onAdd({ id: itemId, name: finalName }) },
    )
    setInput('')
  }

  return (
    <div>
      {ingredients.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--t-muted)', marginBottom: '12px' }}>{t('piatti.noIngredients')}</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {ingredients.map((ing) => (
            <button
              key={ing.id}
              onClick={() => onRemove(ing.id)}
              aria-label={`${ing.name} ×`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '999px',
                background: 'var(--t-bg)',
                fontSize: '13px',
                color: 'var(--t-fg)',
                cursor: 'pointer',
              }}
            >
              {ing.name}
              <span aria-hidden style={{ color: 'var(--t-muted)' }}>×</span>
            </button>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        placeholder={t('piatti.ingredientsPlaceholder')}
        style={inputStyle}
      />
      {input.trim() && (
        <div style={{ background: 'var(--t-surface2)', borderRadius: '10px', overflow: 'hidden', marginTop: '6px' }}>
          {matches.map((p) => (
            <button key={p.name} onClick={() => add(p.name, p.categoryId)} style={suggestionStyle}>
              {p.name}
            </button>
          ))}
          {!exactInPool && (
            <button onClick={() => add()} style={suggestionStyle}>
              {t('piatti.addNamed', { name: input.trim() })}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
