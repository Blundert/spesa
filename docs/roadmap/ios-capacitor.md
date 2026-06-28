# Piano — iOS Capacitor wrapper (Phase B)

## Obiettivo

Incapsulare la PWA esistente in un'app iOS nativa con Capacitor. iPad mostra automaticamente il layout desktop (già gestito dalla rilevazione viewport di Phase A). Funzionalità native minime: status bar, haptics, splash screen, share.

Il database Dexie non cambia.

---

## B1 — Installazione Capacitor

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
npm install @capacitor/status-bar @capacitor/haptics @capacitor/splash-screen @capacitor/share
npx cap init "Spesa" "com.wavelop.spesa" --web-dir dist
npx cap add ios
```

**Nuovo file: `capacitor.config.ts`**

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.wavelop.spesa',
  appName: 'Spesa',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F2F2F0',
      splashFullScreen: true,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#2A2A2C',
    },
  },
}

export default config
```

**`.gitignore`** — aggiungere `/ios/` (escluso il config).

---

## B2 — iPad → layout desktop

Già gestito da Phase A. La rilevazione viewport in `src/main.tsx` (breakpoint ≥ 768px) funziona anche nel WKWebView di Capacitor. iPad landscape → ~1024px → `isDesktop = true` → `<DesktopApp />`.

Nessun lavoro aggiuntivo.

---

## B3 — Integrazioni native

**Nuovo file: `src/lib/nativePlugins.ts`**

Utility con guard `Capacitor.isNativePlatform()` per tutti i plugin nativi. La PWA web non viene toccata.

**StatusBar:**
```ts
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return
  await StatusBar.setStyle({ style: Style.Dark })
}
```
Chiamata in `src/main.tsx` al mount dell'app.

**Haptics — punti di integrazione:**

| Azione utente | File | Tipo |
|---|---|---|
| Conferma acquisto | `SpesaScreen.tsx` | `ImpactStyle.Light` |
| Fine sessione | `SpesaScreen.tsx` | `ImpactStyle.Medium` |
| Swipe-to-delete | Componenti con delete | `ImpactStyle.Light` |

```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics'
if (Capacitor.isNativePlatform()) {
  await Haptics.impact({ style: ImpactStyle.Light })
}
```

**SplashScreen:**
```ts
import { SplashScreen } from '@capacitor/splash-screen'
// Dopo il mount e caricamento dati iniziale:
if (Capacitor.isNativePlatform()) {
  await SplashScreen.hide()
}
```

**Share:**
Aggiunto pulsante "Esporta / Condividi" in `ImpostazioniScreen` (mobile) e `DesktopImpostazioniScreen`:
```ts
import { Share } from '@capacitor/share'
await Share.share({
  title: 'Spesa backup',
  url: dataUrl,         // data URI del JSON export
  dialogTitle: 'Esporta dati',
})
```
Con fallback a download file quando `!Capacitor.isNativePlatform()`.

---

## B4 — Build pipeline

**Script aggiunto a `package.json`:**
```json
{
  "scripts": {
    "ios:build": "npm run build && npx cap sync ios && npx cap open ios"
  }
}
```

Flusso build iOS:
1. `npm run build` → genera `dist/`
2. `npx cap sync` → copia assets nel progetto Xcode + aggiorna plugin nativi
3. `npx cap open ios` → apre Xcode per archivio/distribuzione

---

## Verifica

1. `npm run build && npx cap sync` — nessun errore
2. `npx cap open ios` → build su simulatore
3. iPhone simulator (375px) → layout mobile; iPad simulator (1024px) → layout desktop
4. Status bar scura al launch
5. Haptic feedback su conferma acquisto (simulatore: log in console; device fisico: vibrazione)
6. Splash screen visibile per ~1.5s poi si nasconde
7. Share sheet si apre dalle impostazioni
