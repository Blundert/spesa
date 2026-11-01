import { useState, useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { router } from '../router'
import { markTourDone, setTourPillSheet } from './tutorialStore'

interface TourStep {
  dataAttr: string
  tooltipPosition: 'above' | 'below'
  titleKey: string
  descKey: string
  // Il passo si svolge con il pannello della pill aperto.
  pillSheet?: boolean
}

// Tutti i passi sono sulla Lista, la home: titoli, schede delle liste, pill, pannello aperto, menu.
const STEPS: TourStep[] = [
  {
    dataAttr: 'section-title',
    tooltipPosition: 'below',
    titleKey: 'tutorial.tour.step1.title',
    descKey: 'tutorial.tour.step1.description',
  },
  {
    dataAttr: 'list-tabs',
    tooltipPosition: 'below',
    titleKey: 'tutorial.tour.lists.title',
    descKey: 'tutorial.tour.lists.description',
  },
  {
    dataAttr: 'session-pill',
    tooltipPosition: 'above',
    titleKey: 'tutorial.tour.step2.title',
    descKey: 'tutorial.tour.step2.description',
  },
  {
    dataAttr: 'new-shopping',
    tooltipPosition: 'above',
    titleKey: 'tutorial.tour.step3.title',
    descKey: 'tutorial.tour.step3.description',
    pillSheet: true,
  },
  {
    dataAttr: 'menu-button',
    tooltipPosition: 'above',
    titleKey: 'tutorial.tour.step4.title',
    descKey: 'tutorial.tour.step4.description',
  },
]

const PAD = 14
const R = 18
// Attesa prima di misurare: apertura/chiusura del pannello (Vaul) o transizione di pagina.
const SETTLE_MS = 550

const nextFrames = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

interface TutorialTourProps {
  onComplete: () => void
}

export function TutorialTour({ onComplete }: TutorialTourProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  // Rettangolo misurato per un passo; il tooltip è visibile solo quando corrisponde al passo corrente.
  const [measured, setMeasured] = useState<{ step: number; rect: DOMRect | null } | null>(null)
  const [vpW, setVpW] = useState(window.innerWidth)
  const [vpH, setVpH] = useState(window.innerHeight)
  const prevStepRef = useRef<number | null>(null)

  useEffect(() => {
    const onResize = () => {
      setVpW(window.innerWidth)
      setVpH(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let cancelled = false
    const s = STEPS[step]
    const prev = prevStepRef.current
    prevStepRef.current = step
    const sheetChanges = s.pillSheet === true || (prev !== null && STEPS[prev].pillSheet === true)

    void (async () => {
      // Il tour parte sempre dalla Lista; se serve tornarci si aspetta la fine della transizione.
      const mustNavigate = prev === null && router.state.location.pathname !== '/'
      if (mustNavigate) await router.navigate({ to: '/' })
      setTourPillSheet(s.pillSheet === true)
      if (sheetChanges || mustNavigate) await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
      await nextFrames()
      if (cancelled) return
      // Se l'elemento manca il tooltip compare al centro, senza riquadro evidenziato.
      const el = document.querySelector<HTMLElement>(`[data-tour="${s.dataAttr}"]`)
      setMeasured({ step, rect: el ? el.getBoundingClientRect() : null })
    })()

    return () => {
      cancelled = true
    }
  }, [step])

  const handleComplete = () => {
    setTourPillSheet(false)
    markTourDone()
    onComplete()
  }

  const handleNext = () => {
    if (step === STEPS.length - 1) handleComplete()
    else setStep(step + 1)
  }

  const visible = measured?.step === step
  const rect = measured?.rect ?? null
  const isLast = step === STEPS.length - 1
  const currentStep = STEPS[step]

  // SVG spotlight path
  const spotPath =
    rect != null
      ? [
          `M 0 0 H ${vpW} V ${vpH} H 0 Z`,
          `M ${rect.left - PAD + R} ${rect.top - PAD}`,
          `h ${rect.width + 2 * PAD - 2 * R}`,
          `a ${R} ${R} 0 0 1 ${R} ${R}`,
          `v ${rect.height + 2 * PAD - 2 * R}`,
          `a ${R} ${R} 0 0 1 -${R} ${R}`,
          `h -${rect.width + 2 * PAD - 2 * R}`,
          `a ${R} ${R} 0 0 1 -${R} -${R}`,
          `v -${rect.height + 2 * PAD - 2 * R}`,
          `a ${R} ${R} 0 0 1 ${R} -${R} Z`,
        ].join(' ')
      : `M 0 0 H ${vpW} V ${vpH} H 0 Z`

  // Tooltip positioning
  const tooltipStyle: CSSProperties = (() => {
    if (!rect) return { top: '50%', left: 16, right: 16 }
    if (currentStep.tooltipPosition === 'above') {
      return {
        bottom: vpH - rect.top + PAD + 12,
        left: 16,
        right: 16,
      }
    }
    return {
      top: rect.bottom + PAD + 12,
      left: 16,
      right: 16,
    }
  })()

  // Portale sul body: dentro la shell (position: fixed) resterebbe sotto ai pannelli Vaul.
  return createPortal(
    <>
      {/* Dark overlay with spotlight cutout: sta sopra anche al pannello e ne blocca i tocchi */}
      <svg
        width={vpW}
        height={vpH}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 150,
          pointerEvents: 'all',
          opacity: visible ? 1 : 0,
          transition: 'opacity 250ms ease',
        }}
      >
        <path
          d={spotPath}
          fill="rgba(0,0,0,0.68)"
          fillRule="evenodd"
          style={{ pointerEvents: 'none' }}
        />
      </svg>

      {/* Tooltip card (pointer-events espliciti: col pannello aperto il body li disattiva) */}
      <div
        style={{
          position: 'fixed',
          zIndex: 151,
          pointerEvents: 'auto',
          opacity: visible ? 1 : 0,
          transition: 'opacity 250ms ease',
          ...tooltipStyle,
        }}
      >
        <div className="bg-white rounded-[22px] p-5 shadow-lg">
          {/* Step counter */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] text-[#9B9B9F] uppercase tracking-[1px]">
              {step + 1} / {STEPS.length}
            </span>
            <button
              onClick={handleComplete}
              className="text-[13px] text-[#9B9B9F] active:opacity-60 transition-opacity"
            >
              {t('tutorial.skip')}
            </button>
          </div>

          <h3 className="text-[17px] font-normal text-[#2A2A2C] mb-2">
            {t(currentStep.titleKey)}
          </h3>
          <p className="text-[14px] text-[#9B9B9F] leading-relaxed mb-5">
            {t(currentStep.descKey)}
          </p>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-none px-4 py-3 rounded-[14px] bg-[#F2F2F0] text-[#2A2A2C] text-[14px] active:scale-[.97] transition-transform"
              >
                {t('tutorial.prev')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-[14px] bg-[#2A2A2C] text-white text-[14px] active:scale-[.97] transition-transform"
            >
              {isLast ? t('tutorial.done') : t('tutorial.next')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
