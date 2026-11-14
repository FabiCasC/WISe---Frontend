import type Phaser from 'phaser';

// Sonidos sintetizados (sin archivos): respetan ctx.settings.volume y se detienen al destruir.
export class Sfx {
  private activo = true;
  constructor(private scene: Phaser.Scene, private volumen: number) {}

  private ctx(): AudioContext | null {
    const m = this.scene.sound as unknown as { context?: AudioContext };
    return m.context ?? null;
  }

  tono(freq: number, dur = 0.12, tipo: OscillatorType = 'sine', retraso = 0) {
    const ctx = this.ctx();
    if (!ctx || !this.activo || this.volumen <= 0) return;
    const t0 = ctx.currentTime + retraso;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = tipo; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.18 * this.volumen, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  swap() { this.tono(380, 0.06, 'triangle'); }
  revertido() { this.tono(220, 0.1, 'triangle'); }
  match(cascada: number) { this.tono(520 + cascada * 90, 0.14, 'sine'); this.tono(780 + cascada * 90, 0.12, 'sine', 0.06); }
  mala() { this.tono(160, 0.25, 'sawtooth'); }
  niebla() { this.tono(660, 0.3, 'sine'); }
  gana() { [523, 659, 784, 1047].forEach((f, i) => this.tono(f, 0.2, 'sine', i * 0.11)); }
  pierde() { [392, 330, 262].forEach((f, i) => this.tono(f, 0.22, 'triangle', i * 0.14)); }

  suspender() { void this.ctx()?.suspend(); }
  reanudar() { void this.ctx()?.resume(); }
  detener() { this.activo = false; }
}
