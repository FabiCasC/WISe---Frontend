import { useCallback, useEffect, useState } from 'react'
import type { ArchiveItem } from '../content/archive'
import { getMission, type MissionCard } from '../content/missions'
import type { GameId, GameResult, LevelId } from '../shared/types'
import ArchiveCard from './components/ArchiveCard'
import Dossier from './components/Dossier'
import SettingsPanel from './components/SettingsPanel'
import Sky from './components/Sky'
import Topbar from './components/Topbar'
import GameHost from './GameHost'
import { navigate, useHashRoute, useScrollReset } from './hooks/useHashRoute'
import { useProgress } from './hooks/useProgress'
import Arcade from './pages/Arcade'
import Landing from './pages/Landing'

export default function App() {
  const route = useHashRoute()
  const { progress, storageOk, record, updateSettings, reset } = useProgress()

  const [dossierId, setDossierId] = useState<GameId | null>(null)
  const [archiveItem, setArchiveItem] = useState<ArchiveItem | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  /**
   * Mientras se juega, la página de fondo sigue siendo la que estaba. Así,
   * al salir de la partida se vuelve justo donde se estaba.
   */
  const [lastPage, setLastPage] = useState<'landing' | 'arcade'>('landing')
  useEffect(() => {
    if (route.name === 'landing' || route.name === 'arcade') setLastPage(route.name)
  }, [route])

  // Cambiar de página vuelve arriba; moverse por anclas no.
  useScrollReset(lastPage)

  // Aviso único si el navegador bloquea el guardado.
  useEffect(() => {
    if (!storageOk) {
      setToast(
        'Este navegador bloquea el guardado local: podrás jugar, pero el progreso no se conservará.',
      )
    }
  }, [storageOk])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(t)
  }, [toast])

  /** Siguiente nivel sugerido: el primero sin completar. */
  const nextLevelOf = useCallback(
    (gameId: GameId): LevelId => {
      const done = progress.games[gameId].levelsCompleted
      return (([1, 2, 3] as LevelId[]).find((l) => !done.includes(l)) ?? 1) as LevelId
    },
    [progress],
  )

  const play = useCallback(
    (mission: MissionCard) => {
      setDossierId(null)
      setArchiveItem(null)
      navigate(`#/jugar/${mission.gameId}/${nextLevelOf(mission.gameId)}`)
    },
    [nextLevelOf],
  )

  const exitGame = useCallback(() => {
    navigate(lastPage === 'arcade' ? '#/arcade' : '#/')
  }, [lastPage])

  const handleResult = useCallback(
    (result: GameResult) => {
      record(result)
      const mission = getMission(result.gameId)
      setToast(
        result.completed
          ? `Recuerdo sellado: ${mission?.title ?? result.gameId}. Ábrelo en el pasaporte.`
          : 'Partida cerrada sin completar. Puedes reintentar cuando quieras.',
      )
      exitGame()
    },
    [record, exitGame],
  )

  const dossierMission = dossierId ? getMission(dossierId) : undefined

  return (
    <>
      <Sky reducedMotion={progress.settings.reducedMotion} />

      <a className="skip-link" href="#juegos">
        Saltar al listado de juegos
      </a>

      <div className="shell">
        <Topbar page={lastPage} progress={progress} onSettings={() => setSettingsOpen(true)} />

        {lastPage === 'arcade' ? (
          <Arcade progress={progress} onPlay={play} onItem={setArchiveItem} />
        ) : (
          <Landing progress={progress} onPlay={play} onDossier={setDossierId} />
        )}
      </div>

      {/* --------------------------------------------------------- SUPERPUESTO */}
      {route.name === 'play' && (
        <GameHost
          gameId={route.gameId}
          levelId={route.levelId}
          settings={progress.settings}
          onResult={handleResult}
          onExit={exitGame}
        />
      )}

      {dossierMission && (
        <Dossier
          mission={dossierMission}
          onClose={() => setDossierId(null)}
          onPlay={() => play(dossierMission)}
        />
      )}

      {archiveItem && (
        <ArchiveCard
          item={archiveItem}
          onClose={() => setArchiveItem(null)}
          onPlay={play}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          settings={progress.settings}
          storageOk={storageOk}
          onChange={updateSettings}
          onReset={() => {
            reset()
            setToast('Progreso reiniciado.')
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            type="button"
            className="btn btn--sm btn--quiet"
            onClick={() => setToast(null)}
            aria-label="Cerrar aviso"
          >
            Cerrar
          </button>
        </div>
      )}
    </>
  )
}
