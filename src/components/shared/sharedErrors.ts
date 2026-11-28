import type { TFunction } from 'i18next'
import { SharedListError, type SharedListErrorCode } from '../../lib/sharedLists'
import { SharedSyncError, type SharedSyncCode } from '../../lib/sharedSync'
import type { SyncOutcome } from '../../lib/sharedSyncScheduler'

const MESSAGES: Record<SharedListErrorCode | SharedSyncCode, (t: TFunction) => string> = {
  'not-connected': (t) => t('shared.errNotConnected'),
  'name-taken': (t) => t('shared.errNameTaken'),
  'invalid-name': (t) => t('shared.errInvalidName'),
  'no-permission': (t) => t('shared.errNoPermission'),
  'user-not-found': (t) => t('shared.errUserNotFound'),
  'cannot-invite': (t) => t('shared.errCannotInvite'),
  'no-access': (t) => t('shared.errNoAccess'),
  'not-ready': (t) => t('shared.errNotReady'),
  invalid: (t) => t('shared.errInvalid'),
  'already-joined': (t) => t('shared.errAlreadyJoined'),
  'no-token': (t) => t('shared.errNotConnected'),
  auth: (t) => t('shared.errAuth'),
  'invalid-remote': (t) => t('shared.errInvalid'),
  'newer-format': (t) => t('shared.errNewerFormat'),
  'read-only': (t) => t('shared.errReadOnly'),
  conflict: (t) => t('shared.errConflict'),
  network: (t) => t('shared.errNetwork'),
}

/** Messaggio per l'utente di un errore di condivisione o di sync di una lista condivisa. */
export function sharedErrorText(t: TFunction, e: unknown): string {
  if (e instanceof SharedListError || e instanceof SharedSyncError) return MESSAGES[e.code](t)
  return t('shared.errGeneric')
}

/** Riga di stato della sync di una lista condivisa: in corso, aggiornata alle…, offline o l'errore. */
export function syncOutcomeText(t: TFunction, outcome: SyncOutcome | undefined, locale: string): string {
  if (!outcome) return t('shared.syncing')
  if (outcome.ok) {
    const time = new Date(outcome.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    return t('shared.updatedAt', { time })
  }
  if (outcome.code === 'network') return t('shared.offline')
  // Durante la sync (non nell'aggiunta) "no-access" vuol dire che l'accesso è stato tolto.
  if (outcome.code === 'no-access') return t('shared.lostAccess')
  return outcome.code === 'unknown' ? t('shared.errGeneric') : MESSAGES[outcome.code](t)
}
