<div align="center">
  <img src="public/favicon.svg" width="72" alt="Spesa">
  <h1>Spesa</h1>
  <p>
    Gestisci la spesa settimanale con i buoni pasto — tutto in locale, senza account.
  </p>

  ![Version](https://img.shields.io/badge/version-0.28.2-2A2A2C?style=flat-square)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

  **[→ Apri l'app](https://spesa.matteogranzotto.com)**

  🇮🇹 Italiano · [🇬🇧 English](README.en.md)
</div>

---

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="docs/screenshots/home.png" width="180" alt="Home"></td>
      <td align="center"><img src="docs/screenshots/lista.png" width="180" alt="Lista"></td>
      <td align="center"><img src="docs/screenshots/statistiche.png" width="180" alt="Statistiche"></td>
      <td align="center"><img src="docs/screenshots/nuova-spesa.png" width="180" alt="Nuova spesa"></td>
    </tr>
    <tr>
      <td align="center"><sub>Home</sub></td>
      <td align="center"><sub>Lista</sub></td>
      <td align="center"><sub>Statistiche</sub></td>
      <td align="center"><sub>Nuova spesa</sub></td>
    </tr>
  </table>
</div>

---

## Il Progetto

Spesa è un progetto personale che ho costruito per me stesso e poi reso open source.
Gestisce la spesa settimanale tenendo conto dei buoni pasto: tiene traccia di quanto spendo,
quanti buoni uso e quanto pago di tasca mia. Tutto viene salvato in locale sul telefono,
senza account né server. È installabile come app nativa su iOS, Android e desktop.

## Funzionalità

- 🛒 Lista della spesa con stepper quantità e autocompletamento
- 💶 Budget buoni pasto settimanale
- 📊 Statistiche: andamento settimanale, top articoli, ripartizione per categoria
- 📈 Indicatore variazione prezzo rispetto all'ultima volta
- ✨ Carica la tua "spesa solita" in un tap
- 🗓️ Pianificatore pasti settimanale
- 🏪 Supermercati con tessera fedeltà
- 🔄 Backup opzionale su GitHub (JSON in repo privata)
- 📱 PWA installabile — iOS · Android · Desktop
- 🌍 Italiano · English

## Stack

Vite · React · TypeScript · TanStack Router · TanStack Query · Dexie (IndexedDB) · Tailwind CSS · Vaul · Sonner

## Getting Started

```bash
git clone https://github.com/Blundert/spesa.git
cd spesa
npm install
npm run dev
```

App single-user: i dati vivono nell'IndexedDB del browser, nessuna variabile d'ambiente richiesta.

## License

MIT — vedi [LICENSE](LICENSE).
