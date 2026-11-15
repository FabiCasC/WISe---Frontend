/**
 * DESIGN GAME - ASISTENTE DE IA
 * Sin emojis; iconos SVG coherentes con Órbita Arcade.
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
import { getState, openProject, saveCurrentProject } from '../store'

/* -------------------------------------------------------------------------
   Iconos SVG
   ------------------------------------------------------------------------- */
const stroke = {
  fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function IconBot()   { return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3" {...stroke} /><circle cx="9" cy="13" r="1.5" {...stroke} /><circle cx="15" cy="13" r="1.5" {...stroke} /><path d="M12 3v5" {...stroke} /></svg> }
function IconClose() { return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" {...stroke} /></svg> }
function IconSend()  { return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" {...stroke} /></svg> }
function IconCheck() { return <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2.4} /></svg> }

interface Props {
  spec: GameSpecification
  onClose: () => void
}

export default function AIAssistant({ spec, onClose }: Props) {
  const [messages, setMessages] = useState<AIConversationMessage[]>([
    {
      role: 'assistant',
      content: `Hola. Soy el asistente de Design Game.\n\nPuedo ayudarte con "${spec.name}". Puedes pedirme cosas como:\n· "Agrega un enemigo que persiga al jugador"\n· "Que mi personaje salte más alto"\n· "Explícame qué hace el bloque de salto"\n· "¿Por qué no puedo recoger las estrellas?"\n\nModo demostración: las respuestas son ejemplos predefinidos, no IA real.`,
      timestamp: new Date().toISOString(),
      isDemo: true,
    },
  ])
  const [input, setInput]       = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setMessages((prev) => [...prev, createMessage('user', text)])
    setInput('')
    setIsLoading(true)

    try {
      const context = {
        projectName:   spec.name,
        genre:         spec.genre,
        entityCount:   spec.entities.length,
        scriptCount:   spec.scripts.length,
        variableCount: spec.variables.length,
        entityNames:   spec.entities.map((e) => e.name),
      }
      const response = await processAIRequest({ message: text, context })
      let content = response.explanation
      if (response.hint) content += `\n\nPista: ${response.hint}`
      setMessages((prev) => [...prev, createMessage('assistant', content, response.proposedChanges)])
    } catch {
      setMessages((prev) => [...prev, createMessage('assistant', 'Hubo un problema al procesar tu solicitud. Intenta de nuevo.')])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = (msgIndex: number) => {
    const msg = messages[msgIndex]
    if (!msg.proposedChanges?.length) return
    const { project } = getState()
    if (!project) return
    openProject(applyProposedChanges(project, msg.proposedChanges))
    saveCurrentProject()
    setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, accepted: true } : m))
  }

  const handleReject = (msgIndex: number) => {
    setMessages((prev) => prev.map((m, i) => i === msgIndex ? { ...m, accepted: false } : m))
  }

  return (
    <div className="dg-ai">
      <div className="dg-ai__header">
        <div className="dg-ai__title">
          <span className="dg-ai__title-icon"><IconBot /></span>
          Asistente IA
          <span className="dg-ai__demo-badge">DEMO</span>
        </div>
        <button className="dg-btn dg-btn--quiet dg-btn--sm" onClick={onClose} aria-label="Cerrar asistente">
          <IconClose />
        </button>
      </div>

      <div className="dg-ai__messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`dg-ai__message dg-ai__message--${msg.role}`}>
            <div className="dg-ai__message-content">
              <FormattedText text={msg.content} />
            </div>

            {msg.proposedChanges && msg.proposedChanges.length > 0 && msg.accepted === undefined && (
              <div className="dg-ai__proposal">
                <p className="dg-ai__proposal-title">Cambios propuestos</p>
                <ul className="dg-ai__proposal-list">
                  {msg.proposedChanges.map((c, ci) => (
                    <li key={ci}>{describeChange(c)}</li>
                  ))}
                </ul>
                <div className="dg-ai__proposal-actions">
                  <button className="dg-btn dg-btn--primary dg-btn--sm" onClick={() => handleAccept(idx)}>
                    Aplicar cambios
                  </button>
                  <button className="dg-btn dg-btn--quiet dg-btn--sm" onClick={() => handleReject(idx)}>
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {msg.accepted === true && (
              <span className="dg-ai__accepted"><IconCheck /> Cambios aplicados</span>
            )}
            {msg.accepted === false && (
              <span className="dg-ai__rejected">Cambios rechazados</span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="dg-ai__message dg-ai__message--assistant">
            <div className="dg-ai__loading">
              <span className="dg-spinner" /> Procesando…
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
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          disabled={isLoading}
        />
        <button
          className="dg-btn dg-btn--primary dg-btn--sm"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          aria-label="Enviar mensaje"
        >
          <IconSend />
        </button>
      </div>

      <p className="dg-ai__disclaimer">
        Modo demostración. Las respuestas son ejemplos predefinidos, no IA real.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------
   Texto formateado (· listas, **negrita**, saltos de línea)
   ------------------------------------------------------------------------- */
function FormattedText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        return <p key={i} style={{ margin: '2px 0', lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: html }} />
      })}
    </>
  )
}

function describeChange(change: ProposedChange): string {
  switch (change.type) {
    case 'add_entity':             return `Agregar "${change.template}" en (${change.position?.x ?? '?'}, ${change.position?.y ?? '?'})`
    case 'add_script':             return `Crear script para "${change.entityName}" con evento "${change.eventType}"`
    case 'update_entity_property': return `Actualizar ${change.property} de "${change.entityName}" a ${change.value}`
    case 'add_variable':           return `Crear variable "${change.name}" con valor ${change.initialValue}`
  }
}
