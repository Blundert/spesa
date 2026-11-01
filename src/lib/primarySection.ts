// Ricorda l'ultima sezione principale visitata (Lista o Pasti, con la sua settimana),
// così la freccia delle pagine del menu riporta sempre lì.
const PRIMARY_PATHS = new Set(['/', '/pasti'])

let lastPrimaryHref = '/'

export function isPrimaryPath(pathname: string): boolean {
  return PRIMARY_PATHS.has(pathname)
}

export function rememberPrimary(pathname: string, href: string): void {
  if (isPrimaryPath(pathname)) lastPrimaryHref = href
}

export function getLastPrimaryHref(): string {
  return lastPrimaryHref
}
