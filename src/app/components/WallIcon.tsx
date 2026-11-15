import type { WallIcon as WallIconName } from '../../content/games'

/** Simple line icons for game tiles (48×48, stroke uses currentColor). */
const PATHS: Record<WallIconName, JSX.Element> = {
  rover: (
    <>
      <rect x="10" y="18" width="28" height="10" rx="2" />
      <path d="M24 18v-7M19 11h10M14 28l-3 7M34 28l3 7" />
      <circle cx="11" cy="37" r="4" />
      <circle cx="24" cy="37" r="4" />
      <circle cx="37" cy="37" r="4" />
    </>
  ),
  moon: (
    <>
      <circle cx="24" cy="24" r="16" />
      <circle cx="18" cy="19" r="3.5" />
      <circle cx="29" cy="29" r="5" />
      <circle cx="30" cy="16" r="2" />
    </>
  ),
  rocket: (
    <>
      <path d="M24 5c7 5 10 13 10 22l-4 7H18l-4-7c0-9 3-17 10-22Z" />
      <circle cx="24" cy="20" r="3.5" />
      <path d="M18 34l-5 6 1-9M30 34l5 6-1-9M21 40h6" />
    </>
  ),
  scope: (
    <>
      <path d="M8 24l26-12 4 9-26 12Z" />
      <path d="M20 30l-6 12M24 28l6 14" />
      <circle cx="38" cy="16" r="3" />
    </>
  ),
  sat: (
    <>
      <rect x="19" y="19" width="10" height="10" rx="1" />
      <path d="M6 14h11v20H6zM31 14h11v20H31zM24 19v-8M20 8h8" />
    </>
  ),
  planet: (
    <>
      <circle cx="24" cy="24" r="11" />
      <ellipse cx="24" cy="24" rx="21" ry="7" transform="rotate(-20 24 24)" />
    </>
  ),
  sun: (
    <>
      <circle cx="24" cy="24" r="9" />
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4 4M33.5 33.5l4 4M10.5 37.5l4-4M33.5 14.5l4-4" />
    </>
  ),
  comet: (
    <>
      <circle cx="33" cy="15" r="7" />
      <path d="M28 20 8 40M26 15 10 27M33 22 23 38" />
    </>
  ),
  astro: (
    <>
      <circle cx="24" cy="16" r="9" />
      <path d="M19 15h10M13 42v-8c0-6 5-9 11-9s11 3 11 9v8" />
      <rect x="19" y="30" width="10" height="6" rx="1" />
    </>
  ),
  wave: <path d="M4 24h6l4-10 6 22 6-26 6 22 4-8h8" />,
  station: (
    <>
      <rect x="18" y="20" width="12" height="8" rx="2" />
      <path d="M4 12h10v24H4zM34 12h10v24H34zM14 24h4M30 24h4M24 20v-8" />
    </>
  ),
  earth: (
    <>
      <circle cx="24" cy="24" r="17" />
      <path d="M12 15c5 2 6 6 4 9s1 7 5 8M30 8c-2 5 1 7 5 7s5 5 3 9-1 9-6 10" />
    </>
  ),
}

export default function WallIcon({ name, size }: { name: WallIconName; size?: number | string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
