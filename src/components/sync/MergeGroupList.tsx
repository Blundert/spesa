import { useTranslation } from 'react-i18next'
import type { Choice, GroupType, MergeGroup } from '../../lib/backupMerge'
import { countsText, groupHeading, groupTitle, optionLabel, statusLabel } from './mergeText'

const TYPES: GroupType[] = ['week', 'list', 'item', 'supermarket', 'category', 'dish']

function ChoiceSwitch({
  group,
  value,
  onChange,
}: {
  group: MergeGroup
  value: Choice
  onChange: (c: Choice) => void
}) {
  const { t } = useTranslation()
  return (
    <div role="group" className="flex gap-1.5 mt-2.5">
      {group.choices.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={`flex-1 px-2 py-2 rounded-[12px] text-[13px] transition-colors ${
            value === c ? 'bg-t-accent text-t-on' : 'bg-t-surface2 text-t-fg'
          }`}
        >
          {optionLabel(t, group, c)}
        </button>
      ))}
    </div>
  )
}

/** I gruppi da decidere, per tipo: settimane, liste, articoli, negozi, categorie, piatti. */
export function MergeGroupList({
  plan,
  choices,
  onChoice,
}: {
  plan: MergeGroup[]
  choices: Record<string, Choice>
  onChoice: (id: string, c: Choice) => void
}) {
  const { t } = useTranslation()
  return (
    <div data-testid="merge-groups">
      {TYPES.map((type) => {
        const groups = plan.filter((g) => g.type === type)
        if (groups.length === 0) return null
        return (
          <section key={type} className="mb-6">
            <div className="text-[12px] tracking-[1.2px] text-t-muted uppercase px-1.5 pb-2.5">
              {groupHeading(t, type)} · {groups.length}
            </div>
            <div className="bg-t-surface rounded-[20px] overflow-hidden">
              {groups.map((g, i) => (
                <div
                  key={g.id}
                  className="px-5 py-4"
                  style={{ borderBottom: i < groups.length - 1 ? '1px solid var(--t-line)' : 'none' }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[15px] text-t-fg">{groupTitle(g)}</span>
                    <span className="text-[12px] text-t-muted text-right">{statusLabel(t, g)}</span>
                  </div>
                  {Object.keys(g.local).length > 0 && (
                    <div className="text-[12px] text-t-muted mt-1">
                      {t('syncMerge.here')}: {countsText(t, g.local)}
                    </div>
                  )}
                  {Object.keys(g.remote).length > 0 && (
                    <div className="text-[12px] text-t-muted">
                      {t('syncMerge.there')}: {countsText(t, g.remote)}
                    </div>
                  )}
                  <ChoiceSwitch group={g} value={choices[g.id]} onChange={(c) => onChoice(g.id, c)} />
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
