import { Link } from '@tanstack/react-router'

export function SpesaScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-light tracking-tight text-[#2A2A2C]">Modalità spesa</h1>
      <p className="text-sm text-[#9B9B9F]">Placeholder — Task 13</p>
      <Link
        to="/"
        className="text-[#2A2A2C] underline text-sm"
      >
        ← Torna alla settimana
      </Link>
    </div>
  )
}
