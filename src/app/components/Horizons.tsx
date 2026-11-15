/**
 * Hero scene: two horizons. On the left the Moon, with what Apollo 15 left
 * at Hadley-Apennine (the gold-foil descent stage, the laser retroreflector
 * and the ALSEP station with its seismometer). On the right Mars, with
 * Opportunity, its landing platform and Spirit far away. One low sun sits
 * where the two worlds meet and throws long shadows outward.
 *
 * An illustration, not a photo: authored SVG in one stroke weight,
 * decorative (aria-hidden). The only motion is Earth settling above the
 * lunar horizon on load (see .hz__earth in the stylesheet).
 */

// Deterministic stars: the lunar sky has no air, so they stay sharp.
const STARS = Array.from({ length: 90 }, (_, i) => {
  let h = (i + 7) * 2654435761
  const r = () => ((h = (h ^ (h >>> 13)) * 1274126177) >>> 0) / 4294967296
  const x = r() * 1500
  return { x, y: r() * 250, r: 0.5 + r() * 0.9, o: (0.3 + r() * 0.6) * (x > 820 ? Math.max(0, 1 - (x - 820) / 420) : 1) }
})

const INK = '#07080b'
const GOLD = '#f3b54a'

export default function Horizons() {
  return (
    <svg className="hz" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hz-dusk" cx="1180" cy="330" r="640" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c7a27a" stopOpacity="0.85" />
          <stop offset="0.35" stopColor="#7a5236" stopOpacity="0.6" />
          <stop offset="1" stopColor="#05060a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hz-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.18" stopColor="#dfeaff" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#8fb0e8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8fb0e8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hz-moon" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9ccd2" />
          <stop offset="0.35" stopColor="#7d828b" />
          <stop offset="1" stopColor="#24262b" />
        </linearGradient>
        <linearGradient id="hz-mars" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d48a5a" />
          <stop offset="0.4" stopColor="#8f4a2a" />
          <stop offset="1" stopColor="#2e150c" />
        </linearGradient>
        <linearGradient id="hz-foil" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe19a" />
          <stop offset="0.45" stopColor={GOLD} />
          <stop offset="1" stopColor="#6e4c10" />
        </linearGradient>
        <linearGradient id="hz-seam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b0c0f" stopOpacity="0" />
          <stop offset="0.5" stopColor="#0b0c0f" stopOpacity="0.9" />
          <stop offset="1" stopColor="#0b0c0f" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ---- Skies: black over the Moon, dusty dusk over Mars ---- */}
      <rect x="0" y="0" width="1600" height="330" fill="url(#hz-dusk)" />
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4ecdc" opacity={s.o} />
      ))}

      {/* Earth above the lunar horizon */}
      <g className="hz__earth">
        <circle cx="470" cy="84" r="30" fill="#2f6fd0" />
        <path d="M452 64c10-6 24-4 30 4s-2 16-10 18-22-2-24-10 0-9 4-12ZM482 92c8-2 14 2 14 8s-8 10-14 8-6-12 0-16Z" fill="#e9f1fb" opacity="0.85" />
        <path d="M470 54a30 30 0 0 0 0 60 38 38 0 0 1 0-60Z" fill={INK} opacity="0.72" />
      </g>

      {/* The low sun between the two worlds (a Martian sunset is blue near the Sun) */}
      <circle cx="800" cy="298" r="112" fill="url(#hz-sun)" />

      {/* ---- Ground ---- */}
      <path d="M0 312c120-14 260-20 420-16s270 4 400 2v122H0Z" fill="url(#hz-moon)" />
      <path d="M800 298c90-10 150 6 250-4s190-22 300-10 180 8 250 2v134H800Z" fill="url(#hz-mars)" />
      <rect x="690" y="286" width="220" height="134" fill="url(#hz-seam)" />
      {/* Far Martian dunes */}
      <path d="M980 300c60-22 110-22 170-4M1260 290c70-20 150-16 220 6" fill="none" stroke="#f0b48a" strokeOpacity="0.35" strokeWidth="2" />
      {/* Craters and rocks */}
      <g fill={INK} opacity="0.35">
        <ellipse cx="120" cy="372" rx="60" ry="9" />
        <ellipse cx="430" cy="396" rx="44" ry="6" />
        <ellipse cx="640" cy="350" rx="30" ry="4" />
        <ellipse cx="1180" cy="388" rx="26" ry="5" />
        <ellipse cx="1420" cy="364" rx="18" ry="4" />
        <ellipse cx="930" cy="402" rx="34" ry="5" />
      </g>

      {/* Long shadows thrown away from the sun */}
      <g fill={INK} opacity="0.5">
        <path d="M540 372 320 398l-6-10 216-24Z" />
        <path d="M430 366 288 384l-4-7 140-16Z" />
        <path d="M1060 372l250 26 6-10-250-24Z" />
      </g>

      {/* Rover tracks on the Moon and wheel tracks on Mars */}
      <g fill="none" stroke={INK} strokeOpacity="0.4" strokeWidth="3" strokeDasharray="2 9">
        <path d="M0 404c120-10 240-18 420-30" />
        <path d="M0 414c130-10 260-20 440-32" />
      </g>
      <g fill="none" stroke="#2e150c" strokeOpacity="0.6" strokeWidth="4">
        <path d="M1102 372c130 14 260 22 498 26" />
        <path d="M1102 382c130 14 260 22 498 28" />
      </g>

      {/* ============ MOON ============ */}

      {/* ALSEP central station with antenna, and the seismometer under its shroud */}
      <g transform="translate(230 336)">
        <path d="M-30 30h60l-8-26h-44Z" fill={INK} />
        <path d="M22 4l8 26" stroke={GOLD} strokeWidth="2" />
        <path d="M0 4v-44M-12-40h24M0-40l14-12" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="74" cy="30" rx="34" ry="7" fill={INK} />
        <path d="M54 28c2-16 38-16 40 0Z" fill={INK} />
        <path d="M92 26c-2-10-10-14-18-14" stroke={GOLD} strokeWidth="2" fill="none" />
        <path d="M30 26c14 2 18 2 24 2" stroke={INK} strokeWidth="2" fill="none" />
      </g>

      {/* Laser retroreflector: a tilted panel of corner cubes */}
      <g transform="translate(430 348)">
        <path d="M-26 6l44-22 10 14-44 22Z" fill={INK} />
        <path d="M18-16l10 14" stroke={GOLD} strokeWidth="2.5" />
        <path d="M-15 0l10 14M-4-6l10 14M7-11l10 14" stroke="#4a4f58" strokeWidth="1.5" />
        <path d="M-16 20v8M12 6v10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Apollo 15 descent stage: gold foil, four legs, ladder */}
      <g transform="translate(590 300)">
        <path d="M-58 62 -40 20M58 62 40 20M-20 64-8 22M20 64 8 22" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M-70 64h24M46 64h24M-30 66h20M10 66h20" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M-44-14h88l12 18-12 22h-88l-12-22Z" fill="url(#hz-foil)" />
        <path d="M-44-14h44v40h-44l-12-22Z" fill={INK} opacity="0.5" />
        <path d="M-56 4h112M0-14v40" stroke={INK} strokeOpacity="0.45" strokeWidth="1.5" />
        <rect x="-16" y="-24" width="32" height="10" fill={INK} />
        <path d="M44-14l12 18-12 22" stroke="#fff3d0" strokeWidth="2" fill="none" />
        <path d="M-40 24l-16 38M-34 34l-12 0M-38 44l-12 0M-42 54l-12 0" stroke={INK} strokeWidth="2.5" />
      </g>

      {/* ============ MARS ============ */}

      {/* Opportunity: solar deck, camera mast, arm, three wheels on this side */}
      <g transform="translate(1010 322)">
        <path d="M-66 12 4-2l70 12-70 12Z" fill={INK} />
        <path d="M-66 12 4-2" stroke={GOLD} strokeWidth="2.5" />
        <path d="M-44 14 6 4l48 9" stroke="#3a3f47" strokeWidth="1.5" fill="none" />
        <rect x="-26" y="14" width="56" height="16" rx="2" fill={INK} />
        <path d="M-10 4v-58" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <rect x="-24" y="-66" width="28" height="13" rx="2" fill={INK} />
        <path d="M-24-66v13" stroke={GOLD} strokeWidth="2.5" />
        <circle cx="-16" cy="-59.5" r="2.4" fill="#8fb0e8" />
        <path d="M-26 24l-30 8-10 14" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M-18 30l-18 18M6 30v18M30 28l18 20" stroke={INK} strokeWidth="4" strokeLinecap="round" />
        <g fill={INK}>
          <circle cx="-38" cy="52" r="11" />
          <circle cx="6" cy="52" r="11" />
          <circle cx="50" cy="52" r="11" />
        </g>
        <g fill="none" stroke={GOLD} strokeWidth="2">
          <path d="M-49 52a11 11 0 0 1 4-8.5" />
          <path d="M-5 52a11 11 0 0 1 4-8.5" />
          <path d="M39 52a11 11 0 0 1 4-8.5" />
        </g>
      </g>

      {/* Landing platform with its open petals and deflated airbags */}
      <g transform="translate(1300 356)">
        <path d="M-70 22c8-12 26-14 36-6 6-10 24-12 34-2 10-10 28-8 34 2 10-8 28-6 36 6Z" fill="#3b1d10" />
        <path d="M-52 16 -14-2h28l38 18Z" fill={INK} />
        <path d="M-14-2 0-34l14 32Z" fill={INK} />
        <path d="M-52 16-14-2M0-34-14-2" stroke={GOLD} strokeWidth="2" fill="none" />
      </g>

      {/* Spirit, far away, tilted in soft soil */}
      <g transform="translate(1486 330) rotate(7) scale(0.52)">
        <path d="M-66 12 4-2l70 12-70 12Z" fill={INK} />
        <rect x="-26" y="14" width="56" height="16" rx="2" fill={INK} />
        <path d="M-10 4v-58" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <rect x="-24" y="-66" width="28" height="13" rx="2" fill={INK} />
        <path d="M-66 12 4-2" stroke={GOLD} strokeWidth="3" />
        <g fill={INK}>
          <circle cx="-38" cy="50" r="11" />
          <circle cx="6" cy="52" r="11" />
          <circle cx="50" cy="56" r="11" />
        </g>
      </g>
      <path d="M1440 372c30 6 60 8 100 6" stroke="#f3e2d2" strokeOpacity="0.5" strokeWidth="3" fill="none" />
    </svg>
  )
}
