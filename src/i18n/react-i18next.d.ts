import 'react-i18next'
import type { it } from './locales/it'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof it
    }
  }
}
