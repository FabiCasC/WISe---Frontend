/**
 * DESIGN GAME - ASISTENTE DE IA
 * Drawer lateral con chat contextual y propuesta de cambios.
 */

import { useEffect, useRef, useState } from 'react'
import type { GameSpecification } from '../types'
import {
  type AIConversationMessage,
  type ProposedChange,
  createMessage,
  processAIRequest,
  applyProposedChanges,
} from '../ai'
import {
  getState,
  openProject,
  saveCurrentProject,
} from '../store'

interface Props {
  spec: GameSpecification
  onClose: () => void
}

export default function AIAssistant({ spec, onClose }: Props) {
  const [messages, setMessages] = useState<AIConversationMessage[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy el asistente de Design Game. Puedo ayudarte a mejorar "${spec.name}".\n\nPuedes pedirme cosas como:\n• "Agrega un enemigo que persiga al jugador"\n• "¿Qué hace el bloque de salto?"\n• "¿Por qué mi personaje no se mueve?"\n\n⚠️ **Modo demostración:** no hay IA real conectada. Las respuestas son demostrativas.`,
      timestamp: new Date().toISOString(),
      isDemo: true,
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = createMessage('user', text)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { project: _proj } = getState()
      const context = {
        projectName: spec.name,
        genre: spec.genre,
        entityCount: spec.entities.length,
        scriptCount: spec.scripts.length,
        variableCount: spec.variables.length,
        entityNames: spec.entities.map((e) => e.name),
      }

      const response = await processAIRequest({ message: text, context })
      const aiMsg = createMessage('assistant', response.explanation, response.proposedChanges)
      if (response.hint) aiMsg.content += `\n\n💡 **Pista:** ${response.hint}`
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', 'Hubo un problema al procesar tu solicitud. Intenta de nuevo.'),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = (msgIndex: number) => {
    const msg = messages[msgIndex]
    if (!msg.proposedChanges?.length) return

    const { project } = getState()
    if (!project) return
    if (!project) return
    if (!project) return

    const updated = applyProposedChanges(project, msg.proposedChanges)
    openProject(updated)
    saveCurrentProject()

    setMessages((prev) =>
      prev.map((m, i) => i === msgIndex ? { ...m, accepted: true } : m),
    )
  }

  const handleReject = (msgIndex: number) => {
    setMessages((prev) =>
      prev.map((m, i) => i === msgIndex ? { ...m, accepted: false } : m),
    )
  }

  return (
    <div className="dg-ai">
      <div className="dg-ai__header">
        <div className="dg-ai__title">
          <span className="dg-ai__icon">🤖</span>
          <span>Asistente IA</span>
          <span className="dg-ai__demo-badge">DEMO</span>
        </div>
        <button className="dg-btn dg-btn--ghost dg-btn--sm" onClick={onClose}>✕</button>
      </div>

      <div className="dg-ai__messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`dg-ai__message dg-ai__message--${msg.role}`}
          >
            <div className="dg-ai__message-content">
              <FormattedText text={msg.content} />
            </div>

            {/* Propuesta de cambios */}
            {msg.proposedChanges && msg.proposedChanges.length > 0 && msg.accepted === undefined && (
              <div className="dg-ai__proposal">
                <p className="dg-ai__proposal-title">Cambios propuestos:</p>
                <ul className="dg-ai__proposal-list">
                  {msg.proposedChanges.map((c, ci) => (
                    <li key={ci}>{describeChange(c)}</li>
                  ))}
                </ul>
                <div className="dg-ai__proposal-actions">
                  <button
                    className="dg-btn dg-btn--primary dg-btn--sm"
                    onClick={() => handleAccept(idx)}
                  >
                    ✓ Aplicar cambios
                  </button>
                  <button
                    className="dg-btn dg-btn--ghost dg-btn--sm"
                    onClick={() => handleReject(idx)}
                  >
                    ✕ Rechazar
                  </button>
                </div>
              </div>
            )}

            {msg.accepted === true && (
              <span className="dg-ai__accepted">✓ Cambios aplicados</span>
            )}
            {msg.accepted === false && (
              <span className="dg-ai__rejected">✗ Cambios rechazados</span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="dg-ai__message dg-ai__message--assistant">
            <div className="dg-ai__loading">
              <span className="dg-spinner" />
              Pensando…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="dg-ai__input-row">
        <textarea
          className="dg-ai__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta o solicitud…"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isLoading}
        />
        <button
          className="dg-btn dg-btn--primary dg-btn--sm"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          Enviar
        </button>
      </div>

      <p className="dg-ai__disclaimer">
        ⚠️ Modo demostración. Las respuestas son ejemplos predefinidos, no IA real.
      </p>
    </div>
  )
}

function FormattedText({ text }: { text: string }) {
  // Simple markdown-like: **bold**, bullet points, line breaks
  const lines = text.split('\n')
  return (
    <div>
      {lines.map((line, i) => {
        const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return (
          <p
            key={i}
            style={{ margin: '2px 0' }}
            dangerouslySetInnerHTML={{ __html: bold }}
          />
        )
      })}
    </div>
  )
}

function describeChange(change: ProposedChange): string {
  switch (change.type) {
    case 'add_entity':
      return `Agregar "${change.template}" en posición (${change.position?.x ?? '?'}, ${change.position?.y ?? '?'})`
    case 'add_script':
      return `Crear script para "${change.entityName}" con evento "${change.eventType}"`
    case 'update_entity_property':
      return `Actualizar ${change.property} de "${change.entityName}" a ${change.value}`
    case 'add_variable':
      return `Crear variable "${change.name}" con valor inicial ${change.initialValue}`
  }
}
