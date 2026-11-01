import { useState, type ReactNode } from 'react'
import { sortRows, toggleSort, type SortState, type SortValue } from '../../lib/sortRows'

export interface Column<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  /** Valore con cui ordinare la colonna. Senza, la colonna non è ordinabile. */
  sortValue?: (row: T) => SortValue
  align?: 'left' | 'right'
}

interface SortableTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  defaultSort?: SortState
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

const thBase = {
  padding: '8px 12px 12px 0',
  fontSize: '11px',
  fontWeight: 500,
  color: 'var(--t-muted)',
  borderBottom: '1px solid var(--t-bg)',
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap' as const,
}

/** Tabella con intestazioni cliccabili: clic ordina, secondo clic inverte. */
export function SortableTable<T>({
  columns,
  rows,
  rowKey,
  defaultSort,
  onRowClick,
  emptyMessage,
}: SortableTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(defaultSort ?? null)

  const active = sort ? columns.find((c) => c.key === sort.key) : undefined
  const sorted = sort && active?.sortValue ? sortRows(rows, active.sortValue, sort.dir) : rows

  if (rows.length === 0 && emptyMessage) {
    return (
      <div style={{ color: 'var(--t-muted)', fontSize: '14px', textAlign: 'center', padding: '48px 0' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((c, i) => {
              const isActive = sort?.key === c.key && c.sortValue !== undefined
              const last = i === columns.length - 1
              const style = {
                ...thBase,
                textAlign: c.align ?? 'left',
                paddingRight: last ? 0 : '12px',
                color: isActive ? 'var(--t-fg)' : 'var(--t-muted)',
              }
              return (
                <th
                  key={c.key}
                  style={style}
                  aria-sort={
                    isActive ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                >
                  {c.sortValue ? (
                    <button
                      onClick={() =>
                        setSort((cur) => toggleSort(cur ?? { key: '', dir: 'asc' }, c.key))
                      }
                      style={{
                        all: 'unset',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {c.label}
                      <span aria-hidden style={{ fontSize: '9px', opacity: isActive ? 1 : 0.35 }}>
                        {isActive && sort?.dir === 'desc' ? '▼' : '▲'}
                      </span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: '1px solid var(--t-bg)',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
            >
              {columns.map((c, i) => (
                <td
                  key={c.key}
                  style={{
                    padding: '12px 12px 12px 0',
                    paddingRight: i === columns.length - 1 ? 0 : '12px',
                    textAlign: c.align ?? 'left',
                    fontSize: '14px',
                    color: 'var(--t-fg)',
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
