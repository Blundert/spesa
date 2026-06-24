import {
  defineConfig,
  minimal2023Preset,
  combinePresetAndAppleSplashScreens,
} from '@vite-pwa/assets-generator/config'

// Icone come da preset 2023 (stessi nomi già in uso) + splash screen Apple
// (l'icona app centrata su sfondo chiaro #F2F2F0, in linea col background dell'app).
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: combinePresetAndAppleSplashScreens({
    ...minimal2023Preset,
    apple: { sizes: [180], padding: 0 },
  }, {
    padding: 0.5,
    resizeOptions: { background: '#F2F2F0', fit: 'contain' },
    darkResizeOptions: { background: '#1C1C1E', fit: 'contain' },
    linkMediaOptions: { addMediaScreen: true, basePath: '/', xhtml: false },
  }),
  images: ['public/icon.svg'],
})
