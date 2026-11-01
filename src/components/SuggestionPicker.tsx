import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Item } from '../db/types'
import { compareNames, normalizeName } from '../lib/normalize'
import { toggleId } from '../lib/listSuggestions'

// Spesa solita / chip di una lista: "Automatico" (i più comprati) oppure "Scelti da me", con i
// prodotti del catalogo da spuntare. `value` assente = automatico.
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
    <div className="mb-5">
      <div className="text-[12px] font-normal tracking-[1.4px] text-t-muted uppercase px-0.5 pb-2">{title}</div>
      <div className="flex bg-t-bg rounded-full p-[3px] mb-2">
        {[false, true].map((isCustom) => (
          <button
            key={String(isCustom)}
            onClick={() => onChange(isCustom ? (custom ? value : prefill) : undefined)}
            className={`flex-1 py-2 rounded-full text-[14px] transition-colors ${
              custom === isCustom ? 'bg-t-surface text-t-fg shadow-[0_1px_3px_rgba(0,0,0,.08)]' : 'text-t-muted'
            }`}
          >
            {isCustom ? t('lists.suggestCustom') : t('lists.suggestAuto')}
          </button>
        ))}
      </div>

      {!custom && <div className="text-[13px] text-t-muted px-0.5">{autoHint}</div>}

      {custom && (
        <>
          <div className="text-[13px] text-t-muted px-0.5 pb-2">
            {value.length === 0 ? t('lists.customEmptyHint') : t('lists.customCount', { count: value.length })}
          </div>
          {value.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2">
              {value.map((id) => (
                <button
                  key={id}
                  onClick={() => onChange(toggleId(value, id))}
                  aria-label={`${t('lists.delete')} ${nameById.get(id) ?? ''}`}
                  className="inline-flex items-center gap-1.5 px-3 py-[6px] rounded-full bg-t-surface border border-t-line text-[14px] text-t-fg active:bg-t-surface3"
                >
                  {nameById.get(id) ?? '?'}
                  <span aria-hidden className="text-t-muted">×</span>
                </button>
              ))}
            </div>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('lists.pickSearch')}
            className="w-full border-0 outline-none bg-t-surface2 rounded-[14px] px-4 py-[11px] text-[16px] text-t-fg mb-2"
          />
          <div className="bg-t-surface2 rounded-[18px] overflow-y-auto max-h-[220px]">
            {shown.length === 0 && <div className="px-[18px] py-4 text-[14px] text-t-muted">{t('lists.pickNone')}</div>}
            {shown.map((it, i) => {
              const id = it.id as number
              const on = value.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => onChange(toggleId(value, id))}
                  className="w-full flex items-center justify-between px-[18px] py-[12px] text-left active:bg-t-line"
                  style={{ borderBottom: i < shown.length - 1 ? '1px solid var(--t-line3)' : 'none' }}
                >
                  <span className="text-[16px] text-t-fg">{it.name}</span>
                  {on && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
