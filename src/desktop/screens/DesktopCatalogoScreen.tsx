import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { useCategories, useItems } from '../../hooks/useItems'
import { SortableTable, type Column } from '../components/SortableTable'
import type { Item } from '../../db/types'
import { formatCents } from '../../lib/money'

const ALL = -1

export function DesktopCatalogoScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()
  const { data: items = [] } = useItems()
  const [selected, setSelected] = useState<number>(ALL)
  const [search, setSearch] = useState('')

  const countByCategory = new Map<number, number>()
  for (const i of items) countByCategory.set(i.categoryId, (countByCategory.get(i.categoryId) ?? 0) + 1)
  const categoryName = new Map(categories.map((c) => [c.id ?? 0, c.name]))

  const needle = search.trim().toLowerCase()
  const visible = items
    .filter((i) => (selected === ALL || i.categoryId === selected) && i.name.toLowerCase().includes(needle))

  const columns: Column<Item>[] = [
    { key: 'name', label: t('desktop.catalog.colName'), render: (i) => i.name, sortValue: (i) => i.name },
    { key: 'category', label: t('desktop.catalog.colCategory'), render: (i) => <span style={{ color: '#9B9B9F' }}>{categoryName.get(i.categoryId) ?? ''}</span>, sortValue: (i) => categoryName.get(i.categoryId) ?? '' },
    { key: 'price', label: t('desktop.catalog.colPrice'), align: 'right', render: (i) => (i.lastPriceCents !== null ? `€ ${formatCents(i.lastPriceCents)}` : '—'), sortValue: (i) => i.lastPriceCents },
  ]

  const rowStyle = (active: boolean) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: 'none',
    background: active ? '#F2F2F0' : 'transparent',
    color: '#2A2A2C',
    fontSize: '14px',
    fontWeight: active ? 500 : 400,
    cursor: 'pointer',
    textAlign: 'left' as const,
  })

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <PageHeader title={t('catalogo.title')} subtitle={t('desktop.catalog.subtitle')} />
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', flex: '0 0 280px' }}>
          <SectionTitle>{t('catalogo.categoriesSection')}</SectionTitle>
          <button style={rowStyle(selected === ALL)} onClick={() => setSelected(ALL)}>
            <span>{t('desktop.catalog.allCategories')}</span>
            <span style={{ color: '#9B9B9F' }}>{items.length}</span>
          </button>
          {categories.map((c) => (
            <button key={c.id} style={rowStyle(selected === c.id)} onClick={() => setSelected(c.id ?? ALL)}>
              <span>{c.name}</span>
              <span style={{ color: '#9B9B9F' }}>{countByCategory.get(c.id ?? 0) ?? 0}</span>
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', flex: '1 1 400px', minWidth: 0 }}>
          <SectionTitle>{t('desktop.catalog.itemsIn')}</SectionTitle>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('desktop.catalog.search')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              marginBottom: '12px',
              borderRadius: '10px',
              border: '1px solid #ECECEC',
              background: '#F6F6F4',
              fontSize: '14px',
              color: '#2A2A2C',
              outline: 'none',
            }}
          />
          <SortableTable
            columns={columns}
            rows={visible}
            rowKey={(i) => i.id ?? 0}
            defaultSort={{ key: 'name', dir: 'asc' }}
            onRowClick={(i) => void navigate({ to: '/item/$itemId', params: { itemId: String(i.id) } })}
            emptyMessage={items.length === 0 ? t('catalogo.emptyItems') : t('desktop.catalog.noResults')}
          />
        </div>
      </div>
    </div>
  )
}
