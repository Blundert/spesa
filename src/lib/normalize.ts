/** Normalizza un nome per il confronto: lowercase, trim, collassa spazi multipli. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
