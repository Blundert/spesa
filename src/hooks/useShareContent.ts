import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { categoryLabel } from '../i18n'
import { useCategories } from './useItems'
import { useListItems } from './useListItems'
import { qk } from '../db/queryKeys'
import { updateShoppingList } from '../db/repositories/shoppingLists'
import {
  buildShareUrl,
  encodeSharePayload,
  isShareTooLong,
  makeShareItems,
  newShareId,
} from '../lib/shareLink'
import { buildShareText } from '../lib/shareText'
import type { ShoppingList } from '../db/types'

export type ShareContent =
  | { status: 'loading' }
  | { status: 'tooLong' }
  | { status: 'error' }
  | { status: 'ready'; url: string; text: string }

/**
 * Link spuntabile e testo da condividere per una lista. Se `enabled` è falso non fa niente; la prima volta
 * che una lista viene condivisa le dà il suo id stabile (lo stesso id fa ritrovare le spunte a chi la riceve).
 */
export function useShareContent(list: ShoppingList | undefined, enabled: boolean): ShareContent {
  const { t } = useTranslation()
  const { data: rows = [] } = useListItems(enabled ? list?.id : undefined)
  const { data: categories = [] } = useCategories()
  const [content, setContent] = useState<ShareContent>({ status: 'loading' })
  const qc = useQueryClient()
  // Id appena creato e non ancora visibile nella cache delle liste: evita di generarne un secondo.
  const createdId = useRef<{ listId: number; id: string } | null>(null)

  useEffect(() => {
    if (!enabled || list?.id === undefined) return
    const listId = list.id
    let cancelled = false
    void (async () => {
      try {
        const catName = new Map(categories.map((c) => [c.id ?? 0, categoryLabel(t, c.name)]))
        const items = makeShareItems(
          rows.map((r) => ({
            name: r.itemName,
            quantity: r.quantity,
            category: catName.get(r.itemCategoryId) ?? t('categories.5'),
          })),
        )
        const created = createdId.current
        const pending = created?.listId === listId ? created.id : undefined
        const id = list.shareId ?? pending ?? newShareId()
        const encoded = await encodeSharePayload({ id, name: list.name, items })
        if (cancelled) return
        if (isShareTooLong(encoded)) {
          setContent({ status: 'tooLong' })
          return
        }
        if (list.shareId === undefined) {
          createdId.current = { listId, id }
          await updateShoppingList(listId, { shareId: id })
          await qc.invalidateQueries({ queryKey: qk.shoppingLists() })
        }
        const url = buildShareUrl(window.location.origin, encoded)
        const text = buildShareText(list.name, items, { label: t('share.linkLabel'), url })
        if (!cancelled) setContent({ status: 'ready', url, text })
      } catch {
        if (!cancelled) setContent({ status: 'error' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled, list, rows, categories, t, qc])

  return content
}
