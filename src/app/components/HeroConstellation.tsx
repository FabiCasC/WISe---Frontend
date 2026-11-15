import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  twinklePhase: number
  twinkleSpeed: number
  glowBoost: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  length: number
  life: number
  decay: number
}

const STAR_COLORS = [
  '#ffffff',
  '#e6f0ff',
  '#d2e4ff',
  '#fae2bc',
  '#bfe8ff',
  '#f3b54a',
]

interface Props {
  reducedMotion?: boolean
}

/**
 * HeroConstellation:
 * Interactive celestial starfield with living constellation lines connecting
 * nearby stars and stretching to the mouse cursor on hover.
 *
 * Sits seamlessly in the upper deep space of the hero band (.band), preserving
 * all layout, typography, controls, and authored horizon illustrations intact.
 */
export default function HeroConstellation({ reducedMotion = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const band = container.parentElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let stars: Star[] = []
    let shooters: ShootingStar[] = []
    let raf = 0
    let running = true

    const mouse = {
      x: -9999,
      y: -9999,
      targetX: -9999,
      targetY: -9999,
      alpha: 0,
      targetAlpha: 0,
    }

    const build = () => {
      const rect = container.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Calibrated star count: dense enough to feel expansive, elegant enough to avoid clutter
      const count = Math.min(130, Math.max(50, Math.round((width * height) / 9000)))

      stars = Array.from({ length: count }, () => {
        const isProminent = Math.random() < 0.14
        const r = isProminent
          ? 1.9 + Math.random() * 0.9
          : 0.55 + Math.random() * 1.15
        const color =
          STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.16,
          r,
          color,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.8 + Math.random() * 1.6,
          glowBoost: 0,
        }
      })
    }

    const spawnShooter = () => {
      if (reducedMotion || shooters.length >= 2 || width <= 1) return
      const fromLeft = Math.random() > 0.4
      const startX = fromLeft
        ? Math.random() * (width * 0.6)
        : width * 0.4 + Math.random() * (width * 0.6)
      const startY = Math.random() * (height * 0.35)
      const angle = (Math.PI / 6) + (Math.random() - 0.5) * 0.25
      const speed = 9 + Math.random() * 7

      shooters.push({
        x: startX,
        y: startY,
        vx: (fromLeft ? 1 : -0.75) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 100 + Math.random() * 90,
        life: 1,
        decay: 0.012 + Math.random() * 0.008,
      })
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.16
      mouse.y += (mouse.targetY - mouse.y) * 0.16
      mouse.alpha += (mouse.targetAlpha - mouse.alpha) * 0.08

      const MOUSE_RADIUS = 170
      const STAR_MAX_DIST = 96
      const STAR_MAX_DIST_SQ = STAR_MAX_DIST * STAR_MAX_DIST

      // 1. Mouse starlight aura
      if (!reducedMotion && mouse.alpha > 0.01) {
        const aura = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          MOUSE_RADIUS * 0.9,
        )
        aura.addColorStop(0, `rgba(243, 181, 74, ${0.12 * mouse.alpha})`)
        aura.addColorStop(0.35, `rgba(180, 225, 255, ${0.045 * mouse.alpha})`)
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * 0.9, 0, Math.PI * 2)
        ctx.fill()
      }

      // 2. Inter-star constellation lines
      const starCount = stars.length
      for (let i = 0; i < starCount; i++) {
        const sA = stars[i]
        for (let j = i + 1; j < starCount; j++) {
          const sB = stars[j]
          const dx = sA.x - sB.x
          const dy = sA.y - sB.y
          if (Math.abs(dx) > STAR_MAX_DIST || Math.abs(dy) > STAR_MAX_DIST) continue

          const dSq = dx * dx + dy * dy
          if (dSq < STAR_MAX_DIST_SQ) {
            const dist = Math.sqrt(dSq)
            const norm = 1 - dist / STAR_MAX_DIST
            let lineAlpha = norm * 0.12

            // Active mouse proximity illuminates and reveals constellation bonds
            if (!reducedMotion && mouse.alpha > 0.01) {
              const dMA = Math.hypot(sA.x - mouse.x, sA.y - mouse.y)
              const dMB = Math.hypot(sB.x - mouse.x, sB.y - mouse.y)
              const nearMouse = Math.min(dMA, dMB)
              if (nearMouse < MOUSE_RADIUS) {
                const boost =
                  (1 - nearMouse / MOUSE_RADIUS) * 0.36 * mouse.alpha
                lineAlpha = Math.min(0.5, lineAlpha + boost)
              }
            }

            ctx.beginPath()
            ctx.moveTo(sA.x, sA.y)
            ctx.lineTo(sB.x, sB.y)
            ctx.strokeStyle = `rgba(205, 228, 255, ${lineAlpha})`
            ctx.lineWidth = 0.85
            ctx.stroke()
          }
        }
      }

      // 3. Mouse to star connections & Star rendering
      for (const s of stars) {
        if (!reducedMotion) {
          // Floating cosmic drift
          s.x += s.vx
          s.y += s.vy

          // Seamless edge wrapping with margin
          if (s.x < -15) s.x = width + 15
          else if (s.x > width + 15) s.x = -15
          if (s.y < -15) s.y = height + 15
          else if (s.y > height + 15) s.y = -15

          // Decay starlight boost
          s.glowBoost *= 0.92
        }

        // Distance to cursor
        let proximity = 0
        if (!reducedMotion && mouse.alpha > 0.01) {
          const dx = s.x - mouse.x
          const dy = s.y - mouse.y
          const d = Math.hypot(dx, dy)
          if (d < MOUSE_RADIUS) {
            proximity = 1 - d / MOUSE_RADIUS
            s.glowBoost = Math.max(s.glowBoost, proximity)

            // Connect subtle glowing line between cursor and star
            const lineAlpha =
              Math.pow(proximity, 1.25) * 0.44 * mouse.alpha
            const grad = ctx.createLinearGradient(
              mouse.x,
              mouse.y,
              s.x,
              s.y,
            )
            grad.addColorStop(0, `rgba(243, 181, 74, ${lineAlpha * 1.15})`)
            grad.addColorStop(1, `rgba(215, 235, 255, ${lineAlpha * 0.85})`)

            ctx.beginPath()
            ctx.moveTo(mouse.x, mouse.y)
            ctx.lineTo(s.x, s.y)
            ctx.strokeStyle = grad
            ctx.lineWidth = 0.95 + proximity * 0.6
            ctx.stroke()

            // Micro-gravity floating reaction
            s.x += (mouse.x - s.x) * 0.0028 * proximity
            s.y += (mouse.y - s.y) * 0.0028 * proximity
          }
        }

        // Natural celestial twinkling
        const twinkle = reducedMotion
          ? 0.85
          : 0.58 +
            0.42 *
              Math.sin(t * 0.0016 * s.twinkleSpeed + s.twinklePhase)

        // Fade gracefully as approaching the very bottom horizon edge
        const bottomFade =
          s.y > height * 0.74
            ? Math.max(0.18, 1 - (s.y - height * 0.74) / (height * 0.26))
            : 1

        const baseAlpha =
          Math.min(1, twinkle * 0.85 + s.glowBoost * 0.55) * bottomFade

        // Star core
        ctx.beginPath()
        ctx.arc(
          s.x,
          s.y,
          s.r * (1 + s.glowBoost * 0.35),
          0,
          Math.PI * 2,
        )
        ctx.fillStyle = s.color
        ctx.globalAlpha = Math.max(0.08, baseAlpha)
        ctx.fill()

        // Starlight halo for prominent stars or cursor-excited stars
        if (s.r > 1.8 || s.glowBoost > 0.22) {
          ctx.beginPath()
          ctx.arc(
            s.x,
            s.y,
            s.r * (3.8 + s.glowBoost * 2.2),
            0,
            Math.PI * 2,
          )
          ctx.fillStyle = s.color
          ctx.globalAlpha = baseAlpha * (0.16 + s.glowBoost * 0.2)
          ctx.fill()
        }
      }

      // 4. Subtle mouse cursor beacon
      if (!reducedMotion && mouse.alpha > 0.02) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = 0.65 * mouse.alpha
        ctx.fill()
      }

      // 5. Shooting stars
      if (!reducedMotion) {
        shooters = shooters.filter((sh) => sh.life > 0)
        for (const sh of shooters) {
          sh.x += sh.vx
          sh.y += sh.vy
          sh.life -= sh.decay

          const distSpeed = Math.hypot(sh.vx, sh.vy)
          const tailX = sh.x - (sh.vx / distSpeed) * sh.length
          const tailY = sh.y - (sh.vy / distSpeed) * sh.length

          const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY)
          grad.addColorStop(0, `rgba(255, 255, 255, ${Math.max(0, sh.life)})`)
          grad.addColorStop(
            0.25,
            `rgba(243, 181, 74, ${Math.max(0, sh.life * 0.75)})`,
          )
          grad.addColorStop(
            0.6,
            `rgba(180, 230, 255, ${Math.max(0, sh.life * 0.35)})`,
          )
          grad.addColorStop(1, 'rgba(180, 230, 255, 0)')

          ctx.beginPath()
          ctx.moveTo(sh.x, sh.y)
          ctx.lineTo(tailX, tailY)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.8
          ctx.lineCap = 'round'
          ctx.globalAlpha = 1
          ctx.stroke()

          // Meteor spark head
          ctx.beginPath()
          ctx.arc(sh.x, sh.y, 1.8, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.globalAlpha = Math.max(0, sh.life)
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
    }

    const loop = (t: number) => {
      if (!running) return
      draw(t)
      raf = requestAnimationFrame(loop)
    }

    // Pointer events on the parent .band section
    const onPointerMove = (e: PointerEvent) => {
      if (!band) return
      const rect = band.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (
        x >= -20 &&
        x <= rect.width + 20 &&
        y >= -20 &&
        y <= rect.height + 20
      ) {
        mouse.targetX = x
        mouse.targetY = y
        mouse.targetAlpha = 1
      } else {
        mouse.targetAlpha = 0
      }
    }

    const onPointerLeave = () => {
      mouse.targetAlpha = 0
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!reducedMotion) {
        running = true
        raf = requestAnimationFrame(loop)
      }
    }

    build()

    // ResizeObserver ensures seamless response to layout and window changes
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          build()
          if (reducedMotion) draw(0)
        }
      }
    })
    ro.observe(container)

    let shooterTimer = 0
    if (reducedMotion) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
      shooterTimer = window.setInterval(spawnShooter, 5200)

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('blur', onPointerLeave)
      window.addEventListener('pointerup', onPointerLeave, { passive: true })
      document.addEventListener('mouseleave', onPointerLeave)
    }

    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearInterval(shooterTimer)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', onPointerLeave)
      window.removeEventListener('pointerup', onPointerLeave)
      document.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  return (
    <div ref={containerRef} className="band__sky" aria-hidden="true">
      <canvas ref={canvasRef} className="band__sky-canvas" />
    </div>
  )
}
