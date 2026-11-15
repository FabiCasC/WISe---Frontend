/**
 * DESIGN GAME - VISTA PREVIA DE SPRITE
 * -------------------------------------------------------------------------
 * Dibuja en SVG la MISMA forma y los MISMOS colores que renderer.ts dibuja
 * en el canvas, a partir del SPRITE_DESCRIPTORS de entities.ts.
 *
 * English note: the pickers used to show an emoji that had nothing to do with
 * what the simulator draws. This component is the single source of the
 * preview, so what a student picks is what a student gets.
 */

import { SPRITE_DESCRIPTORS, type SpriteDescriptor } from '../entities'

interface Props {
  /** Clave de sprite (la misma que guarda la entidad) */
  sprite: string
  /** Tamaño en píxeles del cuadro */
  size?: number
  /**
   * Nombre legible. Si se pasa, el SVG se anuncia con ese nombre;
   * si se omite, se oculta a lectores de pantalla porque hay texto al lado.
   */
  label?: string
}

export default function SpritePreview({ sprite, size = 24, label }: Props) {
  const descriptor = SPRITE_DESCRIPTORS[sprite]
  const primary = descriptor?.primaryColor ?? '#8a8a8a'
  const secondary = descriptor?.secondaryColor ?? '#555555'
  const shape = descriptor?.shape ?? 'player'

  return (
    <svg
      className="dg-sprite"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {renderShape(shape, primary, secondary)}
    </svg>
  )
}

function renderShape(shape: SpriteDescriptor['shape'], primary: string, secondary: string) {
  switch (shape) {
    case 'player':
      return (
        <>
          <rect x="4" y="9" width="16" height="13" rx="3" fill={primary} />
          <rect x="7" y="11" width="10" height="2" fill={secondary} />
          <circle cx="12" cy="6" r="5" fill="#ffe0b2" />
          <circle cx="10" cy="6" r="1" fill="#333333" />
          <circle cx="14" cy="6" r="1" fill="#333333" />
        </>
      )
    case 'enemy':
      return (
        <>
          <rect x="3" y="8" width="18" height="14" rx="4" fill={primary} />
          <circle cx="12" cy="6" r="5.5" fill={secondary} />
          <circle cx="9.6" cy="6" r="1.3" fill="#ffff00" />
          <circle cx="14.4" cy="6" r="1.3" fill="#ffff00" />
          <path d="M7.2 2.8 L10.6 4 M16.8 2.8 L13.4 4" stroke="#ffff00" strokeWidth="1.3" />
        </>
      )
    case 'star':
      return (
        <path
          d="M12 1.5 L15 8.8 L22.8 9.4 L16.9 14.5 L18.7 22 L12 18 L5.3 22 L7.1 14.5 L1.2 9.4 L9 8.8 Z"
          fill={primary}
        />
      )
    case 'coin':
      return (
        <>
          <circle cx="12" cy="12" r="10" fill={primary} />
          <circle cx="12" cy="12" r="6.5" fill="none" stroke={secondary} strokeWidth="1.6" />
          <rect x="11" y="7.5" width="2" height="9" rx="1" fill={secondary} />
        </>
      )
    case 'gem':
      return (
        <>
          <path d="M12 1.5 L22.5 10 L12 22.5 L1.5 10 Z" fill={primary} />
          <path d="M12 1.5 L18 10 L12 14.5 Z" fill={secondary} />
        </>
      )
    case 'key':
      return (
        <>
          <circle cx="8" cy="8" r="5" fill="none" stroke={primary} strokeWidth="2.4" />
          <path
            d="M11.4 11.4 L20.5 20.5 M16.6 15 L14.6 17 M19 17.4 L17 19.4"
            stroke={primary}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )
    case 'rock':
      return (
        <>
          <path d="M5 21 L1.5 14.5 L3.8 6.5 L12 3 L20.5 7.5 L22.5 15.5 L18 21 Z" fill={primary} />
          <path d="M7.5 7 L12 4.5 L15.5 7.5 Z" fill={secondary} />
        </>
      )
    case 'fire':
      return (
        <>
          <path d="M12 1 C19 7 18.5 13 12 23 C5.5 13 5 7 12 1 Z" fill={primary} />
          <path d="M12 8 C15.5 11.5 15.2 15 12 20 C8.8 15 8.5 11.5 12 8 Z" fill="#ffeb3b" />
        </>
      )
    case 'spike':
      return (
        <path
          d="M1 21 L5 7 L9 21 Z M8 21 L12 7 L16 21 Z M15 21 L19 7 L23 21 Z"
          fill={primary}
        />
      )
    case 'platform':
      return (
        <>
          <rect x="1" y="8" width="22" height="9" rx="2" fill={primary} />
          <rect x="2.5" y="9.5" width="19" height="2" rx="1" fill={secondary} />
        </>
      )
    case 'flag':
      return (
        <>
          <rect x="6" y="2" width="2" height="20" rx="1" fill="#cccccc" />
          <path d="M8 3 L21 7 L8 11 Z" fill={primary} />
        </>
      )
    case 'portal':
      return (
        <>
          <ellipse cx="12" cy="12" rx="7" ry="10.5" fill={secondary} />
          <ellipse
            cx="12"
            cy="12"
            rx="9"
            ry="11"
            fill="none"
            stroke={primary}
            strokeWidth="2"
          />
        </>
      )
    default:
      return <rect x="2" y="2" width="20" height="20" rx="4" fill={primary} />
  }
}
