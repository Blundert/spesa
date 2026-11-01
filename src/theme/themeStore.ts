import { useSyncExternalStore } from 'react'
import {
  THEME_PREVIEW,
  THEME_STORAGE_KEY,
  parseThemePref,
  resolveTheme,
  serializeThemePref,
  type ThemePref,
} from '../lib/theme'

// Preferenza del tema: salvata sul dispositivo, applicata come attributo su <html>
// (i token stanno in themes.css) e al colore della barra del browser.

const query = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

function read(): ThemePref {
  try {
    return parseThemePref(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return parseThemePref(null)
  }
}

let current: ThemePref = read()

function apply(): void {
  const id = resolveTheme(current, query.matches)
  document.documentElement.setAttribute('data-app-theme', id)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_PREVIEW[id].bg)
}

function emit(): void {
  apply()
  listeners.forEach((l) => l())
}

export function getThemePref(): ThemePref {
  return current
}

export function setThemePref(next: ThemePref): void {
  current = next
  try {
    localStorage.setItem(THEME_STORAGE_KEY, serializeThemePref(next))
  } catch {
    // storage non disponibile: la scelta vale solo finché l'app resta aperta
  }
  emit()
}

/** Da chiamare una volta all'avvio: segue il tema del dispositivo e le modifiche fatte da un'altra scheda. */
export function initTheme(): void {
  apply()
  query.addEventListener('change', () => {
    if (current.auto) emit()
  })
  window.addEventListener('storage', (e) => {
    if (e.key !== THEME_STORAGE_KEY) return
    current = read()
    emit()
  })
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getThemePref)
}
