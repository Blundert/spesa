import type { TFunction } from 'i18next'
import { formatWeekLabelWithYear } from '../../lib/date'
import type { TableName } from '../../lib/backupDiff'
import type { Choice, GroupType, MergeGroup } from '../../lib/backupMerge'

const GROUP_KEY: Record<GroupType, string> = {
  week: 'syncMerge.groupWeek',
  list: 'syncMerge.groupList',
  item: 'syncMerge.groupItem',
  supermarket: 'syncMerge.groupSupermarket',
  category: 'syncMerge.groupCategory',
  dish: 'syncMerge.groupDish',
}

export const groupHeading = (t: TFunction, type: GroupType): string => t(GROUP_KEY[type])

export const groupTitle = (g: MergeGroup): string => (g.type === 'week' ? formatWeekLabelWithYear(g.label) : g.label)

export function statusLabel(t: TFunction, g: MergeGroup): string {
  if (g.status === 'onlyLocal') return t('syncMerge.statusOnlyLocal')
  if (g.status === 'onlyRemote') return t('syncMerge.statusOnlyRemote')
  return t('syncMerge.statusDifferent')
}

/** Etichetta di una scelta, che dipende da dove si trova il gruppo (tenere/togliere, portare/non portare…). */
export function optionLabel(t: TFunction, g: MergeGroup, choice: Choice): string {
  if (choice === 'both') return t('syncMerge.optBoth')
  if (g.status === 'onlyLocal') return choice === 'local' ? t('syncMerge.optKeep') : t('syncMerge.optRemove')
  if (g.status === 'onlyRemote') return choice === 'local' ? t('syncMerge.optSkip') : t('syncMerge.optBring')
  return choice === 'local' ? t('syncMerge.optLocal') : t('syncMerge.optRemote')
}

/** "Spese 3 · Acquisti 32": cosa contiene il gruppo da una parte. */
export function countsText(t: TFunction, counts: Partial<Record<TableName, number>>): string {
  return Object.entries(counts)
    .map(([table, n]) => `${t(`syncPage.tables.${table}`)} ${n}`)
    .join(' · ')
}
