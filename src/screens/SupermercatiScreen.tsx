import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { formatCentsPlain } from '../lib/money'
import { useSupermarkets, useUpdateLoyaltyCard } from '../hooks/useItems'
import { useSupermarketStats } from '../hooks/usePriceHistory'
import { BottomSheet } from '../components/BottomSheet'
import { upsertSupermarket, deleteSupermarket } from '../db/repositories/supermarkets'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../db/queryKeys'
import { compressImage } from '../lib/imageUtils'
import type { Supermarket } from '../db/types'
import { BackButton } from '../components/BackButton'

export function SupermercatiScreen() {
  const { t } = useTranslation()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [cardSheet, setCardSheet] = useState<Supermarket | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)
  const [showRemoveCardConfirm, setShowRemoveCardConfirm] = useState(false)

  const qc = useQueryClient()
  const { data: supermarkets = [] } = useSupermarkets()
  const { data: stats = [] } = useSupermarketStats()
  const updateLoyaltyCard = useUpdateLoyaltyCard()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !cardSheet?.id) return
    try {
      const dataUrl = await compressImage(file)
      updateLoyaltyCard.mutate(
        { id: cardSheet.id, imageDataUrl: dataUrl },
        { onSuccess: () => setCardSheet(null) },
      )
    } catch {
      toast.error(t('supermercati.cardError'))
    }
  }

  const handleRemoveCard = () => {
    if (!cardSheet?.id) return
    updateLoyaltyCard.mutate(
      { id: cardSheet.id, imageDataUrl: null },
      { onSuccess: () => setCardSheet(null) },
    )
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void handleFileChange(e)}
      />

      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        <div className="flex items-center gap-2 pt-2 pb-[18px]">
          <BackButton />
          <span className="text-[26px] font-normal tracking-[-0.5px] text-t-fg">{t('supermercati.title')}</span>
        </div>

        {supermarkets.length === 0 && (
          <div className="text-center py-16 text-t-muted text-sm">
            {t('supermercati.empty')}
          </div>
        )}

        {supermarkets.map((s) => {
          const st = statsMap[s.id ?? 0]
          return (
            <div key={s.id} className="flex items-center gap-[14px] bg-t-surface rounded-[20px] px-5 py-[18px] mb-[10px]">
              <div className="w-[42px] h-[42px] rounded-[13px] bg-t-bg flex items-center justify-center flex-none">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9l1-4h14l1 4M4 9h16M4 9v10h16V9M9 19v-5h6v5" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-normal text-t-fg">{s.name}</div>
                <div className="text-[13px] text-t-muted mt-0.5">
                  {t('supermercati.sessions', { count: st?.sessionCount ?? 0 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[18px] font-normal text-t-fg tabular-nums">
                  €{formatCentsPlain(st?.totalSpentCents ?? 0)}
                </div>
                <div className="text-[12px] text-t-muted">{t('supermercati.total')}</div>
              </div>
              {/* Tessera fedeltà */}
              <button
                onClick={() => setCardSheet(s)}
                className="w-[48px] h-[30px] flex-none rounded-[7px] overflow-hidden active:opacity-60 transition-opacity"
                aria-label={t('supermercati.loyaltyCard')}
              >
                {s.loyaltyCard ? (
                  <img
                    src={s.loyaltyCard}
                    alt={t('supermercati.cardOf', { name: s.name })}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[7px] border border-dashed border-t-line2 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M12 10v4M10 12h4" />
                    </svg>
                  </div>
                )}
              </button>
              <button
                onClick={() => s.id !== undefined && setPendingDelete({ id: s.id, name: s.name })}
                className="w-8 h-8 flex items-center justify-center opacity-30 active:opacity-80 ml-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          )
        })}

        <button
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 bg-t-surface rounded-[20px] px-5 py-[18px] active:bg-t-surface2 transition-colors"
        >
          <div className="w-[42px] h-[42px] rounded-[13px] bg-t-bg flex items-center justify-center flex-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--t-fg)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span className="text-base text-t-muted">{t('supermercati.add')}</span>
        </button>
      </div>

      {/* Sheet: nuovo supermercato */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} hasInput>
        <div className="text-[20px] font-normal text-t-fg px-0.5 pb-[6px]">{t('supermercati.newTitle')}</div>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('supermercati.namePlaceholder')}
          data-autofocus
          onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
          className="w-full border-0 border-b border-t-line outline-none bg-transparent px-0.5 py-3 text-[18px] text-t-fg mb-3"
        />
        <button
          onClick={() => void handleAdd()}
          className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.add')}
        </button>
      </BottomSheet>

      {/* Conferma elimina supermercato */}
      <BottomSheet open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-2">
          {t('supermercati.deleteConfirmTitle', { name: pendingDelete?.name ?? '' })}
        </div>
        <div className="text-[15px] text-t-muted px-0.5 pb-6">{t('supermercati.deleteConfirmBody')}</div>
        <button
          onClick={() => {
            if (pendingDelete) void handleDelete(pendingDelete.id, pendingDelete.name)
            setPendingDelete(null)
          }}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('supermercati.deleteConfirm')}
        </button>
        <button
          onClick={() => setPendingDelete(null)}
          className="w-full bg-t-bg text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Conferma rimuovi tessera */}
      <BottomSheet open={showRemoveCardConfirm} onClose={() => setShowRemoveCardConfirm(false)}>
        <div className="text-[20px] font-normal text-t-danger px-0.5 pb-2">
          {t('supermercati.removeCardConfirmTitle')}
        </div>
        <button
          onClick={() => {
            handleRemoveCard()
            setShowRemoveCardConfirm(false)
          }}
          className="w-full bg-t-danger text-t-on text-[17px] py-[18px] rounded-[20px] mb-3 active:scale-[.98] transition-transform"
        >
          {t('supermercati.removeCardConfirm')}
        </button>
        <button
          onClick={() => setShowRemoveCardConfirm(false)}
          className="w-full bg-t-bg text-t-fg text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
        >
          {t('common.cancel')}
        </button>
      </BottomSheet>

      {/* Sheet: tessera fedeltà */}
      <BottomSheet open={cardSheet !== null} onClose={() => setCardSheet(null)}>
        <div className="text-[20px] font-normal text-t-fg px-0.5 pb-[16px]">
          {t('supermercati.loyaltyCard')}
        </div>
        {cardSheet?.loyaltyCard ? (
          <>
            <img
              src={cardSheet.loyaltyCard}
              alt={t('supermercati.cardOf', { name: cardSheet.name })}
              className="w-full max-h-[220px] object-contain rounded-[16px] bg-t-surface2"
            />
            <div className="flex flex-col gap-2 mt-5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-t-line bg-t-surface2 text-t-fg text-[16px] py-[16px] rounded-[18px] active:opacity-70 transition-opacity"
              >
                {t('supermercati.replaceCard')}
              </button>
              <button
                onClick={() => setShowRemoveCardConfirm(true)}
                className="w-full text-t-danger2 text-[16px] py-[14px] rounded-[18px] active:opacity-60 transition-opacity"
              >
                {t('supermercati.removeCard')}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-t-accent text-t-on text-[17px] py-[18px] rounded-[20px] active:scale-[.98] transition-transform"
          >
            {t('supermercati.addCard')}
          </button>
        )}
      </BottomSheet>
    </>
  )
}
