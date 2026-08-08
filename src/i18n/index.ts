import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { TFunction } from 'i18next'
import { it } from './locales/it'
import { en } from './locales/en'

export const LANG_KEY = 'app-language'
export type Lang = 'it' | 'en'

const stored = localStorage.getItem(LANG_KEY)
const initialLng: Lang = stored === 'en' || stored === 'it' ? stored : 'it'

void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: it },
    en: { translation: en },
  },
  lng: initialLng,
  fallbackLng: 'it',
  interpolation: { escapeValue: false },
})

/** Etichetta di una categoria: sempre il nome DB, così una rinomina si riflette ovunque. */
export function categoryLabel(t: TFunction, name?: string): string {
  return name ?? t('categories.5')
}

export default i18n
