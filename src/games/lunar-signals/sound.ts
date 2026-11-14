/**
 * Synthesized sound effects (Web Audio). No audio files, nothing to download.
 *
 * - Respects settings.volume: 0 means total silence (nothing is even created).
 * - The AudioContext is created lazily on the first sound, which always comes
 *   from a player action (click/tap), so browsers allow it.
 * - suspend()/resume() follow the portal's pause; dispose() closes everything.
 *
 * Honesty note: these are interface feedback sounds. There is no sound in space;
 * the game never presents them as real recordings.
 */
export interface Sfx {
  fire(): void
  hit(): void
  echo(): void
  select(): void
  ok(): void
  bad(): void
  quake(): void
  done(): void
  suspend(): void
  resume(): void
  dispose(): void
}

type AudioCtor = typeof AudioContext

export function createSfx(volume: number): Sfx {
  const Ctor: AudioCtor | undefined =
    typeof window === 'undefined'
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext)
  const master = Math.max(0, Math.min(1, volume)) * 0.25
  let ctx: AudioContext | null = null
  let held = false
  let disposed = false

  const audio = (): AudioContext | null => {
    if (disposed || held || master <= 0 || !Ctor) return null
    if (!ctx) {
      try { ctx = new Ctor() } catch { return null }
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  const tone = (freq: number, dur: number, type: OscillatorType = 'sine', at = 0, peak = 1, to?: number) => {
    const c = audio()
    if (!c) return
    const t0 = c.currentTime + at
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur)
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(master * peak, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(c.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.05)
  }

  return {
    fire: () => tone(1200, 0.28, 'sawtooth', 0, 0.6, 180),
    hit: () => tone(300, 0.08, 'square', 0, 0.5),
    echo: () => { tone(880, 0.5, 'sine', 0, 0.8); tone(880, 0.5, 'sine', 0.18, 0.35) },
    select: () => tone(520, 0.06, 'triangle', 0, 0.5),
    ok: () => { tone(660, 0.12, 'triangle', 0); tone(880, 0.12, 'triangle', 0.1); tone(1320, 0.2, 'triangle', 0.2) },
    bad: () => tone(140, 0.22, 'square', 0, 0.7, 90),
    quake: () => { tone(48, 1.2, 'sine', 0, 1.2, 32); tone(61, 1.0, 'triangle', 0, 0.7, 38) },
    done: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.12, 0.8)),
    suspend() { held = true; if (ctx) void ctx.suspend() },
    resume() { held = false; if (ctx) void ctx.resume() },
    dispose() { disposed = true; if (ctx) void ctx.close(); ctx = null },
  }
}
