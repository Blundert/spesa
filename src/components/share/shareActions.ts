import { toast } from 'sonner'
import type { TFunction } from 'i18next'

/** Copia negli appunti e avvisa; se il browser non lo permette lo dice. */
export async function copyToClipboard(text: string, doneMessage: string, t: TFunction): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast(doneMessage)
  } catch {
    toast(t('share.failed'))
  }
}

/** Share sheet di sistema (WhatsApp, Telegram, Note…) se c'è, altrimenti copia il testo. Annullare non è un errore. */
export async function shareText(text: string, t: TFunction): Promise<void> {
  if (typeof navigator.share !== 'function') {
    await copyToClipboard(text, t('share.textCopied'), t)
    return
  }
  try {
    await navigator.share({ text })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    await copyToClipboard(text, t('share.textCopied'), t)
  }
}
