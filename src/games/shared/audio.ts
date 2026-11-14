/**
 * Sonido sintetizado con WebAudio: ni un solo archivo que descargar, y el
 * volumen del portal manda siempre. Con volumen 0 no se crea el contexto.
 *
 * Todo fallo se traga a proposito: en un navegador sin audio, o con la
 * politica de autoplay bloqueando el contexto, el juego debe seguir igual.
 */
export interface Sfx {
  tone: (freq: number, durMs: number, type?: OscillatorType, gain?: number) => void
  sweep: (from: number, to: number, durMs: number, type?: OscillatorType, gain?: number) => void
  noise: (durMs: number, gain?: number) => void
  destroy: () => void
}

export function createSfx(volume: number): Sfx {
  const master = Math.max(0, Math.min(1, volume))
  let ctx: AudioContext | null = null
  let dead = false

  const ac = (): AudioContext | null => {
    if (dead || master <= 0) return null
    if (!ctx) {
      try {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return null
        ctx = new Ctor()
      } catch {
        return null
      }
    }
    // El navegador puede dejarlo suspendido hasta el primer gesto del usuario.
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
    return ctx
  }

  const envelope = (node: AudioNode, durMs: number, gain: number) => {
    const c = ctx
    if (!c) return null
    const g = c.createGain()
    const now = c.currentTime
    const peak = Math.max(0.0001, gain * master)
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(peak, now + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000)
    node.connect(g)
    g.connect(c.destination)
    return g
  }

  return {
    tone(freq, durMs, type = 'sine', gain = 0.25) {
      const c = ac()
      if (!c) return
      try {
        const osc = c.createOscillator()
        osc.type = type
        osc.frequency.setValueAtTime(freq, c.currentTime)
        envelope(osc, durMs, gain)
        osc.start()
        osc.stop(c.currentTime + durMs / 1000 + 0.02)
      } catch {
        /* sin audio: el juego sigue */
      }
    },

    sweep(from, to, durMs, type = 'sawtooth', gain = 0.2) {
      const c = ac()
      if (!c) return
      try {
        const osc = c.createOscillator()
        osc.type = type
        const now = c.currentTime
        osc.frequency.setValueAtTime(from, now)
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + durMs / 1000)
        envelope(osc, durMs, gain)
        osc.start()
        osc.stop(now + durMs / 1000 + 0.02)
      } catch {
        /* sin audio: el juego sigue */
      }
    },

    noise(durMs, gain = 0.15) {
      const c = ac()
      if (!c) return
      try {
        const frames = Math.max(1, Math.floor((c.sampleRate * durMs) / 1000))
        const buffer = c.createBuffer(1, frames, c.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
        const src = c.createBufferSource()
        src.buffer = buffer
        envelope(src, durMs, gain)
        src.start()
      } catch {
        /* sin audio: el juego sigue */
      }
    },

    destroy() {
      dead = true
      const c = ctx
      ctx = null
      if (c) void c.close().catch(() => {})
    },
  }
}
