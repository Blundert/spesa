import { useTranslation } from 'react-i18next'
import { BottomSheet } from '../BottomSheet'
import { useShareContent } from '../../hooks/useShareContent'
import { copyToClipboard, shareText } from './shareActions'
import type { ShoppingList } from '../../db/types'

/** Mobile: scelta fra condividere il testo (share sheet di sistema) o copiare solo il link spuntabile. */
export function ShareSheet({ list, open, onClose }: { list: ShoppingList | undefined; open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const content = useShareContent(list, open)
  const ready = content.status === 'ready'
  const row = 'w-full text-left bg-t-bg rounded-2xl px-[18px] py-4 mb-2.5 active:opacity-60 transition-opacity disabled:opacity-40'
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="px-1 pb-2">
        <div className="text-[22px] font-normal tracking-[-0.3px] text-t-fg mb-4">{t('share.title', { name: list?.name ?? '' })}</div>
        <button
          disabled={!ready}
          onClick={() => {
            if (!ready) return
            void shareText(content.text, t).then(onClose)
          }}
          className={row}
        >
          <div className="text-base text-t-fg">{t('share.asText')}</div>
          <div className="text-[13px] text-t-muted">{t('share.asTextHint')}</div>
        </button>
        <button
          disabled={!ready}
          onClick={() => {
            if (!ready) return
            void copyToClipboard(content.url, t('share.linkCopied'), t).then(onClose)
          }}
          className={row}
        >
          <div className="text-base text-t-fg">{t('share.copyLink')}</div>
        </button>
        {content.status === 'tooLong' && <div className="text-[13px] text-t-muted px-1 pt-1">{t('share.tooLong')}</div>}
        {content.status === 'error' && <div className="text-[13px] text-t-muted px-1 pt-1">{t('share.failed')}</div>}
      </div>
    </BottomSheet>
  )
}
