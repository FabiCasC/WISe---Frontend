import { useId } from 'react'

/**
 * Parche de misión de Órbita Arcade. Inspirado en las insignias de tela de
 * las misiones espaciales (borde bordado, texto curvo, planeta y órbita),
 * pero con diseño propio: no usa logotipos ni marcas de la NASA.
 */
export default function MissionPatch({ size = 160, title = 'Órbita Arcade' }: { size?: number; title?: string }) {
  const id = useId().replace(/:/g, '')
  const top = `patch-top-${id}`
  const bottom = `patch-bottom-${id}`
  const planet = `patch-planet-${id}`
  const sky = `patch-sky-${id}`

  return (
    <svg className="patch" width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title}>
      <defs>
        <radialGradient id={sky} cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#2a3488" />
          <stop offset="1" stopColor="#0c0d45" />
        </radialGradient>
        <radialGradient id={planet} cx="36%" cy="32%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#75cbd1" />
          <stop offset="0.75" stopColor="#3e5ba3" />
          <stop offset="1" stopColor="#141a5e" />
        </radialGradient>
        {/* Caminos para el texto curvo: arriba en sentido horario, abajo al revés para que se lea derecho. */}
        <path id={top} d="M 30 100 A 70 70 0 0 1 170 100" />
        <path id={bottom} d="M 24 100 A 76 76 0 0 0 176 100" />
      </defs>

      {/* Borde bordado */}
      <circle cx="100" cy="100" r="97" fill="#f2d2ff" />
      <circle cx="100" cy="100" r="91" fill="#0c0d45" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="#75cbd1" strokeWidth="1.5" strokeDasharray="2 3" />

      {/* Campo interior */}
      <circle cx="100" cy="100" r="62" fill={`url(#${sky})`} stroke="#75cbd1" strokeWidth="2" />
      {[
        [72, 70, 1.4],
        [128, 64, 1.1],
        [140, 112, 1.3],
        [64, 122, 1],
        [100, 56, 1],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#dae8fb" />
      ))}

      {/* Órbita y planeta */}
      <circle cx="100" cy="104" r="25" fill={`url(#${planet})`} />
      <circle cx="91" cy="96" r="5" fill="#0c0d45" opacity="0.25" />
      <circle cx="110" cy="112" r="3.4" fill="#0c0d45" opacity="0.22" />
      <ellipse cx="100" cy="104" rx="52" ry="17" fill="none" stroke="#f2d2ff" strokeWidth="2.4" transform="rotate(-18 100 104)" />
      {/* Satélite en la órbita */}
      <g transform="translate(147 86) rotate(-18)">
        <rect x="-4" y="-3" width="8" height="6" rx="1" fill="#dae8fb" />
        <rect x="-13" y="-2" width="8" height="4" fill="#75cbd1" />
        <rect x="5" y="-2" width="8" height="4" fill="#75cbd1" />
      </g>

      {/* Texto del parche */}
      <text className="patch__text" fontSize="15" letterSpacing="3" fill="#f2d2ff">
        <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
          ÓRBITA ARCADE
        </textPath>
      </text>
      <text className="patch__text" fontSize="11" letterSpacing="2.2" fill="#75cbd1">
        <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">
          ★ MISIONES REALES ★
        </textPath>
      </text>
    </svg>
  )
}
