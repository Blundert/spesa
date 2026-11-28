import type { ShareItem } from './shareLink'

/**
 * Testo da mandare a WhatsApp, Telegram o Note: titolo, riga vuota, una voce per riga (così in Note
 * basta selezionare le righe e toccare la checklist) e, se c'è, il link spuntabile in coda.
 * `link.label` è la frase tradotta che precede il link.
 */
export function buildShareText(name: string, items: ShareItem[], link: { label: string; url: string } | null): string {
  const lines = items.map((i) => (i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name))
  const parts = [name]
  if (lines.length > 0) parts.push(lines.join('\n'))
  if (link) parts.push(`${link.label}: ${link.url}`)
  return parts.join('\n\n')
}
