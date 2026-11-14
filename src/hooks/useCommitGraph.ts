import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BACKUP_VERSION, exportData, type BackupData } from '../db/backup'
import { diffBackups } from '../lib/backupDiff'
import { layoutGraph } from '../lib/commitGraph'
import { getGitConfig, isGitConfigured, listCommitGraph, loadHistoryBackup } from '../lib/gitSync'

export type CompareMode = 'parent' | 'local'

const emptyBackup = (): BackupData => ({
  version: BACKUP_VERSION,
  exportedAt: 0,
  categories: [],
  items: [],
  supermarkets: [],
  weekBudgets: [],
  listItems: [],
  sessions: [],
  purchases: [],
  mealPlans: [],
  dishes: [],
  dishIngredients: [],
  shoppingLists: [],
})

/** I commit di tutti i branch con la loro disposizione in corsie. */
export function useCommitGraph() {
  const configured = isGitConfigured(getGitConfig())
  const query = useQuery({
    queryKey: ['sync-graph', configured],
    queryFn: listCommitGraph,
    enabled: configured,
    staleTime: 30_000,
    retry: false,
  })
  const rows = useMemo(
    () => (query.data ? layoutGraph(query.data.commits, query.data.heads) : []),
    [query.data],
  )
  return { query, rows }
}

const commitEntry = (sha: string) => ({ kind: 'commit' as const, sha, date: '', message: '' })

/**
 * Cosa cambia in un commit: rispetto al commit precedente (se manca il file, a un backup vuoto) o rispetto
 * ai dati di adesso. Restituisce anche i dati del commit, per ripristinarlo.
 */
export function useCommitDiff(sha: string | null, parent: string | undefined, mode: CompareMode) {
  return useQuery({
    queryKey: ['sync-commit-diff', sha, parent ?? null, mode],
    enabled: sha !== null,
    retry: false,
    queryFn: async () => {
      const data = await loadHistoryBackup(commitEntry(sha as string))
      let base: BackupData
      if (mode === 'local') base = await exportData()
      else if (parent === undefined) base = emptyBackup()
      else base = await loadHistoryBackup(commitEntry(parent)).catch(() => emptyBackup())
      return { data, diff: diffBackups(base, data) }
    },
  })
}
