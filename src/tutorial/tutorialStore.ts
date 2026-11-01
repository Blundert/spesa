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

// Il tour apre e chiude da solo il pannello della pill per mostrare come iniziare la spesa.
const PILL_SHEET_EVENT = 'tutorial-pill-sheet'

export function setTourPillSheet(open: boolean): void {
  window.dispatchEvent(new CustomEvent<boolean>(PILL_SHEET_EVENT, { detail: open }))
}

export function onTourPillSheet(cb: (open: boolean) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail)
  window.addEventListener(PILL_SHEET_EVENT, handler)
  return () => window.removeEventListener(PILL_SHEET_EVENT, handler)
}
