import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { RangeSelector } from '../components/RangeSelector'
import { useDesktopStats, type DesktopRange } from '../../hooks/useDesktopStats'
import { formatCents } from '../../lib/money'
import { formatWeekLabel } from '../../lib/date'

const DAY_LABELS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const AREA_COLORS = [
  '#2A2A2C', '#6B6B70', '#9B9B9F', '#B5B5BA', '#D1D1D6', '#AEAEB2', '#48484A',
]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: '13px',
        fontWeight: 500,
        color: '#9B9B9F',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        margin: '0 0 16px',
      }}
    >
      {children}
    </h2>
  )
}

export function AdvancedStatsScreen() {
  const [range, setRange] = useState<DesktopRange>(12)
  const { dayPattern, categoryEvolution, budgetEfficiency, supermarketStats } = useDesktopStats(range)

  const dayData = (dayPattern.data ?? []).map((d) => ({
    label: DAY_LABELS_IT[d.dayIndex],
    sessioni: d.sessionCount,
  }))

  // Stacked area chart: all category names across weeks
  const evoData = categoryEvolution.data ?? []
  const allCategories = Array.from(
    new Set(evoData.flatMap((row) => Object.keys(row.categories))),
  )
  const areaData = evoData.map((row) => ({
    label: formatWeekLabel(row.weekKey),
    ...row.categories,
  }))

  // Budget efficiency stacked bar
  const effData = (budgetEfficiency.data ?? []).map((r) => ({
    label: formatWeekLabel(r.weekKey),
    buoni: r.buoniCoveredCents,
    tasca: r.outOfPocketCents,
  }))

  // Supermarket table
  const smRows = supermarketStats.data ?? []

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2A2A2C', margin: 0, letterSpacing: '-0.3px' }}>
            Statistiche avanzate
          </h1>
          <div style={{ fontSize: '13px', color: '#9B9B9F', marginTop: '2px' }}>
            Analisi approfondite
          </div>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {/* Day-of-week pattern */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <SectionTitle>Pattern per giorno della settimana</SectionTitle>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={dayData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9B9B9F' }} tickLine={false} axisLine={false} />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#9B9B9F' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              formatter={(v: number) => [v, 'Sessioni']}
              contentStyle={{
                background: '#2A2A2C', border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '13px',
              }}
            />
            <Bar dataKey="sessioni" fill="#2A2A2C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget efficiency */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <SectionTitle>Copertura buoni pasto</SectionTitle>
        {effData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={effData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  `€ ${formatCents(v)}`,
                  name === 'buoni' ? 'Buoni pasto' : 'Di tasca',
                ]}
                contentStyle={{ background: '#2A2A2C', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
              />
              <Legend
                formatter={(v) => (v === 'buoni' ? 'Buoni pasto' : 'Di tasca')}
                wrapperStyle={{ fontSize: '12px', color: '#9B9B9F' }}
              />
              <Bar dataKey="buoni" stackId="a" fill="#9B9B9F" />
              <Bar dataKey="tasca" stackId="a" fill="#2A2A2C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#9B9B9F', fontSize: '13px' }}>Nessun dato</div>
        )}
      </div>

      {/* Category evolution */}
      {areaData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <SectionTitle>Evoluzione categorie</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v: number, name: string) => [`€ ${formatCents(v)}`, name]}
                contentStyle={{ background: '#2A2A2C', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#9B9B9F' }} />
              {allCategories.map((cat, i) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stackId="cats"
                  stroke={AREA_COLORS[i % AREA_COLORS.length]}
                  fill={AREA_COLORS[i % AREA_COLORS.length]}
                  fillOpacity={0.7}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Supermarket detail table */}
      {smRows.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <SectionTitle>Dettaglio supermercati</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                {['Supermercato', 'Sessioni', 'Totale speso', 'Media', 'Ultima visita'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left', padding: '8px 12px 12px 0',
                      fontSize: '11px', fontWeight: 500, color: '#9B9B9F',
                      borderBottom: '1px solid #F2F2F0', letterSpacing: '0.3px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {smRows.map((sm) => (
                <tr key={sm.id} style={{ borderBottom: '1px solid #F2F2F0' }}>
                  <td style={{ padding: '12px 12px 12px 0', color: '#2A2A2C', fontWeight: 500 }}>{sm.name}</td>
                  <td style={{ padding: '12px 12px 12px 0', color: '#6B6B70' }}>{sm.sessionCount}</td>
                  <td style={{ padding: '12px 12px 12px 0', color: '#2A2A2C' }}>€ {formatCents(sm.totalCents)}</td>
                  <td style={{ padding: '12px 12px 12px 0', color: '#6B6B70' }}>€ {formatCents(sm.avgCents)}</td>
                  <td style={{ padding: '12px 12px 12px 0', color: '#9B9B9F', fontSize: '13px' }}>
                    {new Date(sm.lastVisitTs).toLocaleDateString('it-IT')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
