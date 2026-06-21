import { useState, useEffect } from 'react'
import { getTutorialIntroDone, getTutorialTourDone, onTutorialReset } from './tutorialStore'
import { TutorialIntro } from './TutorialIntro'
import { TutorialTour } from './TutorialTour'
import { router } from '../router'

type Phase = 'idle' | 'intro' | 'tour'

function getInitialPhase(): Phase {
  if (!getTutorialIntroDone()) return 'intro'
  if (!getTutorialTourDone()) return 'tour'
  return 'idle'
}

export function TutorialController() {
  const [phase, setPhase] = useState<Phase>(getInitialPhase)

  useEffect(() => onTutorialReset(() => setPhase('intro')), [])

  if (phase === 'idle') return null

  return (
    <>
      {phase === 'intro' && <TutorialIntro onComplete={() => setPhase('tour')} />}
      {phase === 'tour' && (
        <TutorialTour
          onComplete={() => {
            void router.navigate({ to: '/' })
            setPhase('idle')
          }}
        />
      )}
    </>
  )
}
