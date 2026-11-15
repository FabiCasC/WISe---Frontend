/**
 * DESIGN GAME - ICONOS SVG
 * -------------------------------------------------------------------------
 * Iconos de control dibujados en SVG, no con caracteres pictográficos.
 *
 * English note: a glyph like an arrow or a tick is a blank box on a machine
 * without the font, and a screen reader reads it as nothing useful. Every
 * icon here either takes a `label` (and is announced with it) or sits next
 * to its own text, in which case it is hidden from screen readers.
 */

interface IconProps {
  /** Nombre legible; si se omite, el icono se oculta a lectores de pantalla */
  label?: string
  size?: number
}

function Svg({
  label,
  size = 16,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className="dg-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </Svg>
  )
}

export function IconPlay(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4 L20 12 L7 20 Z" fill="currentColor" />
    </Svg>
  )
}

export function IconPause(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 4 L8 20 M16 4 L16 20" strokeWidth="3" />
    </Svg>
  )
}

export function IconStop(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </Svg>
  )
}

export function IconRestart(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12 A8 8 0 1 1 12 4 L17 4" />
      <path d="M17 1 L17 7 L11 7" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12.5 L9.5 18 L20 6" />
    </Svg>
  )
}

export function IconWarning(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3 L22 20 L2 20 Z" />
      <path d="M12 9 L12 14 M12 17 L12 17.1" />
    </Svg>
  )
}

export function IconInfo(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11 L12 16 M12 8 L12 8.1" />
    </Svg>
  )
}

export function IconArrow({
  direction,
  ...props
}: IconProps & { direction: 'up' | 'down' | 'left' | 'right' }) {
  const rotation = { up: 0, right: 90, down: 180, left: 270 }[direction]
  return (
    <Svg {...props}>
      <g transform={`rotate(${rotation} 12 12)`}>
        <path d="M12 20 L12 5 M6 11 L12 5 L18 11" />
      </g>
    </Svg>
  )
}
