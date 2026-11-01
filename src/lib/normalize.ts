/** Normalizza un nome per il confronto: lowercase, trim, collassa spazi multipli. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Ordine alfabetico per i nomi mostrati (categorie, voci): italiano, senza badare a maiuscole e accenti. */
export function compareNames(a: string, b: string): number {
  return a.localeCompare(b, 'it', { sensitivity: 'base' })
}
