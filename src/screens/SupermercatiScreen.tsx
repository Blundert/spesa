import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatCentsPlain } from '../lib/money'
import { useSupermarkets } from '../hooks/useItems'
import { useSupermarketStats } from '../hooks/usePriceHistory'
import { BottomSheet } from '../components/BottomSheet'
import { upsertSupermarket, deleteSupermarket } from '../db/repositories/supermarkets'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'

export function SupermercatiScreen() {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const qc = useQueryClient()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: stats = [] } = useSupermarketStats()

  const statsMap = Object.fromEntries(stats.map((s) => [s.supermarket.id ?? 0, s]))

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    await upsertSupermarket(name)
    void qc.invalidateQueries({ queryKey: qk.supermarkets() })
    toast(t('supermercati.added', { name }), { description: t('supermercati.createdDesc') })
    setNewName('')
    setSheetOpen(false)
  }

  const handleDelete = async (id: number, name: string) => {
    await deleteSupermarket(id)
    void qc.invalidateQueries({ queryKey: qk.supermarkets() })
    toast(t('supermercati.removed', { name }))
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="px-1 pt-2 pb-[18px]">
          <span className="text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">{t('supermercati.title')}</span>
        </div>

        {supermarkets.length === 0 && (
          <div className="text-center py-16 text-[#9B9B9F] text-sm">
            {t('supermercati.empty')}
          </div>
        )}

        {supermarkets.map((s) => {
          const st = statsMap[s.id ?? 0]
          return (
            <div key={s.id} className="flex items-center gap-[14px] bg-white rounded-[20px] px-5 py-[18px] mb-[10px]">
              <div className="w-[42px] h-[42px] rounded-[13px] bg-[#F2F2F0] flex items-center justify-center flex-none">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9l1-4h14l1 4M4 9h16M4 9v10h16V9M9 19v-5h6v5" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-normal text-[#2A2A2C]">{s.name}</div>
                <div className="text-[13px] text-[#9B9B9F] mt-0.5">
                  {t('supermercati.sessions', { count: st?.sessionCount ?? 0 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-normal text-[#2A2A2C] tabular-nums">
                  €{formatCentsPlain(st?.totalSpentCents ?? 0)}
                </div>
                <div className="text-[12px] text-[#9B9B9F]">{t('supermercati.total')}</div>
              </div>
              <button
                onClick={() => s.id !== undefined && void handleDelete(s.id, s.name)}
                className="w-8 h-8 flex items-center justify-center opacity-30 active:opacity-80 ml-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          )
        })}

        <button
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 bg-white rounded-[20px] px-5 py-[18px] active:bg-[#F6F6F4] transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-[13px] bg-[#F2F2F0] flex items-center justify-center flex-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-base text-[#9B9B9F]">{t('supermercati.add')}</span>
        </button>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div className="text-[20px] font-normal text-[#2A2A2C] px-0.5 pb-[6px]">{t('supermercati.newTitle')}</div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('supermercati.namePlaceholder')}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          className="w-full border-0 border-b border-[#ECECEC] outline-none bg-transparent px-0.5 py-3 text-[18px] text-[#2A2A2C] mb-3"
        />
        <button
          onClick={() => void handleAdd()}
          className="w-full bg-[#2A2A2C] text-white text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.add')}
        </button>
      </BottomSheet>
    </>
  )
}
