import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  LabelList,
} from 'recharts'
import { StatCard } from '../components/StatCard'
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { RangeSelector } from '../components/RangeSelector'
import { useDesktopStats, type DesktopRange } from '../../hooks/useDesktopStats'
import { formatCents } from '../../lib/money'
import { formatWeekLabelWithYear } from '../../lib/date'
import { CHART, seriesColor } from '../chartColors'

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
        background: 'var(--t-accent)',
        color: 'var(--t-on)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {label && <div style={{ marginBottom: '6px', color: 'var(--t-muted)', fontSize: '11px' }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--t-faint)' }}>{p.name}:</span>
          <span style={{ fontWeight: 500 }}>€ {formatCents(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardScreen() {
  const { t } = useTranslation()
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
      label: formatWeekLabelWithYear(w.weekKey),
      totalCents: w.totalCents,
      outOfPocketCents: eff?.outOfPocketCents ?? w.totalCents,
    }
  })

  // Pie chart: category breakdown
  const pieData = (s?.categoryBreakdown ?? []).map((c, i) => ({
    name: c.name,
    value: c.totalCents,
    color: seriesColor(i),
  }))

  // Bar chart: top supermarkets
  const smBarData = sm.slice(0, 6).map((m) => ({
    name: m.name.length > 14 ? m.name.slice(0, 13) + '…' : m.name,
    totalCents: m.totalCents,
    sessionCount: m.sessionCount,
  }))

  const isEmpty = !s || s.sessionCount === 0

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader
        title={t('desktop.dashboard.title')}
        subtitle={t('desktop.dashboard.subtitle')}
        right={<RangeSelector value={range} onChange={setRange} />}
      />

      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--t-muted)', fontSize: '15px' }}>
          {t('desktop.dashboard.empty')}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <StatCard
              label={t('statistiche.totalSpent')}
              value={`€ ${formatCents(s.totalCents)}`}
            />
            <StatCard
              label={t('statistiche.sessions')}
              value={String(s.sessionCount)}
            />
            <StatCard
              label={t('statistiche.avgPerSession')}
              value={`€ ${formatCents(s.avgCents)}`}
            />
            <StatCard
              label={t('statistiche.favoriteSupermarket')}
              value={s.topSupermarketName ?? '—'}
            />
          </div>

          {/* Spending trend */}
          <div style={{ background: 'var(--t-surface)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <SectionTitle>{t('desktop.dashboard.trendTitle')}</SectionTitle>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={lineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--t-bg)" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--t-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `€${(v / 100).toFixed(0)}`}
                  tick={{ fontSize: 11, fill: 'var(--t-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<EuroTooltip />} />
                <Line
                  type="monotone"
                  dataKey="totalCents"
                  name={t('desktop.dashboard.total')}
                  stroke={CHART.total}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART.total }}
                />
                <Line
                  type="monotone"
                  dataKey="outOfPocketCents"
                  name={t('desktop.dashboard.outOfPocket')}
                  stroke={CHART.outOfPocket}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: CHART.outOfPocket }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom row: pie + supermarket bar */}
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {/* Category pie */}
            <div
              style={{
                background: 'var(--t-surface)',
                borderRadius: '16px',
                padding: '24px',
                flex: '1 1 320px',
                minWidth: 0,
              }}
            >
              <SectionTitle>{t('desktop.dashboard.categories')}</SectionTitle>
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
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
                  <div style={{ flex: 1, minWidth: 0, maxHeight: '160px', overflowY: 'auto' }}>
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
                          <span style={{ fontSize: '13px', color: 'var(--t-fg)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.name}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--t-muted)', flexShrink: 0 }}>
                            {pct}%
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--t-muted)', fontSize: '13px' }}>{t('desktop.noData')}</div>
              )}
            </div>

            {/* Supermarket bar chart */}
            <div
              style={{
                background: 'var(--t-surface)',
                borderRadius: '16px',
                padding: '24px',
                flex: '1 1 320px',
                minWidth: 0,
              }}
            >
              <SectionTitle>{t('desktop.dashboard.supermarkets')}</SectionTitle>
              {smBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={Math.max(160, smBarData.length * 36)}>
                  <BarChart
                    data={smBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 72, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12, fill: 'var(--t-fg)' }}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <Tooltip
                      formatter={(v) => [`€ ${formatCents(Number(v))}`, t('desktop.dashboard.total')]}
                      contentStyle={{
                        background: 'var(--t-accent)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'var(--t-on)',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="totalCents" radius={[0, 6, 6, 0]}>
                      {smBarData.map((_, i) => (
                        <Cell key={i} fill={seriesColor(i)} />
                      ))}
                      <LabelList
                        dataKey="totalCents"
                        position="right"
                        formatter={(v) => `€ ${formatCents(Number(v))}`}
                        style={{ fontSize: 12, fill: 'var(--t-fg)' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--t-muted)', fontSize: '13px' }}>{t('desktop.noData')}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
