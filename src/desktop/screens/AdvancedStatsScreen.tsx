import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { PageHeader, SectionTitle } from '../components/PageHeader'
import { RangeSelector } from '../components/RangeSelector'
import { useDesktopStats, type DesktopRange } from '../../hooks/useDesktopStats'
import { formatCents } from '../../lib/money'
import { dayShort, formatShortDate, formatWeekLabel } from '../../lib/date'

const TOP_CATEGORIES = 6

const AREA_COLORS = [
  '#2A2A2C', '#6B6B70', '#9B9B9F', '#B5B5BA', '#D1D1D6', '#AEAEB2', '#48484A',
]

export function AdvancedStatsScreen() {
  const { t } = useTranslation()
  const [range, setRange] = useState<DesktopRange>(12)
  const { dayPattern, categoryEvolution, budgetEfficiency, supermarketStats } = useDesktopStats(range)

  const dayData = (dayPattern.data ?? []).map((d) => ({
    label: dayShort(d.dayIndex),
    sessions: d.sessionCount,
  }))

  // Stacked area chart: le prime categorie per spesa nel periodo, il resto in "Altre".
  // Ogni settimana ha tutte le serie (0 se assente), altrimenti l'area si interrompe.
  const evoData = categoryEvolution.data ?? []
  const catTotals = new Map<string, number>()
  for (const row of evoData) {
    for (const [name, cents] of Object.entries(row.categories)) {
      catTotals.set(name, (catTotals.get(name) ?? 0) + cents)
    }
  }
  const rankedCategories = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const topCategories = rankedCategories.slice(0, TOP_CATEGORIES)
  const hasOthers = rankedCategories.length > TOP_CATEGORIES
  const otherLabel = t('desktop.stats.otherCategories')
  const allCategories = hasOthers ? [...topCategories, otherLabel] : topCategories
  const areaData = evoData.map((row) => {
    const point: Record<string, number | string> = { label: formatWeekLabel(row.weekKey) }
    for (const name of topCategories) point[name] = row.categories[name] ?? 0
    if (hasOthers) {
      point[otherLabel] = Object.entries(row.categories)
        .filter(([name]) => !topCategories.includes(name))
        .reduce((sum, [, cents]) => sum + cents, 0)
    }
    return point
  })

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
      <PageHeader
        title={t('desktop.stats.title')}
        subtitle={t('desktop.stats.subtitle')}
        right={<RangeSelector value={range} onChange={setRange} />}
      />

      {/* Day-of-week pattern */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <SectionTitle>{t('desktop.stats.dayPattern')}</SectionTitle>
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
              formatter={(v) => [Number(v), t('desktop.stats.sessions')]}
              contentStyle={{
                background: '#2A2A2C', border: 'none', borderRadius: '10px',
                color: '#fff', fontSize: '13px',
              }}
            />
            <Bar dataKey="sessions" fill="#2A2A2C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget efficiency */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <SectionTitle>{t('desktop.stats.coverage')}</SectionTitle>
        {effData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={effData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v, name) => [
                  `€ ${formatCents(Number(v))}`,
                  name === 'buoni' ? t('desktop.stats.buoni') : t('desktop.stats.outOfPocket'),
                ]}
                contentStyle={{ background: '#2A2A2C', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px' }}
              />
              <Legend
                formatter={(v) => (v === 'buoni' ? t('desktop.stats.buoni') : t('desktop.stats.outOfPocket'))}
                wrapperStyle={{ fontSize: '12px', color: '#9B9B9F' }}
              />
              <Bar dataKey="buoni" stackId="a" fill="#9B9B9F" />
              <Bar dataKey="tasca" stackId="a" fill="#2A2A2C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#9B9B9F', fontSize: '13px' }}>{t('desktop.noData')}</div>
        )}
      </div>

      {/* Category evolution */}
      {areaData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
          <SectionTitle>{t('desktop.stats.categoryEvolution')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={areaData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#F2F2F0" strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tickFormatter={(v) => `€${(v / 100).toFixed(0)}`} tick={{ fontSize: 11, fill: '#9B9B9F' }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                formatter={(v, name) => [`€ ${formatCents(Number(v))}`, String(name)]}
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
                  fillOpacity={0.85}
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
          <SectionTitle>{t('desktop.stats.supermarketDetail')}</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr>
                {[t('desktop.stats.colSupermarket'), t('desktop.stats.colSessions'), t('desktop.stats.colTotal'), t('desktop.stats.colAvg'), t('desktop.stats.colLastVisit')].map((h) => (
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
                    {formatShortDate(sm.lastVisitTs)}
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
