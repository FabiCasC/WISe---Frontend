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
import { IconClose } from './Icons'

interface Props {
  spec: GameSpecification
  onClose: () => void
}

export default function AIAssistant({ spec, onClose }: Props) {
  const [messages, setMessages] = useState<AIConversationMessage[]>([
    {
      role: 'assistant',
      content: `Hello. I am the Design Game helper, and I can talk through "${spec.name}" with you.\n\nTry asking me things like:\n• "Add an enemy that chases the player"\n• "What does the jump block do?"\n• "Why won't my sprite move?"\n\n**Demo mode:** no real AI is connected here. The answers are written in advance.`,
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
      if (response.hint) aiMsg.content += `\n\n**Hint:** ${response.hint}`
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('assistant', 'Something went wrong on my side. Try asking again.'),
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
          <span>AI helper</span>
          <span className="dg-ai__demo-badge">DEMO</span>
        </div>
        <button className="dg-btn dg-btn--ghost dg-btn--sm" onClick={onClose}>
          <IconClose label="Close" />
        </button>
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
                <p className="dg-ai__proposal-title">What I would change:</p>
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
                    Apply these
                  </button>
                  <button
                    className="dg-btn dg-btn--ghost dg-btn--sm"
                    onClick={() => handleReject(idx)}
                  >
                    No thanks
                  </button>
                </div>
              </div>
            )}

            {msg.accepted === true && (
              <span className="dg-ai__accepted">Changes applied</span>
            )}
            {msg.accepted === false && (
              <span className="dg-ai__rejected">Changes turned down</span>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="dg-ai__message dg-ai__message--assistant">
            <div className="dg-ai__loading">
              <span className="dg-spinner" />
              Thinking…
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
          placeholder="Ask a question, or say what to change…"
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
          Send
        </button>
      </div>

      <p className="dg-ai__disclaimer">
        Demo mode. These answers are written in advance, not a real AI.
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
      return `Put a "${change.template}" at (${change.position?.x ?? '?'}, ${change.position?.y ?? '?'})`
    case 'add_script':
      return `Start a script on "${change.entityName}", beginning with "${change.eventType}"`
    case 'update_entity_property':
      return `Set ${change.property} on "${change.entityName}" to ${change.value}`
    case 'add_variable':
      return `Store a value called "${change.name}", starting at ${change.initialValue}`
  }
}
