import type Phaser from 'phaser'

// Sistema de audio procedural (Web Audio API nativo):
// Incluye efectos sonoros táctiles y música ambiental cósmica procedural en bucle.

export class Sfx {
  private activo = true
  private silenciado = false

  // Nodos de la música cósmica
  private musicaTimer: number | null = null
  private musicaGain: GainNode | null = null
  private musicaPaso = 0

  constructor(
    private scene: Phaser.Scene,
    private volumen: number,
  ) {
    if (volumen <= 0) this.silenciado = true
  }

  private ctx(): AudioContext | null {
    const m = this.scene.sound as unknown as { context?: AudioContext }
    return m.context ?? null
  }

  estaSilenciado(): boolean {
    return this.silenciado
  }

  alternarSilencio(): boolean {
    this.silenciado = !this.silenciado
    if (this.silenciado) {
      this.detenerAmbiente()
    } else {
      this.iniciarAmbiente()
    }
    return this.silenciado
  }

  tono(freq: number, dur = 0.12, tipo: OscillatorType = 'sine', retraso = 0, volFactor = 1) {
    const ctx = this.ctx()
    if (!ctx || !this.activo || this.silenciado || this.volumen <= 0) return

    try {
      const t0 = ctx.currentTime + retraso
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = tipo
      osc.frequency.setValueAtTime(freq, t0)

      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(0.2 * this.volumen * volFactor, t0 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.02)
    } catch {
      // Ignora si el contexto aún no fue activado por gesto del usuario
    }
  }

  // --- Efectos sonoros del juego ---

  select() {
    this.tono(880, 0.04, 'sine', 0, 0.5)
  }

  swap() {
    this.tono(520, 0.06, 'sine', 0, 0.7)
    this.tono(780, 0.07, 'sine', 0.02, 0.6)
  }

  revertido() {
    this.tono(260, 0.09, 'triangle', 0, 0.6)
    this.tono(196, 0.12, 'sine', 0.05, 0.5)
  }

  match(cascada: number) {
    const escala = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51]
    const idx = Math.min(cascada, escala.length - 1)
    const baseFreq = escala[idx]

    this.tono(baseFreq, 0.18, 'sine', 0, 0.9)
    this.tono(baseFreq * 1.5, 0.15, 'triangle', 0.03, 0.6)
  }

  mala() {
    this.tono(180, 0.14, 'sawtooth', 0, 0.45)
    this.tono(130, 0.18, 'sawtooth', 0.1, 0.5)
  }

  niebla() {
    this.tono(587.33, 0.22, 'sine', 0, 0.7)
    this.tono(880.0, 0.28, 'triangle', 0.06, 0.6)
    this.tono(1174.66, 0.35, 'sine', 0.12, 0.5)
  }

  gana() {
    const notas = [523.25, 659.25, 783.99, 1046.5, 1318.51]
    notas.forEach((f, i) => this.tono(f, 0.25, 'sine', i * 0.09, 0.9))
    this.tono(1567.98, 0.45, 'triangle', 0.45, 1)
  }

  pierde() {
    const notas = [392, 349.23, 329.63, 261.63]
    notas.forEach((f, i) => this.tono(f, 0.28, 'sine', i * 0.13, 0.7))
  }

  // --- Música de fondo espacial en bucle continuo ---

  iniciarAmbiente() {
    const ctx = this.ctx()
    if (!ctx || !this.activo || this.silenciado || this.volumen <= 0 || this.musicaTimer !== null)
      return

    try {
      if (ctx.state === 'suspended') return

      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(0.06 * this.volumen, ctx.currentTime)
      masterGain.connect(ctx.destination)
      this.musicaGain = masterGain

      // Escala pentatónica espacial etérea (C, D, E, G, A en varias octavas)
      const notasEspaciales = [
        130.81, 164.81, 196.0, 246.94, 261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99,
      ]

      const reproducirAcordeEspacial = () => {
        if (!this.activo || this.silenciado || !this.musicaGain) return

        // Bajo profundo y suave
        const bajoFreq = [65.41, 82.41, 73.42, 65.41][this.musicaPaso % 4]
        this.tocarNotaSuave(bajoFreq, 2.8, 'sine', 0, 0.5)

        // Arpegio etéreo espacial
        const n1 = notasEspaciales[(this.musicaPaso * 2) % notasEspaciales.length]
        const n2 = notasEspaciales[(this.musicaPaso * 3 + 2) % notasEspaciales.length]
        const n3 = notasEspaciales[(this.musicaPaso * 2 + 4) % notasEspaciales.length]

        this.tocarNotaSuave(n1, 2.2, 'sine', 0.1, 0.35)
        this.tocarNotaSuave(n2, 2.0, 'triangle', 0.6, 0.25)
        this.tocarNotaSuave(n3, 2.4, 'sine', 1.1, 0.3)

        this.musicaPaso++
      }

      reproducirAcordeEspacial()
      this.musicaTimer = window.setInterval(reproducirAcordeEspacial, 2400)
    } catch {
      // Ignorar si el navegador bloquea audio antes del primer gesto
    }
  }

  private tocarNotaSuave(
    freq: number,
    dur: number,
    tipo: OscillatorType,
    delay: number,
    vol: number,
  ) {
    const ctx = this.ctx()
    if (!ctx || !this.musicaGain) return

    try {
      const t0 = ctx.currentTime + delay
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1400, t0)

      osc.type = tipo
      osc.frequency.setValueAtTime(freq, t0)

      g.gain.setValueAtTime(0.0001, t0)
      g.gain.linearRampToValueAtTime(vol, t0 + 0.4)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)

      osc.connect(filter).connect(g).connect(this.musicaGain)
      osc.start(t0)
      osc.stop(t0 + dur + 0.05)
    } catch {
      // Audio seguro
    }
  }

  detenerAmbiente() {
    if (this.musicaTimer !== null) {
      clearInterval(this.musicaTimer)
      this.musicaTimer = null
    }
    if (this.musicaGain) {
      try {
        this.musicaGain.disconnect()
      } catch {}
      this.musicaGain = null
    }
  }

  suspender() {
    void this.ctx()?.suspend()
  }

  reanudar() {
    const ctx = this.ctx()
    if (ctx?.state === 'suspended') {
      void ctx.resume().then(() => {
        if (!this.silenciado && this.musicaTimer === null) {
          this.iniciarAmbiente()
        }
      })
    } else if (!this.silenciado && this.musicaTimer === null) {
      this.iniciarAmbiente()
    }
  }

  detener() {
    this.activo = false
    this.detenerAmbiente()
  }
}
