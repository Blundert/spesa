import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { StatCard } from '../components/StatCard'
import { RangeSelector } from '../components/RangeSelector'
import { useDesktopStats, type DesktopRange } from '../../hooks/useDesktopStats'
import { formatCents } from '../../lib/money'
import { formatWeekLabel } from '../../lib/date'

const CATEGORY_COLORS = [
  '#2A2A2C', '#6B6B70', '#9B9B9F', '#B5B5BA', '#D1D1D6', '#AEAEB2',
  '#48484A', '#636366', '#8E8E93', '#C7C7CC',
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

interface CustomTooltipProps {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}

function EuroTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#2A2A2C',
        color: '#fff',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {label && <div style={{ marginBottom: '6px', color: '#9B9B9F', fontSize: '11px' }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: '#B5B5BA' }}>{p.name}:</span>
          <span style={{ fontWeight: 500 }}>€ {formatCents(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardScreen() {
  const [range, setRange] = useState<DesktopRange>(12)
  const { stats, supermarketStats, budgetEfficiency } = useDesktopStats(range)

  const s = stats.data
  const sm = supermarketStats.data ?? []
  const efficiency = budgetEfficiency.data ?? []

  // Prepare line chart data: weekly totals + out-of-pocket from efficiency
  const lineData = (s?.weeklyTotals ?? []).map((w) => {
    const eff = efficiency.find((e) => e.weekKey === w.weekKey)
    return {
      weekKey: w.weekKey,
      label: formatWeekLabel(w.weekKey),
      totalCents: w.totalCents,
      outOfPocketCents: eff?.outOfPocketCents ?? w.totalCents,
    }
  })

  // Pie chart: category breakdown
  const pieData = (s?.categoryBreakdown ?? []).map((c, i) => ({
    name: c.name,
    value: c.totalCents,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }))

  // Bar chart: top supermarkets
  const smBarData = sm.slice(0, 6).map((m) => ({
    name: m.name.length > 14 ? m.name.slice(0, 13) + '…' : m.name,
    totalCents: m.totalCents,
    sessionCount: m.sessionCount,
  }))

  const isEmpty = !s || s.sessionCount === 0

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2A2A2C', margin: 0, letterSpacing: '-0.3px' }}>
            Dashboard
          </h1>
          <div style={{ fontSize: '13px', color: '#9B9B9F', marginTop: '2px' }}>
            Riepilogo spese
          </div>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9B9B9F', fontSize: '15px' }}>
          Nessuna sessione completata nel periodo selezionato.
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <StatCard
              label="Totale speso"
              value={`€ ${formatCents(s.totalCents)}`}
            />
            <StatCard
              label="Sessioni"
              value={String(s.sessionCount)}
            />
            <StatCard
              label="Media per sessione"
              value={`€ ${formatCents(s.avgCents)}`}
            />
            <StatCard
              label="Supermercato preferito"
              value={s.topSupermarketName ?? '—'}
            />
          </div>

          {/* Spending trend */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <SectionTitle>Andamento spesa settimanale</SectionTitle>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#9B9B9F' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
                  tick={{ fontSize: 11, fill: '#9B9B9F' }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<EuroTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalCents"
                  name="Totale"
                  stroke="#2A2A2C"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#2A2A2C' }}
                />
                <Line
                  type="monotone"
                  dataKey="outOfPocketCents"
                  name="Di tasca"
                  stroke="#9B9B9F"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 3, fill: '#9B9B9F' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row: pie + supermarket bar */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Category pie */}
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                flex: '1 1 320px',
                minWidth: 0,
              }}
            >
              <SectionTitle>Categorie</SectionTitle>
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <PieChart width={160} height={160}>
                    <Pie
                      data={pieData}
                      cx={75}
                      cy={75}
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div style={{ flex: 1 }}>
                    {pieData.map((entry, i) => {
                      const pct = s.totalCents > 0 ? Math.round((entry.value / s.totalCents) * 100) : 0
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                          }}
                        >
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: entry.color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: '13px', color: '#2A2A2C', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#9B9B9F', flexShrink: 0 }}>
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#9B9B9F', fontSize: '13px' }}>Nessun dato</div>
              )}
            </div>

            {/* Supermarket bar chart */}
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                flex: '1 1 320px',
                minWidth: 0,
              }}
            >
              <SectionTitle>Supermercati</SectionTitle>
              {smBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={smBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
                      tick={{ fontSize: 10, fill: '#9B9B9F' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#2A2A2C' }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v: number) => [`€ ${formatCents(v)}`, 'Totale']}
                      contentStyle={{
                        background: '#2A2A2C',
                        border: 'none',
                        borderRadius: '10px',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="totalCents" fill="#2A2A2C" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: '#9B9B9F', fontSize: '13px' }}>Nessun dato</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
