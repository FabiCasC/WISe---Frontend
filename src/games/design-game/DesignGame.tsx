/**
 * DESIGN GAME - COMPONENTE PRINCIPAL
 * -------------------------------------------------------------------------
 * Punto de entrada React del módulo. Gestiona la navegación entre:
 * - Pantalla inicial (descripción del videojuego)
 * - Editor principal (bloques + simulador + entidades + IA)
 */

import { useCallback, useEffect, useReducer, useState } from 'react'
import type { GameSpecification, GameGenre } from './types'
import {
  initStore,
  getState,
  subscribe,
  createNewProject,
  openProject,
  closeProject,
  saveCurrentProject,
  deleteProject,
} from './store'
import { generateInitialProposal, applyProposedChanges } from './ai'
import WelcomeScreen from './components/WelcomeScreen'
import EditorScreen from './components/EditorScreen'
import './design-game.css'

type Screen = 'welcome' | 'editor'

export default function DesignGame() {
  const [, forceUpdate] = useReducer((n) => n + 1, 0)
  const [screen, setScreen] = useState<Screen>('welcome')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    initStore()
    const unsub = subscribe(forceUpdate)
    return unsub
  }, [])

  const storeState = getState()

  const handleDescribe = useCallback(
    async (description: string, genre: GameGenre, name: string) => {
      setIsGenerating(true)
      try {
        const project = createNewProject({ name, description, genre })
        // Generar propuesta inicial a partir de la descripción
        const proposal = generateInitialProposal(description, genre)
        const enriched = applyProposedChanges(project, proposal.proposedChanges)
        openProject(enriched)
        saveCurrentProject()
        setScreen('editor')
      } finally {
        setIsGenerating(false)
      }
    },
    [],
  )

  const handleOpenProject = useCallback((project: GameSpecification) => {
    openProject(project)
    setScreen('editor')
  }, [])

  const handleBack = useCallback(() => {
    closeProject()
    setScreen('welcome')
  }, [])

  if (screen === 'editor' && storeState.project) {
    return (
      <EditorScreen
        project={storeState.project}
        selectedEntityId={storeState.selectedEntityId}
        selectedScriptId={storeState.selectedScriptId}
        onBack={handleBack}
      />
    )
  }

  return (
    <WelcomeScreen
      recentProjects={storeState.projects.slice(0, 6)}
      isGenerating={isGenerating}
      onDescribe={handleDescribe}
      onOpenProject={handleOpenProject}
      onDeleteProject={deleteProject}
    />
  )
}
