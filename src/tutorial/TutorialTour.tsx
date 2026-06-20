import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { router } from '../router'
import { markTourDone } from './tutorialStore'

interface TourStep {
  dataAttr: string
  route: string | null
  tooltipPosition: 'above' | 'below'
  titleKey: string
  descKey: string
}

const STEPS: TourStep[] = [
  {
    dataAttr: 'week-card',
    route: null,
    tooltipPosition: 'below',
    titleKey: 'tutorial.tour.step1.title',
    descKey: 'tutorial.tour.step1.description',
  },
  {
    dataAttr: 'session-pill',
    route: null,
    tooltipPosition: 'above',
    titleKey: 'tutorial.tour.step2.title',
    descKey: 'tutorial.tour.step2.description',
  },
  {
    dataAttr: 'menu-button',
    route: null,
    tooltipPosition: 'above',
    titleKey: 'tutorial.tour.step3.title',
    descKey: 'tutorial.tour.step3.description',
  },
  {
    dataAttr: 'lista-screen',
    route: '/lista',
    tooltipPosition: 'below',
    titleKey: 'tutorial.tour.step4.title',
    descKey: 'tutorial.tour.step4.description',
  },
]

const PAD = 14
const R = 18

interface TutorialTourProps {
  onComplete: () => void
}

export function TutorialTour({ onComplete }: TutorialTourProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)
  const [vpW, setVpW] = useState(window.innerWidth)
  const [vpH, setVpH] = useState(window.innerHeight)
  const measuringRef = useRef(false)

  useEffect(() => {
    const onResize = () => {
      setVpW(window.innerWidth)
      setVpH(window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const measureStep = useCallback(async (stepIndex: number) => {
    if (measuringRef.current) return
    measuringRef.current = true
    setVisible(false)

    const s = STEPS[stepIndex]

    if (s.route !== null) {
      await router.navigate({ to: s.route })
      // Wait two frames for the new screen to paint
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      )
    }

    const el = document.querySelector<HTMLElement>(`[data-tour="${s.dataAttr}"]`)
    if (!el) {
      measuringRef.current = false
      // Skip step gracefully
      if (stepIndex < STEPS.length - 1) {
        setStep(stepIndex + 1)
      } else {
        handleComplete()
      }
      return
    }

    setRect(el.getBoundingClientRect())
    setVisible(true)
    measuringRef.current = false
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void measureStep(step)
  }, [step, measureStep])

  const handleComplete = useCallback(() => {
    markTourDone()
    onComplete()
  }, [onComplete])

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      handleComplete()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handlePrev = async () => {
    const prevStep = step - 1
    // If going back from lista to home, navigate back first
    const current = STEPS[step]
    const prev = STEPS[prevStep]
    if (current.route !== null && prev.route === null) {
      await router.navigate({ to: '/' })
    }
    setStep(prevStep)
  }

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
  const tooltipStyle: React.CSSProperties = (() => {
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

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
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

      {/* Tooltip card */}
      <div
        style={{
          position: 'fixed',
          zIndex: 151,
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
                onClick={() => void handlePrev()}
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
    </>
  )
}
