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
  isProminent: boolean
}

interface RocketParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  color: string
}

interface Rocket {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  scale: number
  speed: number
  flameLength: number
  particles: RocketParticle[]
  life: number
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
  '#e2eeff',
  '#cfe2ff',
  '#fbe3be',
  '#bfe8ff',
  '#f3b54a',
]

interface Props {
  reducedMotion?: boolean
}

/**
 * StudioCosmicBackdrop:
 * High-impact animated space background for the Studio & Repair Bay.
 * Features living constellation lines tracking the cursor, twinkling stars,
 * shooting stars, and stylized NASA exploration rockets cruising across orbit.
 */
export default function StudioCosmicBackdrop({ reducedMotion = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let stars: Star[] = []
    let shooters: ShootingStar[] = []
    let rockets: Rocket[] = []
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
      width = Math.max(1, window.innerWidth)
      height = Math.max(1, window.innerHeight)
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.min(140, Math.max(60, Math.round((width * height) / 9500)))

      stars = Array.from({ length: count }, () => {
        const isProminent = Math.random() < 0.12
        const r = isProminent
          ? 2.0 + Math.random() * 0.9
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
          twinkleSpeed: 0.8 + Math.random() * 1.5,
          glowBoost: 0,
          isProminent,
        }
      })
    }

    const spawnShooter = () => {
      if (reducedMotion || shooters.length >= 2 || width <= 1) return
      const fromLeft = Math.random() > 0.4
      const startX = fromLeft
        ? Math.random() * (width * 0.5)
        : width * 0.5 + Math.random() * (width * 0.5)
      const startY = Math.random() * (height * 0.4)
      const angle = Math.PI / 6 + (Math.random() - 0.5) * 0.25
      const speed = 9 + Math.random() * 7

      shooters.push({
        x: startX,
        y: startY,
        vx: (fromLeft ? 1 : -0.75) * Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 110 + Math.random() * 90,
        life: 1,
        decay: 0.012 + Math.random() * 0.007,
      })
    }

    const spawnRocket = () => {
      if (reducedMotion || rockets.length >= 2 || width <= 1) return

      // Launch from edges (typically climbing towards the upper right/left)
      const fromBottom = Math.random() > 0.5
      let startX = 0
      let startY = 0
      let angle = 0

      if (fromBottom) {
        startX = Math.random() * (width * 0.4) - 40
        startY = height * 0.5 + Math.random() * (height * 0.45)
        angle = -Math.PI / 4.5 + (Math.random() - 0.5) * 0.2 // climbing up-right
      } else {
        startX = -60
        startY = Math.random() * (height * 0.6)
        angle = -Math.PI / 6 + (Math.random() - 0.5) * 0.3
      }

      const speed = 1.35 + Math.random() * 0.75

      rockets.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        scale: 0.75 + Math.random() * 0.3,
        speed,
        flameLength: 16,
        particles: [],
        life: 1,
      })
    }

    const drawRocket = (r: Rocket, t: number) => {
      ctx.save()
      ctx.translate(r.x, r.y)
      ctx.rotate(r.angle)
      ctx.scale(r.scale, r.scale)

      // 1. Dynamic Engine Exhaust Flame
      const flamePulse = 0.8 + 0.35 * Math.sin(t * 0.02 + r.x * 0.1)
      const fl = r.flameLength * flamePulse

      // Outer orange flame
      ctx.beginPath()
      ctx.moveTo(-16, -4)
      ctx.lineTo(-16 - fl * 1.5, 0)
      ctx.lineTo(-16, 4)
      ctx.closePath()
      const flameGrad = ctx.createLinearGradient(-16, 0, -16 - fl * 1.5, 0)
      flameGrad.addColorStop(0, 'rgba(255, 175, 40, 0.95)')
      flameGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.75)')
      flameGrad.addColorStop(1, 'rgba(168, 85, 247, 0)')
      ctx.fillStyle = flameGrad
      ctx.fill()

      // Inner cyan/white hot core
      ctx.beginPath()
      ctx.moveTo(-16, -2)
      ctx.lineTo(-16 - fl * 0.75, 0)
      ctx.lineTo(-16, 2)
      ctx.closePath()
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      // 2. Rocket Fuselage
      // Rocket Body: aerodynamic capsule
      ctx.beginPath()
      ctx.moveTo(18, 0) // nose tip
      ctx.bezierCurveTo(12, -7, -8, -6, -14, -5)
      ctx.lineTo(-14, 5)
      ctx.bezierCurveTo(-8, 6, 12, 7, 18, 0)
      ctx.closePath()
      ctx.fillStyle = '#f8fafc'
      ctx.fill()
      ctx.strokeStyle = '#cbd5e1'
      ctx.lineWidth = 1
      ctx.stroke()

      // NASA Red Accent Band on fuselage
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(-2, -5.5, 4.5, 11)

      // NASA Blue Accent Stripe
      ctx.fillStyle = '#2563eb'
      ctx.fillRect(5, -5, 3, 10)

      // Cockpit Window (glowing cyan observation bubble)
      ctx.beginPath()
      ctx.arc(8, 0, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#38bdf8'
      ctx.fill()
      ctx.strokeStyle = '#0284c7'
      ctx.lineWidth = 0.75
      ctx.stroke()

      // 3. Delta Fins / Wings
      ctx.beginPath()
      ctx.moveTo(-6, -5)
      ctx.lineTo(-15, -12)
      ctx.lineTo(-12, -4)
      ctx.closePath()
      ctx.fillStyle = '#1e293b'
      ctx.fill()
      ctx.strokeStyle = '#f3b54a'
      ctx.lineWidth = 0.8
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-6, 5)
      ctx.lineTo(-15, 12)
      ctx.lineTo(-12, 4)
      ctx.closePath()
      ctx.fillStyle = '#1e293b'
      ctx.fill()
      ctx.strokeStyle = '#f3b54a'
      ctx.lineWidth = 0.8
      ctx.stroke()

      // Thruster Nozzle Bell
      ctx.beginPath()
      ctx.moveTo(-14, -3)
      ctx.lineTo(-17, -4)
      ctx.lineTo(-17, 4)
      ctx.lineTo(-14, 3)
      ctx.closePath()
      ctx.fillStyle = '#475569'
      ctx.fill()

      ctx.restore()
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, width, height)

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.16
      mouse.y += (mouse.targetY - mouse.y) * 0.16
      mouse.alpha += (mouse.targetAlpha - mouse.alpha) * 0.08

      const MOUSE_RADIUS = 180
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
          MOUSE_RADIUS * 0.85,
        )
        aura.addColorStop(0, `rgba(243, 181, 74, ${0.13 * mouse.alpha})`)
        aura.addColorStop(0.35, `rgba(180, 225, 255, ${0.05 * mouse.alpha})`)
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * 0.85, 0, Math.PI * 2)
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

            if (!reducedMotion && mouse.alpha > 0.01) {
              const dMA = Math.hypot(sA.x - mouse.x, sA.y - mouse.y)
              const dMB = Math.hypot(sB.x - mouse.x, sB.y - mouse.y)
              const nearMouse = Math.min(dMA, dMB)
              if (nearMouse < MOUSE_RADIUS) {
                const boost =
                  (1 - nearMouse / MOUSE_RADIUS) * 0.38 * mouse.alpha
                lineAlpha = Math.min(0.52, lineAlpha + boost)
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
          s.x += s.vx
          s.y += s.vy

          if (s.x < -15) s.x = width + 15
          else if (s.x > width + 15) s.x = -15
          if (s.y < -15) s.y = height + 15
          else if (s.y > height + 15) s.y = -15

          s.glowBoost *= 0.92
        }

        let proximity = 0
        if (!reducedMotion && mouse.alpha > 0.01) {
          const dx = s.x - mouse.x
          const dy = s.y - mouse.y
          const d = Math.hypot(dx, dy)
          if (d < MOUSE_RADIUS) {
            proximity = 1 - d / MOUSE_RADIUS
            s.glowBoost = Math.max(s.glowBoost, proximity)

            const lineAlpha =
              Math.pow(proximity, 1.25) * 0.45 * mouse.alpha
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
            ctx.lineWidth = 0.95 + proximity * 0.65
            ctx.stroke()

            s.x += (mouse.x - s.x) * 0.003 * proximity
            s.y += (mouse.y - s.y) * 0.003 * proximity
          }
        }

        const twinkle = reducedMotion
          ? 0.85
          : 0.58 +
            0.42 *
              Math.sin(t * 0.0016 * s.twinkleSpeed + s.twinklePhase)

        const baseAlpha = Math.min(1, twinkle * 0.85 + s.glowBoost * 0.55)

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

        if (s.isProminent || s.glowBoost > 0.22) {
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

          if (s.isProminent) {
            const flareLen = s.r * 2.8 * (1 + s.glowBoost * 0.4)
            ctx.beginPath()
            ctx.moveTo(s.x - flareLen, s.y)
            ctx.lineTo(s.x + flareLen, s.y)
            ctx.moveTo(s.x, s.y - flareLen)
            ctx.lineTo(s.x, s.y + flareLen)
            ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * 0.4})`
            ctx.lineWidth = 0.65
            ctx.stroke()
          }
        }
      }

      // 4. Flying NASA Exploration Rockets
      if (!reducedMotion) {
        rockets = rockets.filter(
          (rk) =>
            rk.x > -120 &&
            rk.x < width + 120 &&
            rk.y > -120 &&
            rk.y < height + 120,
        )

        for (const rk of rockets) {
          rk.x += rk.vx
          rk.y += rk.vy

          // Interactive booster pulse when cursor is nearby
          const dMouse = Math.hypot(rk.x - mouse.x, rk.y - mouse.y)
          if (mouse.alpha > 0.01 && dMouse < 140) {
            rk.flameLength = 26
            rk.vx = Math.cos(rk.angle) * (rk.speed * 1.5)
            rk.vy = Math.sin(rk.angle) * (rk.speed * 1.5)
          } else {
            rk.flameLength = 16
            rk.vx = Math.cos(rk.angle) * rk.speed
            rk.vy = Math.sin(rk.angle) * rk.speed
          }

          // Spawn trailing smoke/flame particles
          if (Math.random() < 0.6) {
            const exhaustX = rk.x - Math.cos(rk.angle) * (18 * rk.scale)
            const exhaustY = rk.y - Math.sin(rk.angle) * (18 * rk.scale)
            rk.particles.push({
              x: exhaustX,
              y: exhaustY,
              vx: -Math.cos(rk.angle) * (1.5 + Math.random() * 2) + (Math.random() - 0.5) * 0.8,
              vy: -Math.sin(rk.angle) * (1.5 + Math.random() * 2) + (Math.random() - 0.5) * 0.8,
              size: 1.5 + Math.random() * 2.5,
              alpha: 0.8,
              color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
            })
          }

          // Draw exhaust particles
          rk.particles = rk.particles.filter((p) => p.alpha > 0.05)
          for (const p of rk.particles) {
            p.x += p.vx
            p.y += p.vy
            p.alpha -= 0.025
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = p.color
            ctx.globalAlpha = Math.max(0, p.alpha)
            ctx.fill()
          }

          ctx.globalAlpha = 1
          drawRocket(rk, t)
        }
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

    const onPointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX
      mouse.targetY = e.clientY
      mouse.targetAlpha = 1
    }

    const onPointerLeave = () => {
      mouse.targetAlpha = 0
    }

    const onResize = () => {
      build()
      if (reducedMotion) draw(0)
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

    // Spawn an initial rocket shortly after loading so kids see it right away!
    const initialRocketTimer = window.setTimeout(spawnRocket, 1800)

    let shooterTimer = 0
    let rocketTimer = 0

    if (reducedMotion) {
      draw(0)
    } else {
      raf = requestAnimationFrame(loop)
      shooterTimer = window.setInterval(spawnShooter, 5200)
      rocketTimer = window.setInterval(spawnRocket, 14000)

      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('blur', onPointerLeave)
      window.addEventListener('pointerup', onPointerLeave, { passive: true })
      document.addEventListener('mouseleave', onPointerLeave)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(initialRocketTimer)
      window.clearInterval(shooterTimer)
      window.clearInterval(rocketTimer)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', onPointerLeave)
      window.removeEventListener('pointerup', onPointerLeave)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('mouseleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reducedMotion])

  return (
    <div ref={containerRef} className="studio-sky" aria-hidden="true">
      <canvas ref={canvasRef} className="studio-sky__canvas" />
    </div>
  )
}
