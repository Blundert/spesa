import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { markIntroDone } from './tutorialStore'

interface SlideData {
  img: string
  titleKey: string
  descKey: string
}

const SLIDES: SlideData[] = [
  { img: '/tutorial/slide1.png', titleKey: 'tutorial.slide1.title', descKey: 'tutorial.slide1.description' },
  { img: '/tutorial/slide2.png', titleKey: 'tutorial.slide2.title', descKey: 'tutorial.slide2.description' },
  { img: '/tutorial/slide3.png', titleKey: 'tutorial.slide3.title', descKey: 'tutorial.slide3.description' },
  { img: '/tutorial/slide4.png', titleKey: 'tutorial.slide4.title', descKey: 'tutorial.slide4.description' },
]

interface TutorialIntroProps {
  onComplete: () => void
}

export function TutorialIntro({ onComplete }: TutorialIntroProps) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const isLast = current === SLIDES.length - 1

  const handleComplete = () => {
    markIntroDone()
    onComplete()
  }

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setCurrent((c) => c + 1)
    }
  }

  const slide = SLIDES[current]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#F2F2F0' }}
      className="flex flex-col"
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-[max(20px,env(safe-area-inset-top))]">
        <button
          onClick={handleComplete}
          className="text-[14px] text-[#9B9B9F] active:opacity-60 transition-opacity px-2 py-1"
        >
          {t('tutorial.skip')}
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div key={current} className="tutorial-slide-in flex flex-col items-center text-center">
          <img
            src={slide.img}
            alt=""
            className="w-[240px] h-[180px] object-contain mb-10"
          />
          <h2 className="text-[24px] font-normal text-[#2A2A2C] leading-tight mb-4">
            {t(slide.titleKey)}
          </h2>
          <p className="text-[15px] text-[#9B9B9F] leading-relaxed max-w-[280px]">
            {t(slide.descKey)}
          </p>
        </div>
      </div>

      {/* Bottom: dots + buttons */}
      <div
        className="flex flex-col items-center gap-6 px-6 pb-[max(40px,env(safe-area-inset-bottom))]"
        style={{ paddingBottom: 'calc(max(40px, env(safe-area-inset-bottom)) + 8px)' }}
      >
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? '#2A2A2C' : '#D8D8D6',
              }}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className="w-full bg-[#2A2A2C] text-white rounded-[18px] py-4 text-[16px] font-normal active:scale-[.98] transition-transform"
        >
          {isLast ? t('tutorial.start') : t('tutorial.next')}
        </button>
      </div>
    </div>
  )
}
