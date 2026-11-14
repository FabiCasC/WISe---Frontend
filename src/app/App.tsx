import { useCallback, useEffect, useState } from 'react'
import type { ArchiveItem } from '../content/archive'
import { getGameTitle } from '../content/games'
import { getMission, type MissionCard } from '../content/missions'
import {
  getPlayerId,
  loadMembership,
  localClassService,
  saveMembership,
  type Membership,
} from '../shared/classroom'
import { applyResult, isLevelUnlocked, nextPlayableLevel } from '../shared/progress'
import type { GameId, GameResult, LevelId } from '../shared/types'
import ArchiveCard from './components/ArchiveCard'
import Dossier from './components/Dossier'
import SettingsPanel from './components/SettingsPanel'
import Sky from './components/Sky'
import Topbar from './components/Topbar'
import GameHost from './GameHost'
import { navigate, useHashRoute, useScrollReset, type PageRoute } from './hooks/useHashRoute'
import { useProgress } from './hooks/useProgress'
import Arcade from './pages/Arcade'
import Home from './pages/Home'
import JoinClass from './pages/JoinClass'
import Panel from './pages/Panel'
import Teacher from './pages/Teacher'

/** Servicio de clases. Cuando exista el backend se cambia aquí por el cliente de API. */
const classService = localClassService

function pageKey(page: PageRoute): string {
  if (page.name === 'join') return `join/${page.code ?? ''}`
  if (page.name === 'panel') return `panel/${page.token}`
  return page.name
}

export default function App() {
  const route = useHashRoute()
  const { progress, storageOk, record, updateSettings, reset } = useProgress()

  const [playerId] = useState(getPlayerId)
  const [membership, setMembership] = useState<Membership | null>(loadMembership)
  const [dossierId, setDossierId] = useState<GameId | null>(null)
  const [archiveItem, setArchiveItem] = useState<ArchiveItem | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  /**
   * Mientras se juega, la página de fondo sigue siendo la que estaba. Así,
   * al salir de la partida se vuelve justo donde se estaba.
   */
  const [page, setPage] = useState<PageRoute>(() =>
    route.name === 'play' ? { name: 'landing' } : route,
  )
  const [pageHash, setPageHash] = useState('#/')
  useEffect(() => {
    if (route.name !== 'play') {
      setPage(route)
      setPageHash(window.location.hash || '#/')
    }
  }, [route])

  // Cambiar de página vuelve arriba; moverse por anclas no.
  useScrollReset(pageKey(page))

  // Una URL directa a un nivel bloqueado lleva al nivel que sí está abierto.
  useEffect(() => {
    if (route.name === 'play' && !isLevelUnlocked(progress, route.gameId, route.levelId)) {
      navigate(`#/jugar/${route.gameId}/${nextPlayableLevel(progress, route.gameId)}`)
    }
  }, [route, progress])

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

  const play = useCallback(
    (mission: MissionCard, levelId?: LevelId) => {
      setDossierId(null)
      setArchiveItem(null)
      const lvl =
        levelId && isLevelUnlocked(progress, mission.gameId, levelId)
          ? levelId
          : nextPlayableLevel(progress, mission.gameId)
      navigate(`#/jugar/${mission.gameId}/${lvl}`)
    },
    [progress],
  )

  const exitGame = useCallback(() => navigate(pageHash), [pageHash])

  const handleResult = useCallback(
    (result: GameResult) => {
      record(result)
      if (membership) {
        // Mismo cálculo que hace record(), para enviar el progreso ya actualizado.
        classService.reportResult(membership, applyResult(progress, result), result).catch(() => {
          /* el respaldo local nunca debe interrumpir la partida */
        })
      }
      setToast(
        result.completed
          ? `¡Nivel completado en ${getGameTitle(result.gameId)}!`
          : 'Partida cerrada sin completar. Puedes reintentar cuando quieras.',
      )
      exitGame()
    },
    [record, membership, progress, exitGame],
  )

  const joined = useCallback((m: Membership) => {
    saveMembership(m)
    setMembership(m)
  }, [])

  const leaveClass = useCallback(() => {
    saveMembership(null)
    setMembership(null)
    setToast('Saliste de la clase. Tu progreso sigue aquí, en modo personal.')
    navigate('#/')
  }, [])

  const dossierMission = dossierId ? getMission(dossierId) : undefined

  return (
    <>
      <Sky reducedMotion={progress.settings.reducedMotion} />

      <a className="skip-link" href={page.name === 'landing' ? '#juegos' : '#main'}>
        {page.name === 'landing' ? 'Saltar a los juegos' : 'Saltar al contenido'}
      </a>

      <div className="shell">
        <Topbar
          isHome={page.name === 'landing'}
          progress={progress}
          membership={membership}
          onSettings={() => setSettingsOpen(true)}
        />

        <main id="main">
          {page.name === 'arcade' && (
            <Arcade progress={progress} onPlay={(m) => play(m)} onItem={setArchiveItem} />
          )}
          {page.name === 'teacher' && <Teacher service={classService} />}
          {page.name === 'join' && (
            <JoinClass
              key={page.code ?? ''}
              code={page.code}
              membership={membership}
              playerId={playerId}
              service={classService}
              onJoined={joined}
              onLeave={leaveClass}
            />
          )}
          {page.name === 'panel' && (
            <Panel key={page.token} token={page.token} service={classService} />
          )}
          {page.name === 'landing' && (
            <Home
              progress={progress}
              membership={membership}
              onPlay={play}
              onDossier={setDossierId}
            />
          )}
        </main>
      </div>

      {/* --------------------------------------------------------- SUPERPUESTO */}
      {route.name === 'play' && isLevelUnlocked(progress, route.gameId, route.levelId) && (
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
          onPlay={(m) => play(m)}
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
