/**
 * Hero backdrop: a black hole in the style of the film "Interstellar".
 * The accretion disk passes in front of the event horizon, and the light
 * of the disk behind it is bent over the top and under the bottom
 * (gravitational lensing). Pure SVG, decorative (aria-hidden). The slow
 * shimmer stops with reduced motion (see .bh rules in interstellar.css).
 */

// Deterministic star field so the sky never changes between visits.
const STARS = Array.from({ length: 140 }, (_, i) => {
  let h = (i + 1) * 2654435761
  const r = () => ((h = (h ^ (h >>> 13)) * 1274126177) >>> 0) / 4294967296
  return { x: r() * 1600, y: r() * 760, r: r() < 0.08 ? 1.6 : 0.5 + r() * 0.8, o: 0.25 + r() * 0.65 }
})

export default function BlackHole() {
  const cx = 800
  const cy = 430
  const R = 150 // event horizon radius

  return (
    <svg className="bh" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="bh-glow" cx="50%" cy="56%" r="60%">
          <stop offset="0" stopColor="#ff9a3c" stopOpacity="0.32" />
          <stop offset="0.35" stopColor="#b85a14" stopOpacity="0.14" />
          <stop offset="1" stopColor="#05060a" stopOpacity="0" />
        </radialGradient>
        {/* Disk: hot white-gold in the middle, fading to amber at the edges. */}
        <linearGradient id="bh-disk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff8f3c" stopOpacity="0" />
          <stop offset="0.18" stopColor="#ff9f45" stopOpacity="0.55" />
          <stop offset="0.38" stopColor="#ffd38a" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#fff4dc" stopOpacity="1" />
          <stop offset="0.62" stopColor="#ffd38a" stopOpacity="0.95" />
          <stop offset="0.82" stopColor="#ff9f45" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff8f3c" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="bh-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0.82" stopColor="#ffcf80" stopOpacity="0" />
          <stop offset="0.9" stopColor="#ffd998" stopOpacity="0.95" />
          <stop offset="0.95" stopColor="#ff9f45" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff8f3c" stopOpacity="0" />
        </radialGradient>
        <filter id="bh-soft" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="bh-softer" x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id="bh-front">
          <rect x="0" y={cy} width="1600" height="400" />
        </clipPath>
      </defs>

      <rect width="1600" height="760" fill="#05060a" />
      <g className="bh__stars">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f4ecdc" opacity={s.o} />
        ))}
      </g>
      <rect width="1600" height="760" fill="url(#bh-glow)" />

      {/* Disk behind the hole */}
      <g className="bh__shimmer">
        <ellipse cx={cx} cy={cy} rx="620" ry="60" fill="url(#bh-disk)" filter="url(#bh-softer)" opacity="0.7" />
        <ellipse cx={cx} cy={cy} rx="520" ry="26" fill="url(#bh-disk)" filter="url(#bh-soft)" />
      </g>

      {/* Lensed light bent around the horizon */}
      <circle cx={cx} cy={cy} r={R * 1.32} fill="url(#bh-halo)" filter="url(#bh-soft)" />
      <circle cx={cx} cy={cy} r={R * 1.06} fill="none" stroke="#ffe7b8" strokeWidth="3" opacity="0.9" />

      {/* Event horizon */}
      <circle cx={cx} cy={cy} r={R} fill="#000" />

      {/* Front of the disk, crossing in front of the horizon */}
      <g clipPath="url(#bh-front)" className="bh__shimmer">
        <ellipse cx={cx} cy={cy} rx="520" ry="26" fill="url(#bh-disk)" filter="url(#bh-soft)" />
        <ellipse cx={cx} cy={cy} rx="440" ry="10" fill="url(#bh-disk)" />
      </g>
      <ellipse cx={cx} cy={cy - 2} rx="440" ry="6" fill="url(#bh-disk)" opacity="0.9" />
    </svg>
  )
}
