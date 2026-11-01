import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/PageHeader'
import { SortableTable, type Column } from '../components/SortableTable'
import { Modal } from '../components/Modal'
import { formatWeekLabelWithYear } from '../../lib/date'
import { usePlannedWeeks, useDeletePlannedWeek } from '../../hooks/useMealPlan'
import type { PlannedWeek } from '../../db/repositories/mealPlan'

const btn = {
  padding: '10px 18px',
  borderRadius: '10px',
  border: 'none',
  background: '#2A2A2C',
  color: '#fff',
  fontSize: '14px',
  cursor: 'pointer',
}
const linkBtn = {
  border: 'none',
  background: 'transparent',
  padding: '4px 8px',
  fontSize: '13px',
  color: '#9B9B9F',
  cursor: 'pointer',
}

export function DesktopPianificazioniScreen() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: weeks = [] } = usePlannedWeeks()
  const deleteWeek = useDeletePlannedWeek()
  const [toDelete, setToDelete] = useState<string | null>(null)

  const openWeek = (week: string) => void navigate({ to: '/pasti', search: { week } })

  const columns: Column<PlannedWeek>[] = [
    {
      key: 'week',
      label: t('desktop.pianificazioni.colWeek'),
      render: (w) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatWeekLabelWithYear(w.isoWeek)}</span>,
      sortValue: (w) => w.isoWeek,
    },
    {
      key: 'meals',
      label: t('desktop.pianificazioni.colMeals'),
      render: (w) => t('home.mealsPlanned', { count: w.mealCount }),
      sortValue: (w) => w.mealCount,
      align: 'right',
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (w) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          <button
            style={linkBtn}
            onClick={(e) => {
              e.stopPropagation()
              openWeek(w.isoWeek)
            }}
          >
            {t('desktop.pianificazioni.open')}
          </button>
          <button
            style={{ ...linkBtn, color: '#D14343' }}
            onClick={(e) => {
              e.stopPropagation()
              setToDelete(w.isoWeek)
            }}
          >
            {t('pianificazioni.deleteConfirm')}
          </button>
        </span>
      ),
    },
  ]

  return (
    <div style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', maxWidth: '1200px' }}>
      <PageHeader title={t('pianificazioni.title')} subtitle={t('desktop.pianificazioni.subtitle', { count: weeks.length })} />
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px' }}>
        <SortableTable
          columns={columns}
          rows={weeks}
          rowKey={(w) => w.isoWeek}
          defaultSort={{ key: 'week', dir: 'desc' }}
          onRowClick={(w) => openWeek(w.isoWeek)}
          emptyMessage={t('pianificazioni.empty')}
        />
      </div>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title={t('pianificazioni.deleteTitle', { week: toDelete ? formatWeekLabelWithYear(toDelete) : '' })}
        width={420}
      >
        <div style={{ fontSize: '14px', color: '#9B9B9F', marginBottom: '24px' }}>{t('pianificazioni.deleteBody')}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button style={{ ...btn, background: '#F2F2F0', color: '#2A2A2C' }} onClick={() => setToDelete(null)}>
            {t('common.cancel')}
          </button>
          <button
            style={{ ...btn, background: '#D14343' }}
            onClick={() => toDelete && deleteWeek.mutate(toDelete, { onSuccess: () => setToDelete(null) })}
          >
            {t('pianificazioni.deleteConfirm')}
          </button>
        </div>
      </Modal>
    </div>
  )
}
