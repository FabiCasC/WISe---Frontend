import { useEffect, useId, useRef, type ReactNode } from 'react'
import { IconClose } from './Art'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo accesible: cierra con Escape, atrapa el foco, bloquea el scroll de
 * fondo y devuelve el foco al elemento que lo abrió.
 */
export default function Modal({ title, subtitle, onClose, children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const opener = useRef<HTMLElement | null>(null)

  useEffect(() => {
    opener.current = document.activeElement as HTMLElement | null
    document.body.classList.add('is-locked')

    const node = ref.current
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !node) return

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.body.classList.remove('is-locked')
      opener.current?.focus?.()
    }
  }, [onClose])

  return (
    <div
      className="overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref}>
        <div className="modal__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="modal__title" id={titleId}>
              {title}
            </h2>
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="btn btn--quiet btn--icon modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="modal__body">
          {children}
          {footer}
        </div>
      </div>
    </div>
  )
}
