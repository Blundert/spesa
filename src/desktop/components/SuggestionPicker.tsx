import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item } from '../../db/types'
import { compareNames, normalizeName } from '../../lib/normalize'
import { toggleId } from '../../lib/listSuggestions'

/** Spesa solita / chip di una lista: "Automatico" oppure "Scelti da me" con i prodotti da spuntare. */
export function SuggestionPicker({
  title,
  autoHint,
  value,
  onChange,
  items,
  prefill,
}: {
  title: string
  autoHint: string
  value: number[] | undefined
  onChange: (next: number[] | undefined) => void
  items: Item[]
  /** Scelta di partenza quando si passa a "Scelti da me": i suggerimenti automatici di adesso. */
  prefill: number[]
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const custom = value !== undefined

  const nameById = new Map(items.map((it) => [it.id ?? 0, it.name]))
  const q = normalizeName(query)
  const shown = items
    .filter((it) => it.id !== undefined && normalizeName(it.name).includes(q))
    .sort((a, b) => compareNames(a.name, b.name))

  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ fontSize: '12px', color: '#9B9B9F', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
        {title}
      </div>
      <div style={{ display: 'inline-flex', background: '#F2F2F0', borderRadius: '10px', padding: '3px', gap: '2px', marginBottom: '10px' }}>
        {[false, true].map((isCustom) => {
          const active = custom === isCustom
          return (
            <button
              key={String(isCustom)}
              onClick={() => onChange(isCustom ? (custom ? value : prefill) : undefined)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? '#2A2A2C' : '#9B9B9F',
                fontSize: '13px',
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {isCustom ? t('lists.suggestCustom') : t('lists.suggestAuto')}
            </button>
          )
        })}
      </div>

      {!custom && <div style={{ fontSize: '13px', color: '#9B9B9F' }}>{autoHint}</div>}

      {custom && (
        <>
          <div style={{ fontSize: '13px', color: '#9B9B9F', marginBottom: '8px' }}>
            {value.length === 0 ? t('lists.customEmptyHint') : t('lists.customCount', { count: value.length })}
          </div>
          {value.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {value.map((id) => (
                <button
                  key={id}
                  onClick={() => onChange(toggleId(value, id))}
                  aria-label={`${t('lists.delete')} ${nameById.get(id) ?? ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    border: '1px solid #ECECEC',
                    background: '#fff',
                    fontSize: '13px',
                    color: '#2A2A2C',
                    cursor: 'pointer',
                  }}
                >
                  {nameById.get(id) ?? '?'}
                  <span aria-hidden style={{ color: '#9B9B9F' }}>×</span>
                </button>
              ))}
            </div>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('lists.pickSearch')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px',
              marginBottom: '8px',
              borderRadius: '10px',
              border: '1px solid #ECECEC',
              background: '#F6F6F4',
              fontSize: '14px',
              color: '#2A2A2C',
              outline: 'none',
            }}
          />
          <div style={{ background: '#F6F6F4', borderRadius: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {shown.length === 0 && (
              <div style={{ padding: '14px', fontSize: '13px', color: '#9B9B9F' }}>{t('lists.pickNone')}</div>
            )}
            {shown.map((it, i) => {
              const id = it.id as number
              const on = value.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => onChange(toggleId(value, id))}
                  aria-pressed={on}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    borderBottom: i < shown.length - 1 ? '1px solid #E6E6E2' : 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#2A2A2C',
                    cursor: 'pointer',
                  }}
                >
                  {it.name}
                  {on && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
