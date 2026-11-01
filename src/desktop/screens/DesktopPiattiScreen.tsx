import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { Modal } from '../components/Modal'
import { IngredientEditor, type EditorIngredient } from '../components/IngredientEditor'
import { useDishes, useSaveDish, useDeleteDish } from '../../hooks/useDishes'
import { compareNames } from '../../lib/normalize'
import type { DishWithIngredients } from '../../db/repositories/dishes'

interface EditorState {
  id?: number
  name: string
  ingredients: EditorIngredient[]
}

const primaryBtn = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: 'none',
  background: 'var(--t-accent)',
  color: 'var(--t-on)',
  fontSize: '14px',
  cursor: 'pointer',
}
const secondaryBtn = { ...primaryBtn, background: 'var(--t-bg)', color: 'var(--t-fg)' }
const linkBtn = {
  border: 'none',
  background: 'transparent',
  padding: '4px 8px',
  fontSize: '13px',
  color: 'var(--t-muted)',
  cursor: 'pointer',
}

export function DesktopPiattiScreen() {
  const { t } = useTranslation()
  const { data: dishes = [] } = useDishes()
  const saveDish = useSaveDish()
  const deleteDish = useDeleteDish()
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [toDelete, setToDelete] = useState<DishWithIngredients | null>(null)

  const handleSave = () => {
    if (!editor) return
    const name = editor.name.trim()
    if (!name) return
    saveDish.mutate(
      { id: editor.id, name, itemIds: editor.ingredients.map((i) => i.id) },
      { onSuccess: () => setEditor(null) },
    )
  }

  const handleDelete = () => {
    if (!toDelete?.id) return
    deleteDish.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
  }

  const ingredientNames = (d: DishWithIngredients) =>
    d.ingredients
      .map((i) => i.name)
      .sort(compareNames)
      .join(', ')

  const columns: Column<DishWithIngredients>[] = [
    {
      key: 'name',
      label: t('desktop.piatti.colName'),
      render: (d) => d.name,
      sortValue: (d) => d.name,
    },
    {
      key: 'ingredients',
      label: t('piatti.ingredientsSection'),
      render: (d) => <span style={{ color: 'var(--t-text2b)' }}>{ingredientNames(d) || '—'}</span>,
      sortValue: (d) => ingredientNames(d),
    },
    {
      key: 'count',
      label: t('desktop.piatti.colCount'),
      render: (d) => d.ingredients.length,
      sortValue: (d) => d.ingredients.length,
      align: 'right',
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (d) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          <button
            style={linkBtn}
            onClick={() =>
              setEditor({
                id: d.id,
                name: d.name,
                ingredients: d.ingredients.map((i) => ({ id: i.id as number, name: i.name })),
              })
            }
          >
            {t('piatti.editTitle')}
          </button>
          <button style={{ ...linkBtn, color: 'var(--t-danger)' }} onClick={() => setToDelete(d)}>
            {t('piatti.deleteConfirm')}
          </button>
        </span>
      ),
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader
        title={t('piatti.title')}
        subtitle={t('desktop.piatti.subtitle', { count: dishes.length })}
        right={
          <button style={primaryBtn} onClick={() => setEditor({ name: '', ingredients: [] })}>
            + {t('piatti.add')}
          </button>
        }
      />
      <div style={{ background: 'var(--t-surface)', borderRadius: '16px', padding: '24px' }}>
        <SortableTable
          columns={columns}
          rows={dishes}
          rowKey={(d) => d.id as number}
          defaultSort={{ key: 'name', dir: 'asc' }}
          emptyMessage={t('piatti.empty')}
        />
      </div>

      <Modal
        open={editor !== null}
        onClose={() => setEditor(null)}
        title={editor?.id !== undefined ? t('piatti.editTitle') : t('piatti.newTitle')}
        width={520}
      >
        {editor && (
          <>
            <input
              value={editor.name}
              onChange={(e) => setEditor({ ...editor, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={t('piatti.namePlaceholder')}
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 14px',
                marginBottom: '20px',
                borderRadius: '10px',
                border: '1px solid var(--t-line)',
                background: 'var(--t-surface2)',
                fontSize: '15px',
                color: 'var(--t-fg)',
                outline: 'none',
              }}
            />
            <div
              style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '1.2px', color: 'var(--t-muted)', marginBottom: '10px' }}
            >
              {t('piatti.ingredientsSection')}
            </div>
            <IngredientEditor
              ingredients={editor.ingredients}
              onAdd={(ing) =>
                setEditor((prev) =>
                  prev && !prev.ingredients.some((i) => i.id === ing.id)
                    ? { ...prev, ingredients: [...prev.ingredients, ing] }
                    : prev,
                )
              }
              onRemove={(id) =>
                setEditor((prev) => (prev ? { ...prev, ingredients: prev.ingredients.filter((i) => i.id !== id) } : prev))
              }
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button style={secondaryBtn} onClick={() => setEditor(null)}>
                {t('common.cancel')}
              </button>
              <button
                style={{ ...primaryBtn, opacity: editor.name.trim() ? 1 : 0.4 }}
                disabled={!editor.name.trim()}
                onClick={handleSave}
              >
                {t('common.save')}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t('piatti.deleteTitle', { name: toDelete?.name ?? '' })}
        width={420}
      >
        <div style={{ fontSize: '14px', color: 'var(--t-muted)', marginBottom: '24px' }}>{t('piatti.deleteBody')}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button style={secondaryBtn} onClick={() => setToDelete(null)}>
            {t('common.cancel')}
          </button>
          <button style={{ ...primaryBtn, background: 'var(--t-danger)' }} onClick={handleDelete}>
            {t('piatti.deleteConfirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
