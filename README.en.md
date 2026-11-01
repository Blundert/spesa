<div align="center">
  <img src="public/favicon.svg" width="72" alt="Spesa">
  <h1>Spesa</h1>
  <p>
    Manage your weekly grocery shopping with meal vouchers — local-first, no account needed.
  </p>

  ![Version](https://img.shields.io/badge/version-0.41.1-2A2A2C?style=flat-square)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

  **[→ Open the app](https://spesa.matteogranzotto.com)**

  [🇮🇹 Italiano](README.md) · 🇬🇧 English
</div>

---

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="docs/screenshots/lista.png" width="180" alt="List"></td>
      <td align="center"><img src="docs/screenshots/pasti.png" width="180" alt="Meals"></td>
      <td align="center"><img src="docs/screenshots/riepilogo.png" width="180" alt="Week summary"></td>
      <td align="center"><img src="docs/screenshots/statistiche.png" width="180" alt="Statistics"></td>
    </tr>
    <tr>
      <td align="center"><sub>List</sub></td>
      <td align="center"><sub>Meals</sub></td>
      <td align="center"><sub>Week summary</sub></td>
      <td align="center"><sub>Statistics</sub></td>
    </tr>
  </table>
</div>

<div align="center">
  <table>
    <tr>
      <td align="center"><img src="docs/screenshots/desktop-dashboard.png" width="420" alt="Desktop dashboard"></td>
      <td align="center"><img src="docs/screenshots/desktop-statistiche.png" width="420" alt="Desktop statistics"></td>
    </tr>
    <tr>
      <td align="center"><sub>Desktop · Dashboard</sub></td>
      <td align="center"><sub>Desktop · Advanced statistics</sub></td>
    </tr>
  </table>
</div>

---

## About

Spesa is a personal project I built for myself and later open-sourced.
It manages weekly grocery shopping with meal vouchers: tracks spending, voucher usage,
and how much comes out of pocket. Everything is stored locally on your device — no account,
no server. It installs as a native app on iOS, Android, and desktop.

## Features

- 🛒 Multiple themed shopping lists, each with its own supermarket, with quantity stepper and autocomplete
- 💶 Weekly meal voucher budget
- 📊 Statistics: weekly trend, top items, category breakdown
- 📈 Price change indicator vs last purchase
- 🧮 Price keypad with a calculator mode (+ − × ÷, brackets, %)
- ✨ Load your usual shopping in one tap
- 🗓️ Weekly meal planner
- 🏪 Supermarkets with loyalty card
- 🔄 Optional backup to GitHub (JSON in a private repo)
- 🖥️ Dedicated desktop interface (from 768 px): collapsible side menu, sortable tables, colour charts; switching to/from mobile is instant
- 📱 Installable PWA — iOS · Android · Desktop
- 🌍 Italian · English

## Stack

Vite · React · TypeScript · TanStack Router · TanStack Query · Dexie (IndexedDB) · Tailwind CSS · Vaul · Sonner

## Getting Started

```bash
git clone https://github.com/Blundert/spesa.git
cd spesa
npm install
npm run dev
```

Single-user app: data lives in the browser's IndexedDB, no environment variables needed.

## License

MIT — see [LICENSE](LICENSE).
