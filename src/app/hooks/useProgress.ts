import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  applyResult,
  loadProgress,
  resetProgress,
  saveProgress,
} from '../../shared/progress'
import type { GameResult, GameSettings, Progress } from '../../shared/types'

export interface ProgressApi {
  progress: Progress
  /** false si localStorage está bloqueado: la UI lo avisa una vez. */
  storageOk: boolean
  record: (result: GameResult) => void
  updateSettings: (patch: Partial<GameSettings>) => void
  reset: () => void
}

export function useProgress(): ProgressApi {
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [storageOk, setStorageOk] = useState(true)

  // Persistir cada cambio. Un fallo no interrumpe la partida: solo se marca.
  useEffect(() => {
    const ok = saveProgress(progress)
    setStorageOk((prev) => (prev === ok ? prev : ok))
  }, [progress])

  // Aplicar movimiento reducido al documento.
  useEffect(() => {
    document.documentElement.dataset.motion = progress.settings.reducedMotion
      ? 'reduced'
      : 'full'
  }, [progress.settings.reducedMotion])

  // Idioma del documento, para lectores de pantalla.
  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  const record = useCallback((result: GameResult) => {
    setProgress((prev) => applyResult(prev, result))
  }, [])

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const reset = useCallback(() => {
    setProgress(resetProgress())
  }, [])

  return useMemo(
    () => ({ progress, storageOk, record, updateSettings, reset }),
    [progress, storageOk, record, updateSettings, reset],
  )
}
