import { createHash } from 'node:crypto'
import { readFileSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

import { buildCsp } from './src/lib/csp'

/** File di `public/` che servono solo in sviluppo (mockup di design) e non vanno pubblicati. */
const DEV_ONLY_PUBLIC_FILES = ['spesa-design.html', 'support.js']

/**
 * Solo per il build di produzione:
 * - inietta la Content-Security-Policy come <meta> (con l'hash degli script inline, es. quello del tema);
 * - toglie dal deploy il mockup di design, che carica script da unpkg.com nella stessa origine
 *   dell'app (e quindi con accesso al token salvato nel localStorage).
 */
function hardenedProduction(): Plugin {
  let outDir = 'dist'
  return {
    name: 'hardened-production',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
          (m) => `sha256-${createHash('sha256').update(m[1]).digest('base64')}`,
        )
        const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(hashes)}" />`
        return html.replace('<head>', `<head>\n    ${meta}`)
      },
    },
    closeBundle() {
      for (const f of DEV_ONLY_PUBLIC_FILES) {
        rmSync(fileURLToPath(new URL(`./${outDir}/${f}`, import.meta.url)), { force: true })
      }
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    hardenedProduction(),
    tailwindcss(),
    VitePWA({
      // 'prompt' invece di 'autoUpdate': lasciamo che sia UpdateNotifier a decidere
      // quando applicare l'update (mai a metà sessione, solo al resume dell'app).
      registerType: 'prompt',
      pwaAssets: { config: true },
      manifest: {
        name: 'App Spesa',
        short_name: 'Spesa',
        description: 'Gestione spesa con buoni pasto',
        theme_color: '#F2F2F0',
        background_color: '#F2F2F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Il mockup di design non fa parte dell'app pubblicata.
        globIgnores: DEV_ONLY_PUBLIC_FILES,
        // SPA: il service worker serve l'app shell per le navigazioni (anche offline)
        // sulle route del router. Complementare al 404.html del deploy GitHub Pages.
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
