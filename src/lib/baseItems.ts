/**
 * Elenco base di articoli per l'autocomplete della lista della spesa.
 * La `category` deve combaciare con i nomi delle categorie seed (vedi db.ts):
 * "Frutta e verdura", "Frigo", "Dispensa", "Panetteria", "Bevande", "Altro".
 * Gli articoli già usati (db.items) si aggiungono a questi a runtime.
 */
export interface BaseItem {
  name: string
  category: string
}

export const BASE_ITEMS: BaseItem[] = [
  // Frutta e verdura
  { name: 'Mele', category: 'Frutta e verdura' },
  { name: 'Banane', category: 'Frutta e verdura' },
  { name: 'Arance', category: 'Frutta e verdura' },
  { name: 'Limoni', category: 'Frutta e verdura' },
  { name: 'Pomodori', category: 'Frutta e verdura' },
  { name: 'Insalata', category: 'Frutta e verdura' },
  { name: 'Patate', category: 'Frutta e verdura' },
  { name: 'Cipolle', category: 'Frutta e verdura' },
  { name: 'Aglio', category: 'Frutta e verdura' },
  { name: 'Carote', category: 'Frutta e verdura' },
  { name: 'Zucchine', category: 'Frutta e verdura' },
  { name: 'Spinaci', category: 'Frutta e verdura' },
  { name: 'Peperoni', category: 'Frutta e verdura' },
  { name: 'Funghi', category: 'Frutta e verdura' },
  { name: 'Basilico', category: 'Frutta e verdura' },

  // Frigo
  { name: 'Latte', category: 'Frigo' },
  { name: 'Uova', category: 'Frigo' },
  { name: 'Burro', category: 'Frigo' },
  { name: 'Yogurt', category: 'Frigo' },
  { name: 'Mozzarella', category: 'Frigo' },
  { name: 'Parmigiano', category: 'Frigo' },
  { name: 'Formaggio', category: 'Frigo' },
  { name: 'Ricotta', category: 'Frigo' },
  { name: 'Prosciutto cotto', category: 'Frigo' },
  { name: 'Prosciutto crudo', category: 'Frigo' },
  { name: 'Würstel', category: 'Frigo' },
  { name: 'Panna', category: 'Frigo' },

  // Dispensa
  { name: 'Pasta', category: 'Dispensa' },
  { name: 'Riso', category: 'Dispensa' },
  { name: 'Passata di pomodoro', category: 'Dispensa' },
  { name: 'Pelati', category: 'Dispensa' },
  { name: 'Tonno in scatola', category: 'Dispensa' },
  { name: 'Fagioli', category: 'Dispensa' },
  { name: 'Ceci', category: 'Dispensa' },
  { name: "Olio d'oliva", category: 'Dispensa' },
  { name: 'Aceto', category: 'Dispensa' },
  { name: 'Sale', category: 'Dispensa' },
  { name: 'Pepe', category: 'Dispensa' },
  { name: 'Zucchero', category: 'Dispensa' },
  { name: 'Farina', category: 'Dispensa' },
  { name: 'Caffè', category: 'Dispensa' },
  { name: 'Tè', category: 'Dispensa' },
  { name: 'Biscotti', category: 'Dispensa' },
  { name: 'Cereali', category: 'Dispensa' },
  { name: 'Marmellata', category: 'Dispensa' },
  { name: 'Miele', category: 'Dispensa' },
  { name: 'Patatine', category: 'Dispensa' },

  // Panetteria
  { name: 'Pane', category: 'Panetteria' },
  { name: 'Pane in cassetta', category: 'Panetteria' },
  { name: 'Grissini', category: 'Panetteria' },
  { name: 'Cracker', category: 'Panetteria' },
  { name: 'Cornetti', category: 'Panetteria' },
  { name: 'Pizza', category: 'Panetteria' },

  // Bevande
  { name: 'Acqua', category: 'Bevande' },
  { name: 'Vino', category: 'Bevande' },
  { name: 'Birra', category: 'Bevande' },
  { name: 'Succo di frutta', category: 'Bevande' },
  { name: 'Coca cola', category: 'Bevande' },
  { name: 'Aranciata', category: 'Bevande' },

  // Altro
  { name: 'Detersivo piatti', category: 'Altro' },
  { name: 'Detersivo lavatrice', category: 'Altro' },
  { name: 'Ammorbidente', category: 'Altro' },
  { name: 'Carta igienica', category: 'Altro' },
  { name: 'Carta da cucina', category: 'Altro' },
  { name: 'Fazzoletti', category: 'Altro' },
  { name: 'Sacchetti spazzatura', category: 'Altro' },
  { name: 'Sapone', category: 'Altro' },
  { name: 'Shampoo', category: 'Altro' },
  { name: 'Bagnoschiuma', category: 'Altro' },
  { name: 'Dentifricio', category: 'Altro' },
  { name: 'Spazzolino', category: 'Altro' },
]
