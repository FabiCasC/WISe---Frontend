import type { IconKind } from '../../content/archive'

/**
 * Pictogramas de la rejilla. Formas sólidas y gruesas: tienen que leerse a
 * 48 px en un móvil. Usan currentColor para heredar el tono de la ficha.
 */
const PATHS: Record<IconKind, JSX.Element> = {
  rover: (
    <>
      <rect x="3" y="4.5" width="18" height="2" rx="1" />
      <rect x="7" y="8" width="10" height="5" rx="1.2" />
      <rect x="11.2" y="6.5" width="1.6" height="2" />
      <rect x="10" y="1.5" width="4" height="2.4" rx="0.8" />
      <circle cx="6.5" cy="17" r="2.6" />
      <circle cx="12" cy="17" r="2.6" />
      <circle cx="17.5" cy="17" r="2.6" />
      <rect x="6" y="13" width="12" height="1.4" rx="0.7" />
    </>
  ),
  lander: (
    <>
      <path d="M7 7h10l1.5 6h-13z" />
      <rect x="9.5" y="3.5" width="5" height="3" rx="1" />
      <path d="M5.2 13.6 2.6 20h2.2l2.3-5.6zM18.8 13.6 21.4 20h-2.2l-2.3-5.6z" />
      <path d="M9 13.5h6v5.5h-1.6v-4H10.6v4H9z" />
    </>
  ),
  orbiter: (
    <>
      <rect x="9" y="8" width="6" height="8" rx="1.2" />
      <rect x="1" y="9.6" width="7" height="4.8" rx="0.8" />
      <rect x="16" y="9.6" width="7" height="4.8" rx="0.8" />
      <circle cx="12" cy="5" r="2.2" />
      <rect x="11.3" y="6.5" width="1.4" height="2" />
    </>
  ),
  /* Sonda de espacio profundo: antena parabólica, bus hexagonal y pértiga. */
  probe: (
    <>
      <path d="M13 1.6a7.4 7.4 0 0 1 7.4 7.4H5.6A7.4 7.4 0 0 1 13 1.6Z" />
      <rect x="12" y="9" width="2" height="3.4" />
      <path d="M13 12 17.4 14.4v4.8L13 21.6 8.6 19.2v-4.8z" />
      <rect x="1.2" y="14.4" width="7.6" height="1.7" rx="0.85" />
      <circle cx="2.4" cy="15.2" r="2.1" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 1.5c2.6 2.4 4 5.8 4 9.5v4H8v-4c0-3.7 1.4-7.1 4-9.5Z" />
      <circle cx="12" cy="8.5" r="1.8" fill="#0b1b2e" />
      <path d="M8 13 5 17v3l3-2.4zM16 13l3 4v3l-3-2.4z" />
      <path d="M10.4 16.5h3.2L12 22z" />
    </>
  ),
  telescope: (
    <>
      <path d="M3.2 12.6 15.6 5.4l2.4 4.2L5.6 16.8z" />
      <rect x="17" y="7.8" width="4.6" height="4" rx="1" transform="rotate(30 17 7.8)" />
      <rect x="8.4" y="14.2" width="2" height="7" rx="0.9" transform="rotate(30 8.4 14.2)" />
      <rect x="4" y="18" width="9" height="1.8" rx="0.9" />
    </>
  ),
  station: (
    <>
      <rect x="10" y="4" width="4" height="16" rx="1.2" />
      <rect x="1.5" y="6" width="7" height="4" rx="0.8" />
      <rect x="1.5" y="14" width="7" height="4" rx="0.8" />
      <rect x="15.5" y="6" width="7" height="4" rx="0.8" />
      <rect x="15.5" y="14" width="7" height="4" rx="0.8" />
    </>
  ),
  capsule: (
    <>
      <path d="M12 3c3.6 0 6.6 4 7.2 9H4.8C5.4 7 8.4 3 12 3Z" />
      <rect x="4" y="13.5" width="16" height="3.2" rx="1.2" />
      <rect x="7" y="18" width="10" height="2.4" rx="1.2" />
    </>
  ),
  reflector: (
    <>
      <path d="M4 15.5 8 6h12l-4 9.5z" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <circle key={`${r}-${c}`} cx={9 + c * 2.6 - r * 0.9} cy={8.2 + r * 2.6} r="0.9" fill="#0b1b2e" />
        )),
      )}
      <rect x="4" y="16.5" width="12" height="2" rx="1" />
    </>
  ),
  seismo: (
    <>
      <rect x="8" y="8" width="8" height="7" rx="1.4" />
      <path d="M6 15h12l1.4 4H4.6z" />
      <rect x="11.2" y="2.5" width="1.6" height="5.5" rx="0.8" />
      <circle cx="12" cy="2" r="1.8" />
      <path d="M2 20.5q1.6-2.4 3.2 0t3.2 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  copter: (
    <>
      <rect x="2" y="5" width="20" height="1.7" rx="0.85" />
      <rect x="2" y="9" width="20" height="1.7" rx="0.85" />
      <rect x="11.2" y="6" width="1.6" height="7" />
      <rect x="8.5" y="12.5" width="7" height="4.6" rx="1.2" />
      <rect x="7" y="18.5" width="10" height="1.6" rx="0.8" />
      <rect x="9.5" y="17" width="1.4" height="2" />
      <rect x="13.1" y="17" width="1.4" height="2" />
    </>
  ),
  balloon: (
    <>
      <circle cx="12" cy="8.5" r="6.5" />
      <path d="M9.4 14.6 10.8 17h2.4l1.4-2.4z" />
      <rect x="9" y="17" width="6" height="4" rx="1.2" />
    </>
  ),
  impactor: (
    <>
      <path d="M12 2 15 9H9z" />
      <rect x="10.6" y="8.5" width="2.8" height="4.5" />
      <path d="M12 14.5 20 20H4z" opacity="0.55" />
      <circle cx="12" cy="14.6" r="2.4" />
    </>
  ),
  satellite: (
    <>
      <rect x="9" y="9.5" width="6" height="6" rx="1.2" />
      <rect x="2.5" y="10.6" width="5.5" height="3.8" rx="0.8" />
      <rect x="16" y="10.6" width="5.5" height="3.8" rx="0.8" />
      <path d="M12 9.5V5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8.6 5.2a5 5 0 0 1 6.8 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 15.5V20" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </>
  ),
  flag: (
    <>
      <rect x="5.5" y="2" width="1.9" height="19" rx="0.9" />
      <path d="M7.4 3h11v7.5h-11z" />
      <rect x="3.5" y="19.4" width="6" height="1.8" rx="0.9" />
    </>
  ),
  sample: (
    <>
      <rect x="8.5" y="2.5" width="7" height="3" rx="1.2" />
      <path d="M9.4 6h5.2v12a2.6 2.6 0 0 1-5.2 0z" />
      <rect x="10.4" y="12" width="3.2" height="6" rx="1.4" fill="#0b1b2e" />
    </>
  ),
  asteroid: (
    <>
      <path d="M11 2.6 18.4 5l3 6.2-2.4 6.6-6.6 2.6-6.8-3L3 9.6l3.4-5.4z" />
      <circle cx="10" cy="9" r="2" fill="#0b1b2e" />
      <circle cx="15.5" cy="13.5" r="1.5" fill="#0b1b2e" />
      <circle cx="8.5" cy="15" r="1.1" fill="#0b1b2e" />
    </>
  ),
  comet: (
    <>
      <circle cx="16.5" cy="7.5" r="4.5" />
      <path d="M13.4 10.8 3 21.2l2.6-9.4z" opacity="0.75" />
      <path d="M12.2 7.6 1.6 11l8-5.4z" opacity="0.45" />
    </>
  ),
}

export default function TileIcon({ kind, size = 28 }: { kind: IconKind; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[kind]}
    </svg>
  )
}
