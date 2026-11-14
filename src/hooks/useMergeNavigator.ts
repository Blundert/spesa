import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MERGE_PATH, setMergeNavigator } from '../lib/mergeNav'

/** Registra nella shell attiva come aprire la schermata di unione (il toast del conflitto è fuori da React). */
export function useMergeNavigator() {
  const navigate = useNavigate()
  useEffect(() => {
    setMergeNavigator(() => void navigate({ to: MERGE_PATH }))
    return () => setMergeNavigator(null)
  }, [navigate])
}
