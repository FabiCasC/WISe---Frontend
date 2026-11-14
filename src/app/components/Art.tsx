import type { GameId } from '../../shared/types'

/* =========================================================================
   Logotipo
   ========================================================================= */

export function BrandGlyph({ className = 'brandmark__glyph' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" role="img" aria-label="Orbita Arcade">
      <defs>
        <radialGradient id="bg-core" cx="38%" cy="32%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#75CBD1" />
          <stop offset="1" stopColor="#3E5BA3" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#0C0D45" />
      <rect width="64" height="64" rx="15" fill="none" stroke="rgba(117,203,209,.4)" />
      <ellipse
        cx="32"
        cy="32"
        rx="26"
        ry="9.5"
        fill="none"
        stroke="#F2D2FF"
        strokeWidth="2.4"
        opacity="0.9"
        transform="rotate(-24 32 32)"
      />
      <circle cx="32" cy="32" r="11.5" fill="url(#bg-core)" />
      <circle cx="28" cy="28" r="3" fill="#ffffff" opacity="0.65" />
      <circle cx="53" cy="18.5" r="3.1" fill="#F2D2FF" />
    </svg>
  )
}

/* =========================================================================
   Iconos (24×24, trazo)
   ========================================================================= */

type IconProps = { size?: number }

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconPlay({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  )
}

export function IconInfo({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M12 11v5M12 7.6v.2" {...stroke} />
    </svg>
  )
}

export function IconGear({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" {...stroke} />
      <path
        d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"
        {...stroke}
      />
    </svg>
  )
}

export function IconClose({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" {...stroke} />
    </svg>
  )
}

export function IconBack({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 5 8 12l7 7" {...stroke} />
    </svg>
  )
}

export function IconPause({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5v14M15 5v14" {...stroke} />
    </svg>
  )
}

export function IconStamp({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a3 3 0 0 0-3 3c0 1.7 1 2.2 1 4H14c0-1.8 1-2.3 1-4a3 3 0 0 0-3-3Z" {...stroke} />
      <path d="M5 15h14v2H5zM6.5 19h11" {...stroke} />
    </svg>
  )
}

export function IconLink({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5M19 5l-8 8" {...stroke} />
      <path d="M18 14v4a1.8 1.8 0 0 1-1.8 1.8H6A1.8 1.8 0 0 1 4.2 18V7.8A1.8 1.8 0 0 1 6 6h4" {...stroke} />
    </svg>
  )
}

export function IconLock({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" {...stroke} />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7" {...stroke} />
    </svg>
  )
}

export function IconCopy({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" {...stroke} />
      <path d="M15.5 5.5V5a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5" {...stroke} />
    </svg>
  )
}

export function IconTeacher({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="11" rx="1.8" {...stroke} />
      <path d="M8 19.5h8M12 15v4.5M7.5 8.5h6M7.5 11h4" {...stroke} />
    </svg>
  )
}

export function IconUsers({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="3.2" {...stroke} />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 6.2a3 3 0 0 1 0 5.6M17 14.2a5 5 0 0 1 3.5 4.8" {...stroke} />
    </svg>
  )
}

export function IconStar({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" {...stroke} />
    </svg>
  )
}

export function IconVR({ size = 30 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 8.5A1.5 1.5 0 0 1 5 7h14a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 19 16h-3.6l-1.9-2.4a1.9 1.9 0 0 0-3 0L8.6 16H5a1.5 1.5 0 0 1-1.5-1.5Z" {...stroke} />
      <circle cx="8" cy="11.3" r="1.4" {...stroke} />
      <circle cx="16" cy="11.3" r="1.4" {...stroke} />
    </svg>
  )
}

export function IconRocket({ size = 30 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3c3 2.2 4.5 5.4 4.5 9.2L14.8 16H9.2l-1.7-3.8C7.5 8.4 9 5.2 12 3Z" {...stroke} />
      <circle cx="12" cy="9.5" r="1.6" {...stroke} />
      <path d="M9.2 16 7 18.5l.4-4M14.8 16l2.2 2.5-.4-4M11 19.5h2" {...stroke} />
    </svg>
  )
}

/* =========================================================================
   Protagonistas, dibujados en SVG
   ========================================================================= */

/**
 * Rover de seis ruedas con panel solar, mástil y brazo.
 * `stuck` dibuja la variante de Spirit: inclinado, con la rueda delantera
 * derecha trabada y la huella que dejó al arrastrarla.
 */
function Rover({ accent, stuck = false }: { accent: string; stuck?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 130"
      className="rover"
      aria-hidden="true"
      width="100%"
      style={stuck ? { transform: 'rotate(-6deg)' } : undefined}
    >
      <defs>
        <linearGradient id={`panel-${accent.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b3a66" />
          <stop offset="1" stopColor="#0a1c33" />
        </linearGradient>
      </defs>

      {/* Sombra en el suelo */}
      <ellipse cx="100" cy="122" rx="62" ry="6" fill="rgba(0,0,0,.35)" />

      {/* Paneles solares */}
      <path d="M28 58h144l-10 14H38z" fill={`url(#panel-${accent.slice(1)})`} stroke="#8FB7E0" strokeWidth="1.2" />
      <path d="M40 61h120M44 66h112" stroke="#6DE2F2" strokeWidth="0.9" opacity="0.6" />

      {/* Cuerpo */}
      <rect x="66" y="72" width="68" height="26" rx="5" fill="#D8DEE9" stroke="#7D8794" strokeWidth="1.4" />
      <rect x="72" y="78" width="22" height="12" rx="2.5" fill="#0C2038" stroke={accent} strokeWidth="1.2" />
      <rect x="100" y="78" width="12" height="5" rx="1.5" fill={accent} />

      {/* Mástil y cámara */}
      <path d="M100 58V38" stroke="#AEB8C6" strokeWidth="3.4" strokeLinecap="round" />
      <rect x="84" y="24" width="33" height="15" rx="4" fill="#C8CEDA" stroke="#7D8794" strokeWidth="1.3" />
      <circle cx="93" cy="31.5" r="4" fill="#0C2038" stroke={accent} strokeWidth="1.3" />
      <circle cx="108" cy="31.5" r="4" fill="#0C2038" stroke={accent} strokeWidth="1.3" />
      <circle cx="93" cy="31.5" r="1.4" fill={accent} />
      <circle cx="108" cy="31.5" r="1.4" fill={accent} />

      {/* Brazo instrumental */}
      <path d="M66 86 48 96l-7 9" stroke="#AEB8C6" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="106" r="4.6" fill="#0C2038" stroke={accent} strokeWidth="1.6" />

      {/* Suspensión y ruedas */}
      <path d="M72 98 56 108M100 98v10M128 98l16 10" stroke="#8C96A4" strokeWidth="3" strokeLinecap="round" />
      {[54, 100, 146].map((cx) => {
        // En la variante de Spirit la rueda delantera no gira: se dibuja
        // hundida en el suelo y sin radios visibles.
        const jammed = stuck && cx === 146
        return (
          <g key={cx} transform={jammed ? 'translate(0 5)' : undefined}>
            <circle
              cx={cx}
              cy="112"
              r="10"
              fill="#2A3242"
              stroke={jammed ? accent : '#AEB8C6'}
              strokeWidth="2"
              strokeDasharray={jammed ? '4 3' : undefined}
            />
            <circle cx={cx} cy="112" r="3.4" fill={jammed ? accent : '#AEB8C6'} />
          </g>
        )
      })}

      {/* Huella del arrastre: destapa suelo claro rico en sílice */}
      {stuck && (
        <path
          d="M150 122h44"
          stroke="#F4E7D2"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.85"
        />
      )}
    </svg>
  )
}

/** Estación lunar: sismómetro con antena + panel retrorreflector. */
function LunarStation({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 200 130" aria-hidden="true" width="100%">
      <ellipse cx="100" cy="122" rx="66" ry="6" fill="rgba(0,0,0,.45)" />

      {/* Haz láser que vuelve */}
      <path d="M150 20 134 92" stroke="#6DE2F2" strokeWidth="2" opacity="0.85" strokeDasharray="5 5">
        <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.1s" repeatCount="indefinite" />
      </path>
      <path d="M158 20 142 92" stroke="#9BF6FF" strokeWidth="1.2" opacity="0.5" />

      {/* Retrorreflector: rejilla de esquinas cúbicas */}
      <g transform="translate(118 90) skewX(-12)">
        <rect x="0" y="0" width="46" height="26" rx="3" fill="#101F36" stroke="#C8CEDA" strokeWidth="1.5" />
        {[0, 1, 2, 3, 4].map((i) =>
          [0, 1, 2].map((j) => (
            <circle key={`${i}-${j}`} cx={6 + i * 9} cy={6 + j * 8} r="3" fill="#6DE2F2" opacity={0.35 + ((i + j) % 3) * 0.22} />
          )),
        )}
      </g>

      {/* Sismómetro: cuerpo cilíndrico con falda térmica */}
      <path d="M36 116h56l-7-24H43z" fill="#D8DEE9" stroke="#7D8794" strokeWidth="1.4" />
      <rect x="48" y="66" width="30" height="28" rx="4" fill="#C8CEDA" stroke="#7D8794" strokeWidth="1.4" />
      <rect x="54" y="72" width="18" height="9" rx="2" fill="#0C2038" stroke={accent} strokeWidth="1.2" />

      {/* Antena */}
      <path d="M63 66V44" stroke="#AEB8C6" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 44a13 13 0 0 1 26 0" fill="none" stroke="#AEB8C6" strokeWidth="2.6" />
      <circle cx="63" cy="40" r="3.2" fill={accent}>
        <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite" />
      </circle>

      {/* Ondas sísmicas */}
      <path d="M20 104q8-9 16 0t16 0" fill="none" stroke={accent} strokeWidth="1.8" opacity="0.7">
        <animate attributeName="opacity" values="0.15;0.8;0.15" dur="2.8s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

/**
 * Escena de respaldo de cada portal. Es 100 % CSS+SVG: el portal se ve
 * terminado aunque no exista todavía ninguna ilustración.
 */
export function MissionScene({ gameId, accent }: { gameId: GameId; accent: string }) {
  const isMoon = gameId === 'lunar-signals'
  const isSpirit = gameId === 'spirit'

  const variant = isMoon ? 'scene--luna' : isSpirit ? 'scene--spirit' : 'scene--marte'

  return (
    <div className={`scene ${variant}`} aria-hidden="true">
      <span className="scene__sky" />
      {isMoon && <span className="scene__starfield" />}
      <span className="scene__sun" />
      {isMoon && <span className="scene__earth" />}
      <span className="scene__ground" />
      {isSpirit && <span className="scene__silica" />}
      <span className="scene__dust" />
      <div className="scene__subject">
        {isMoon ? <LunarStation accent={accent} /> : <Rover accent={accent} stuck={isSpirit} />}
      </div>
      <span className="scene__scan" />
    </div>
  )
}
