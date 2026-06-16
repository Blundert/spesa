import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { dayShort, formatWeekLabel, shiftISOWeek } from '../lib/date'
import { useMealPlan, useUpdateMealSlot } from '../hooks/useMealPlan'

export function PastiScreen() {
  const navigate = useNavigate()
  const { week } = useSearch({ from: '/pasti' })
  const { data: days = [] } = useMealPlan(week)
  const updateSlot = useUpdateMealSlot(week)

  const goToWeek = (delta: number) =>
    void navigate({ to: '/pasti', search: { week: shiftISOWeek(week, delta) } })

  const handleGenerate = () => {
    void navigate({ to: '/lista' })
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F0]">
      <div className="h-[54px] flex-none" />
      <div className="flex-1 overflow-y-auto px-5 pb-[120px]">
        {/* Header */}
        <div className="flex items-center gap-2 pt-1 pb-[18px]">
          <button
            onClick={() => void navigate({ to: '/' })}
            className="w-[34px] h-[34px] -ml-1.5 flex items-center justify-center active:opacity-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="flex-1 text-[26px] font-normal tracking-[-0.5px] text-[#2A2A2C]">Pianifica i pasti</span>
          <Link to="/pasti/storico" className="text-[15px] text-[#9B9B9F] px-1 active:opacity-50">
            Storico
          </Link>
        </div>

        {/* Selettore settimana */}
        <div className="flex items-center justify-between bg-white rounded-[18px] px-2 py-2 mb-[14px]">
          <button
            onClick={() => goToWeek(-1)}
            aria-label="Settimana precedente"
            className="w-9 h-9 flex items-center justify-center active:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="text-[15px] text-[#2A2A2C] tabular-nums">{formatWeekLabel(week)}</span>
          <button
            onClick={() => goToWeek(1)}
            aria-label="Settimana successiva"
            className="w-9 h-9 flex items-center justify-center active:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2A2A2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-[#9B9B9F] leading-relaxed mx-1 mb-[18px]">
          Scrivi cosa cucini a pranzo e cena. Da qui costruisci la lista della spesa.
        </p>

        <div className="bg-white rounded-[22px] overflow-hidden">
          {days.map((day, i) => (
            <div
              key={day.dayIndex}
              className="border-b border-[#ECECEC] last:border-0"
            >
              {/* Day label row */}
              <div className="flex items-center px-[18px] pt-3 pb-0">
                <span className="w-[42px] flex-none text-[13px] font-normal text-[#2A2A2C] tracking-[.2px]">
                  {dayShort(day.dayIndex).toUpperCase()}
                </span>
              </div>
              {/* Pranzo */}
              <MealInput
                label="Pranzo"
                value={day.pranzo}
                onChange={(v) => updateSlot.mutate({ dayIndex: day.dayIndex, mealType: 0, dish: v })}
                borderBottom
              />
              {/* Cena */}
              <MealInput
                label="Cena"
                value={day.cena}
                onChange={(v) => updateSlot.mutate({ dayIndex: day.dayIndex, mealType: 1, dish: v })}
                borderBottom={i < days.length - 1}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          className="w-full mt-4 bg-[#2A2A2C] text-white text-[17px] font-normal py-[18px] rounded-[22px] active:scale-[.98] transition-transform"
        >
          Vai alla lista della spesa
        </button>
      </div>
    </div>
  )
}

function MealInput({
  label,
  value,
  onChange,
  borderBottom,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  borderBottom?: boolean
}) {
  return (
    <div
      className="flex items-center gap-3 px-[18px]"
      style={{ borderBottom: borderBottom ? '1px solid #ECECEC' : 'none' }}
    >
      <span className="w-[42px] flex-none text-[12px] text-[#9B9B9F]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onChange(e.target.value)}
        placeholder="—"
        className="flex-1 border-none outline-none bg-transparent py-4 text-base text-[#2A2A2C] placeholder:text-[#D0D0D4]"
      />
    </div>
  )
}
