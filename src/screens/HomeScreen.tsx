import { Link } from '@tanstack/react-router'

export function HomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <h1 className="text-2xl font-light tracking-tight text-[#2A2A2C]">La mia settimana</h1>
      <Link
        to="/spesa"
        className="bg-[#2A2A2C] text-white px-6 py-3 rounded-2xl text-base active:scale-95 transition-transform"
      >
        Inizia la spesa →
      </Link>
    </div>
  )
}
