import { useTranslation } from 'react-i18next'
import { TABLE_NAMES, countChanges, type BackupDiff, type FieldValue } from '../../lib/backupDiff'
import { formatCentsPlain } from '../../lib/money'
import { formatDateTime } from './historyText'

const MAX_ROWS = 30

function show(field: string, v: FieldValue): string {
  if (v === null) return '—'
  if (typeof v === 'number' && field.endsWith('At')) return formatDateTime(v)
  if (typeof v === 'number' && field.endsWith('Cents')) return `${formatCentsPlain(v)} €`
  return String(v)
}

interface Line {
  key: string
  left: string | null
  right: string | null
}

function linesOf(diff: BackupDiff, table: (typeof TABLE_NAMES)[number]): Line[] {
  const d = diff[table]
  const label = (l: string, startedAt?: FieldValue) =>
    typeof startedAt === 'number' ? `${l} · ${formatDateTime(startedAt)}` : l
  return [
    ...d.removed.map((r) => ({ key: `r:${r.key}`, left: label(r.label, r.fields.startedAt), right: null })),
    ...d.added.map((r) => ({ key: `a:${r.key}`, left: null, right: label(r.label, r.fields.startedAt) })),
    ...d.modified.flatMap((m) =>
      m.changes.map((c) => ({
        key: `m:${m.key}:${c.field}`,
        left: `${m.label} · ${c.field}: ${show(c.field, c.from)}`,
        right: `${m.label} · ${c.field}: ${show(c.field, c.to)}`,
      })),
    ),
  ]
}

/** Prima e dopo affiancati, tabella per tabella: a sinistra ciò che sparisce o cambia, a destra ciò che compare. */
export function SideBySideDiff({
  diff,
  leftLabel,
  rightLabel,
}: {
  diff: BackupDiff
  leftLabel: string
  rightLabel: string
}) {
  const { t } = useTranslation()
  if (countChanges(diff) === 0) return <p className="text-[13px] text-t-muted">{t('syncGraph.noChanges')}</p>
  return (
    <div data-testid="side-by-side">
      <div className="grid grid-cols-2 gap-3 pb-2 text-[12px] tracking-[0.4px] text-t-muted uppercase">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {TABLE_NAMES.map((table) => {
        const lines = linesOf(diff, table)
        if (lines.length === 0) return null
        return (
          <section key={table} className="mb-4">
            <div className="pb-1.5 text-[13px] text-t-fg">
              {t(`syncPage.tables.${table}`)} · {lines.length}
            </div>
            <div className="rounded-[12px] overflow-hidden bg-t-surface2">
              {lines.slice(0, MAX_ROWS).map((l, i) => (
                <div
                  key={l.key}
                  className="grid grid-cols-2 gap-3 px-3 py-1.5 text-[12px]"
                  style={{ borderTop: i > 0 ? '1px solid var(--t-line)' : 'none' }}
                >
                  <span className={l.left ? 'text-t-danger break-words' : 'text-t-faint'}>{l.left ?? ''}</span>
                  <span className={l.right ? 'text-t-fg break-words' : 'text-t-faint'}>{l.right ?? ''}</span>
                </div>
              ))}
              {lines.length > MAX_ROWS && (
                <div className="px-3 py-1.5 text-[12px] text-t-muted">
                  {t('syncPage.more', { count: lines.length - MAX_ROWS })}
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
