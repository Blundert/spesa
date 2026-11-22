import { useTranslation } from 'react-i18next'
import type { ShoppingList } from '../../db/types'
import { useJoinShopping } from '../../hooks/useSharedLists'
import { displayName } from '../../lib/sharedLists'

/**
 * "Anna ha iniziato la spesa da Esselunga": per ogni persona di una lista condivisa che ha una spesa in corso.
 * Toccandola si parte con le sue impostazioni (negozio, buoni, valore del buono). Solo per le liste condivise.
 */
export function SharedShoppingBanner({ list }: { list: ShoppingList | undefined }) {
  const { t } = useTranslation()
  const join = useJoinShopping()
  const link = list?.shared
  const active = link?.shopping ?? []
  if (!link || list?.id === undefined || active.length === 0) return null
  const listId = list.id
  return (
    <div className="px-1.5 mb-3 flex flex-col gap-2" data-testid="shared-shopping">
      {active.map((entry) => (
        <button
          key={entry.by}
          onClick={() => void join(entry, listId)}
          className="w-full text-left bg-t-accent text-t-on text-[14px] rounded-[14px] px-4 py-3 active:opacity-80"
        >
          {t('shared.shoppingBanner', { name: displayName(link, entry.by), store: entry.supermarketName })}
        </button>
      ))}
    </div>
  )
}
