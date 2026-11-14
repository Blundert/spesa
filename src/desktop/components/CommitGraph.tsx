import type { GraphRow } from '../../lib/commitGraph'
import { seriesColor } from '../chartColors'
import { formatDateTime } from '../../components/sync/historyText'

const LANE = 16 // larghezza di una corsia
const ROW = 44 // altezza di una riga

/** Grafo dei commit: una riga per commit con le linee delle corsie in SVG (colori dei temi) e i branch in punta. */
export function CommitGraph({
  rows,
  selected,
  onSelect,
}: {
  rows: GraphRow[]
  selected: string | null
  onSelect: (sha: string) => void
}) {
  const lanes = Math.max(1, ...rows.map((r) => r.width))
  const x = (lane: number) => LANE / 2 + lane * LANE
  const mid = ROW / 2
  const width = lanes * LANE
  return (
    <div role="list" data-testid="commit-graph">
      {rows.map((r) => {
        const active = selected === r.commit.sha
        return (
          <button
            key={r.commit.sha}
            role="listitem"
            onClick={() => onSelect(r.commit.sha)}
            aria-pressed={active}
            style={{
              all: 'unset',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              height: `${ROW}px`,
              cursor: 'pointer',
              borderRadius: '10px',
              background: active ? 'var(--t-surface2)' : 'transparent',
            }}
          >
            <svg width={width} height={ROW} style={{ flex: 'none' }} aria-hidden="true">
              {r.through.map((i) => (
                <line key={`t${i}`} x1={x(i)} y1={0} x2={x(i)} y2={ROW} stroke={seriesColor(i)} strokeWidth={2} />
              ))}
              {r.incoming.map((i) => (
                <line key={`i${i}`} x1={x(i)} y1={0} x2={x(r.lane)} y2={mid} stroke={seriesColor(i)} strokeWidth={2} />
              ))}
              {r.outgoing.map((j, k) => (
                <line key={`o${k}`} x1={x(r.lane)} y1={mid} x2={x(j)} y2={ROW} stroke={seriesColor(j)} strokeWidth={2} />
              ))}
              <circle cx={x(r.lane)} cy={mid} r={5} fill={seriesColor(r.lane)} stroke="var(--t-surface)" strokeWidth={2} />
            </svg>
            <span style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              {r.refs.map((ref) => (
                <span
                  key={ref}
                  style={{
                    flex: 'none',
                    fontSize: '11px',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    background: 'var(--t-accent)',
                    color: 'var(--t-on)',
                  }}
                >
                  {ref}
                </span>
              ))}
              <span style={{ fontSize: '13px', color: 'var(--t-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.commit.message}
              </span>
            </span>
            <span style={{ flex: 'none', fontSize: '12px', color: 'var(--t-muted)', fontVariantNumeric: 'tabular-nums', paddingRight: '8px' }}>
              {formatDateTime(new Date(r.commit.date).getTime())}
            </span>
          </button>
        )
      })}
    </div>
  )
}
