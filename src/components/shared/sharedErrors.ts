import type { TFunction } from 'i18next'
import { SharedListError, type SharedListErrorCode } from '../../lib/sharedLists'
import { SharedSyncError, type SharedSyncCode } from '../../lib/sharedSync'

const MESSAGES: Record<SharedListErrorCode | SharedSyncCode, (t: TFunction) => string> = {
  'not-connected': (t) => t('shared.errNotConnected'),
  'name-taken': (t) => t('shared.errNameTaken'),
  'invalid-name': (t) => t('shared.errInvalidName'),
  'no-permission': (t) => t('shared.errNoPermission'),
  'user-not-found': (t) => t('shared.errUserNotFound'),
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
