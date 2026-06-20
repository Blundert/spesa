const INTRO_KEY = 'tutorial-intro-done'
const TOUR_KEY = 'tutorial-tour-done'
const RESET_EVENT = 'tutorial-reset'

export function getTutorialIntroDone(): boolean {
  return localStorage.getItem(INTRO_KEY) === '1'
}

export function getTutorialTourDone(): boolean {
  return localStorage.getItem(TOUR_KEY) === '1'
}

export function markIntroDone(): void {
  localStorage.setItem(INTRO_KEY, '1')
}

export function markTourDone(): void {
  localStorage.setItem(TOUR_KEY, '1')
}

export function resetTutorial(): void {
  localStorage.removeItem(INTRO_KEY)
  localStorage.removeItem(TOUR_KEY)
  window.dispatchEvent(new Event(RESET_EVENT))
}

export function onTutorialReset(cb: () => void): () => void {
  window.addEventListener(RESET_EVENT, cb)
  return () => window.removeEventListener(RESET_EVENT, cb)
}
