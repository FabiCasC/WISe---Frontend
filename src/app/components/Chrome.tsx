import { useId } from 'react'

/* =========================================================================
   LIQUID CHROME (Y2K)
   -------------------------------------------------------------------------
   The metal look comes from two layers:
   1. A "reflected horizon" gradient: bright sky on top, a sharp dark band
      in the middle, pale ground below — how polished chrome reflects.
   2. An SVG specular-lighting filter on a blurred alpha mask, which turns
      flat shapes into rounded, bevelled 3D surfaces with highlights.
   Everything here is decorative (aria-hidden); readable text lives in HTML.
   ========================================================================= */

function ChromeDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.15" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.22" stopColor="#dce6ee" />
        <stop offset="0.42" stopColor="#8e9bab" />
        <stop offset="0.5" stopColor="#2f3842" />
        <stop offset="0.56" stopColor="#aeb9c5" />
        <stop offset="0.74" stopColor="#f5f8fa" />
        <stop offset="1" stopColor="#b8c3ce" />
      </linearGradient>
      <filter id={`${id}-bevel`} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
        <feSpecularLighting
          in="blur"
          surfaceScale="7"
          specularConstant="1.15"
          specularExponent="24"
          lightingColor="#ffffff"
          result="spec"
        >
          <fePointLight x="-120" y="-220" z="260" />
        </feSpecularLighting>
        <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
        <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.9" k4="0" result="lit" />
        <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#0e1116" floodOpacity="0.22" />
      </filter>
    </defs>
  )
}

export type ChromeKind = 'blob' | 'ring' | 'star' | 'drop' | 'wave'

const PATHS: Record<Exclude<ChromeKind, 'ring'>, string> = {
  // Soft liquid blob
  blob: 'M108 22c34 6 62 30 66 64 4 32-14 54-38 68-26 15-60 22-86 6C24 146 10 118 18 88 26 52 70 15 108 22Z',
  // Four-point Y2K sparkle
  star: 'M100 8C106 62 118 86 192 100 118 114 106 138 100 192 94 138 82 114 8 100 82 86 94 62 100 8Z',
  // Falling droplet
  drop: 'M100 12C120 58 160 92 160 132a60 60 0 1 1-120 0c0-40 40-74 60-120Z',
  // Melting wave / squiggle
  wave: 'M14 120c18-44 46-66 74-52s30 54 58 52 34-46 46-60c8 18 4 52-14 74-26 32-62 26-86 10-20-13-36-30-52-6-8 12-24 4-26-18Z',
}

/** A floating chrome shape. Size in px; it scales with the viewBox. */
export function ChromeShape({
  kind,
  size = 120,
  className = '',
  style,
}: {
  kind: ChromeKind
  size?: number
  className?: string
  style?: React.CSSProperties
}) {
  const id = `chr${useId().replace(/:/g, '')}`
  return (
    <svg
      className={`chrome ${className}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <ChromeDefs id={id} />
      <g filter={`url(#${id}-bevel)`}>
        {kind === 'ring' ? (
          <path
            fillRule="evenodd"
            fill={`url(#${id}-metal)`}
            d="M100 30c50 0 86 30 86 70s-36 70-86 70-86-30-86-70 36-70 86-70Zm0 34c-30 0-52 16-52 36s22 36 52 36 52-16 52-36-22-36-52-36Z"
          />
        ) : (
          <path fill={`url(#${id}-metal)`} d={PATHS[kind]} />
        )}
      </g>
    </svg>
  )
}

/**
 * Chrome script word drawn in SVG so the bevel filter applies to the
 * letters. The visible word is decorative; pass the real heading as HTML.
 */
export function ChromeWord({ text, width = 640, height = 220 }: { text: string; width?: number; height?: number }) {
  const id = `chw${useId().replace(/:/g, '')}`
  return (
    <svg
      className="chrome-word"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <ChromeDefs id={id} />
      <text
        x="50%"
        y="66%"
        textAnchor="middle"
        fontFamily="Yellowtail, 'Brush Script MT', cursive"
        fontSize={height * 0.82}
        fill={`url(#${id}-metal)`}
        stroke="#ffffff"
        strokeWidth="1.5"
        filter={`url(#${id}-bevel)`}
      >
        {text}
      </text>
    </svg>
  )
}

/** Crosshair registration mark (poster detail). */
export function Crosshair({ size = 22 }: { size?: number }) {
  return (
    <svg className="crosshair" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 1v22M1 12h22" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/** Decorative barcode strip, generated from a word so it never changes. */
export function Barcode({ seed, bars = 34 }: { seed: string; bars?: number }) {
  let h = 7
  const widths = Array.from({ length: bars }, (_, i) => {
    h = (h * 31 + seed.charCodeAt(i % seed.length)) % 997
    return 1 + (h % 3)
  })
  let x = 0
  return (
    <svg className="barcode" height="14" viewBox={`0 0 ${widths.reduce((a, w) => a + w + 1, 0)} 14`} aria-hidden="true" focusable="false">
      {widths.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="14" fill="currentColor" /> : null
        x += w + 1
        return rect
      })}
    </svg>
  )
}
