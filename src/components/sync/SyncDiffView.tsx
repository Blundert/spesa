import { useTranslation } from 'react-i18next'
import { countChanges, type BackupDiff, type DiffRow } from '../../lib/backupDiff'
import { summarizeDiff } from '../../lib/diffSummary'
import { formatDate } from '../../lib/date'

const MAX_ROWS = 8

function SessionList({ title, rows }: { title: string; rows: DiffRow[] }) {
  const { t } = useTranslation()
  if (rows.length === 0) return null
  return (
    <div className="mt-3">
      <div className="text-[12px] tracking-[0.4px] text-t-muted uppercase pb-1.5">
        {title} · {t('syncPage.tables.sessions')}
      </div>
      <ul className="space-y-1">
        {rows.slice(0, MAX_ROWS).map((r) => (
          <li key={r.key} className="text-[13px] text-t-text2">
            {r.label} · {formatDate(r.fields.startedAt as number)}
          </li>
        ))}
        {rows.length > MAX_ROWS && (
          <li className="text-[13px] text-t-muted">{t('syncPage.more', { count: rows.length - MAX_ROWS })}</li>
        )}
      </ul>
    </div>
  )
}

/**
 * Cosa cambierebbe ripristinando una versione: righe per tabella (si aggiungerebbero / sparirebbero /
 * cambierebbero) e, per le spese, l'elenco con negozio e data.
 */
export function SyncDiffView({ diff }: { diff: BackupDiff }) {
  const { t } = useTranslation()
  if (countChanges(diff) === 0) {
    return <p className="text-[13px] text-t-muted">{t('syncPage.noDiff')}</p>
  }
  return (
    <div>
      <ul className="space-y-1.5">
        {summarizeDiff(diff).map((s) => (
          <li key={s.table} className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="text-t-fg">{t(`syncPage.tables.${s.table}`)}</span>
            <span className="text-t-text2 text-[13px] tabular-nums text-right">
              {[
                s.added > 0 && `${t('syncPage.diffAdded')} ${s.added}`,
                s.removed > 0 && `${t('syncPage.diffRemoved')} ${s.removed}`,
                s.modified > 0 && `${t('syncPage.diffModified')} ${s.modified}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </li>
        ))}
      </ul>
      <SessionList title={t('syncPage.diffAdded')} rows={diff.sessions.added} />
      <SessionList title={t('syncPage.diffRemoved')} rows={diff.sessions.removed} />
    </div>
  )
}
