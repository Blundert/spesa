/**
 * Content-Security-Policy dell'app in produzione (iniettata come <meta> in index.html dal build,
 * perché GitHub Pages non permette header). Vale solo per le direttive supportate dal meta:
 * `frame-ancestors` e `report-uri` verrebbero ignorate, quindi non ci sono.
 *
 * L'app parla in rete solo con l'API di GitHub (sync): un XSS o una dipendenza compromessa
 * non può mandare il token a un altro server né caricare script di terzi.
 */
export const GITHUB_API_ORIGIN = 'https://api.github.com'

/**
 * @param inlineScriptHashes hash `sha256-…` degli script inline ammessi (es. quello del tema
 *   in index.html), uno per script: niente `'unsafe-inline'` per gli script.
 */
export function buildCsp(inlineScriptHashes: string[]): string {
  const scriptSrc = ["'self'", ...inlineScriptHashes.map((h) => `'${h}'`)]
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    // Gli attributi style inline (React, Vaul, Sonner, Recharts) richiedono 'unsafe-inline' per gli stili.
    'style-src': ["'self'", "'unsafe-inline'"],
    // data: e blob: per le immagini (tessere fedeltà in base64, anteprime).
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", GITHUB_API_ORIGIN],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  }
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ')
}
