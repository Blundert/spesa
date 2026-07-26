export const LAST_SEEN_APP_VERSION_KEY = 'last-seen-app-version'

export function getLastSeenAppVersion(): string | null {
  return localStorage.getItem(LAST_SEEN_APP_VERSION_KEY)
}

export function setLastSeenAppVersion(version: string): void {
  localStorage.setItem(LAST_SEEN_APP_VERSION_KEY, version)
}
