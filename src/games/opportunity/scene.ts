import Phaser from 'phaser';
import type { Evento, Ficha, Pos, PuertoReglas } from './events';
import { Hud } from './hud';
import { COLOR_FICHA, NOMBRE, dibujarIcono } from './iconos';
import { PALETA, css } from './paleta';
import { Sfx } from './sfx';
import { ROCA_CREDITO } from './creditos';

export const W = 360, H = 640, N = 6;
const CELDA = 52, TABLERO = CELDA * N, X0 = (W - TABLERO) / 2, Y0 = 316;
const FOTO = { x: 30, y: 150, w: 300, h: 142 };

export interface Ajustes { volume: number; reducedMotion: boolean; practice: boolean }
export interface Config {
  reglas: PuertoReglas;
  ajustes: Ajustes;
  levelId: number;
  tiempoMs: () => number;
  alTerminar: (ganado: boolean) => void; // index.ts arma el resultado y llama ctx.onComplete
}

export class OpportunityScene extends Phaser.Scene {
  private fichas: (Phaser.GameObjects.Container | null)[][] = [];
  private hud!: Hud;
  private sfx!: Sfx;
  private niebla: Phaser.GameObjects.Rectangle[] = [];
  private seleccion: Pos | null = null;
  private ocupado = false;
  private terminado = false;
  private entregado = false;
  private cascada = 0;
  private cola: Promise<void> = Promise.resolve();

  constructor(private cfg: Config) { super('opportunity'); }

  preload() {
    this.load.on('loaderror', () => {}); // arte opcional: si falta, se usa el provisional
    if (this.cfg.levelId === 1) this.load.image('roca', 'assets/opportunity/roca.jpg');
  }

  create() {
    const { reglas, ajustes, levelId } = this.cfg;
    this.cameras.main.setBackgroundColor(PALETA.deepNavy);
    this.sound.volume = ajustes.volume;
    this.sfx = new Sfx(this, ajustes.volume);
    this.crearEstrellas();
    this.hud = new Hud(this, W, ajustes.reducedMotion);
    this.hud.setMaxEnergia(reglas.movimientosMax());
    this.hud.setEnergia(reglas.movimientosMax(), ajustes.practice);
    this.hud.setObjetivo(reglas.objetivo());
    const ini = reglas.progresoInicial();
    this.hud.setMetas(ini.metas);
    this.hud.setProgreso(ini.conteo, ini.puntos, ajustes.practice);

    if (levelId === 1) this.crearFotoNiebla(); else this.crearNota(reglas.nota());
    this.add.rectangle(W / 2, Y0 + TABLERO / 2, TABLERO + 12, TABLERO + 12, PALETA.duskBlue, 0.28)
      .setStrokeStyle(2, PALETA.duskBlue).setDepth(1);
    this.crearTablero(reglas.tableroInicial(), false);
    this.events.once('shutdown', () => this.limpiar());
  }

  // ---------- dibujo ----------
  private pos(f: number, c: number) { return { x: X0 + c * CELDA + CELDA / 2, y: Y0 + f * CELDA + CELDA / 2 }; }

  private crearEstrellas() {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const e = this.add.circle(Phaser.Math.Between(4, W - 4), Phaser.Math.Between(4, H - 4), Phaser.Math.Between(1, 2), PALETA.aliceBlue, 0.35).setDepth(0);
      if (!this.cfg.ajustes.reducedMotion && i % 3 === 0) {
        this.tweens.add({ targets: e, alpha: 0.08, duration: Phaser.Math.Between(1200, 2600), yoyo: true, repeat: -1 });
      }
    }
  }

  private crearTablero(t: Ficha[][], conFundido: boolean) {
    for (let f = 0; f < N; f++) {
      this.fichas[f] = [];
      for (let c = 0; c < N; c++) {
        const o = this.crearFicha(t[f][c], f, c);
        if (conFundido && !this.cfg.ajustes.reducedMotion) { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 300 }); }
        this.fichas[f][c] = o;
      }
    }
  }

  private pintarFondo(g: Phaser.GameObjects.Graphics, tipo: Ficha, marcada: boolean) {
    g.clear().fillStyle(COLOR_FICHA[tipo]).fillRoundedRect(-23, -23, 46, 46, 11);
    g.lineStyle(marcada ? 4 : 2, PALETA.deepNavy, marcada ? 1 : 0.35).strokeRoundedRect(-23, -23, 46, 46, 11);
  }

  private crearFicha(tipo: Ficha, f: number, c: number, yInicial?: number) {
    const { x, y } = this.pos(f, c);
    const bg = this.add.graphics(), ic = this.add.graphics();
    this.pintarFondo(bg, tipo, false);
    dibujarIcono(ic, tipo);
    const cont = this.add.container(x, yInicial ?? y, [bg, ic]).setDepth(2);
    cont.setSize(CELDA, CELDA).setInteractive();
    cont.setData('tipo', tipo).setData('bg', bg);
    cont.on('pointerdown', (p: Phaser.Input.Pointer) => this.alPulsar(cont, p));
    return cont;
  }

  private marcar(cont: Phaser.GameObjects.Container | null, on: boolean) {
    if (!cont) return;
    this.pintarFondo(cont.getData('bg') as Phaser.GameObjects.Graphics, cont.getData('tipo') as Ficha, on);
    cont.setScale(on ? 1.1 : 1);
  }

  private crearFotoNiebla() {
    const { x, y, w, h } = FOTO;
    if (this.textures.exists('roca')) {
      this.add.image(x + w / 2, y + h / 2, 'roca').setDisplaySize(w, h).setDepth(1);
    } else { // foto provisional: roca con esférulas de hematita sobre cielo marciano
      const g = this.add.graphics().setDepth(1);
      g.fillStyle(PALETA.duskBlue).fillRect(x, y, w, h);
      g.fillStyle(PALETA.thistle, 0.9).fillEllipse(x + w / 2, y + h * 0.62, w * 0.62, h * 0.55);
      g.fillStyle(PALETA.pearlAqua, 0.8).fillEllipse(x + w / 2 - 20, y + h * 0.55, w * 0.3, h * 0.25);
      g.fillStyle(PALETA.deepNavy, 0.85);
      [[-60, 6], [-25, 22], [10, 2], [40, 18], [62, 4], [-5, 30]].forEach(([dx, dy]) => g.fillCircle(x + w / 2 + dx, y + h * 0.55 + dy, 4));
    }
    this.add.rectangle(x + w / 2, y + h / 2, w, h).setStrokeStyle(2, PALETA.pearlAqua).setDepth(4);
    this.add.text(x + w, y + h + 3, ROCA_CREDITO.leyenda, { fontFamily: 'sans-serif', fontSize: '10px', color: css(PALETA.aliceBlue) })
      .setOrigin(1, 0).setAlpha(0.8).setDepth(4); // crédito visible de la imagen de la NASA
    const z = this.cfg.reglas.zonasNiebla(), cols = 3, filas = Math.ceil(z / cols), cw = w / cols, ch = h / filas;
    for (let i = 0; i < z; i++) {
      this.niebla.push(this.add.rectangle(x + (i % cols) * cw + cw / 2, y + Math.floor(i / cols) * ch + ch / 2, cw, ch, PALETA.aliceBlue, 0.96)
        .setStrokeStyle(1, PALETA.thistle).setDepth(3));
    }
  }

  private crearNota(texto: string) {
    const { x, y, w, h } = FOTO;
    this.add.rectangle(x, y, w, h, PALETA.duskBlue, 0.35).setOrigin(0, 0).setStrokeStyle(2, PALETA.duskBlue).setDepth(1);
    this.add.text(x + w / 2, y + h / 2, texto, {
      fontFamily: 'sans-serif', fontSize: '15px', color: css(PALETA.aliceBlue), align: 'center', wordWrap: { width: w - 32 },
    }).setOrigin(0.5).setDepth(2);
  }

  // ---------- entrada: arrastrar o tocar-tocar ----------
  private alPulsar(cont: Phaser.GameObjects.Container, p: Phaser.Input.Pointer) {
    if (this.ocupado || this.terminado) return;
    const pos = this.celdaDe(cont); if (!pos) return;
    if (this.seleccion && this.sonVecinas(this.seleccion, pos)) {
      const a = this.seleccion; this.limpiarSeleccion(); this.pedirSwap(a, pos); return;
    }
    this.limpiarSeleccion(); this.seleccion = pos; this.marcar(cont, true);
    const x0 = p.x, y0 = p.y;
    const mover = (q: Phaser.Input.Pointer) => {
      const dx = q.x - x0, dy = q.y - y0;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
      cleanup(); this.limpiarSeleccion();
      const dest: Pos = Math.abs(dx) > Math.abs(dy) ? [pos[0], pos[1] + Math.sign(dx)] : [pos[0] + Math.sign(dy), pos[1]];
      if (dest[0] >= 0 && dest[0] < N && dest[1] >= 0 && dest[1] < N) this.pedirSwap(pos, dest);
    };
    const cleanup = () => { this.input.off('pointermove', mover); this.input.off('pointerup', cleanup); };
    this.input.on('pointermove', mover); this.input.once('pointerup', cleanup);
  }

  private celdaDe(cont: Phaser.GameObjects.Container): Pos | null {
    for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (this.fichas[f][c] === cont) return [f, c];
    return null;
  }
  private sonVecinas(a: Pos, b: Pos) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1; }
  private limpiarSeleccion() {
    if (this.seleccion) this.marcar(this.fichas[this.seleccion[0]][this.seleccion[1]], false);
    this.seleccion = null;
  }

  private pedirSwap(a: Pos, b: Pos) {
    this.ocupado = true; this.cascada = 0;
    const eventos = this.cfg.reglas.intentarSwap(a, b);
    this.procesar(eventos).finally(() => { this.ocupado = false; });
  }

  // ---------- animación de eventos (también sirve con eventos de prueba) ----------
  procesar(eventos: Evento[]): Promise<void> {
    this.cola = this.cola.then(async () => { for (const e of eventos) await this.animar(e); });
    return this.cola;
  }

  private dur(ms: number) { return this.cfg.ajustes.reducedMotion ? 1 : ms; }
  private tween(cfg: Phaser.Types.Tweens.TweenBuilderConfig) {
    return new Promise<void>(res => { this.tweens.add({ ...cfg, onComplete: () => res() }); });
  }
  private espera(ms: number) { return new Promise<void>(res => { this.time.delayedCall(this.dur(ms), () => res()); }); }

  private async animar(e: Evento) {
    const { ajustes } = this.cfg;
    switch (e.tipo) {
      case 'swap': this.sfx.swap(); return this.animarSwap(e.a, e.b);
      case 'swapRevertido': {
        this.sfx.revertido();
        await this.animarSwap(e.a, e.b);
        if (!ajustes.reducedMotion) { // sacudida corta: se desactiva con reducedMotion
          const os = [this.fichas[e.a[0]][e.a[1]], this.fichas[e.b[0]][e.b[1]]].filter(Boolean) as Phaser.GameObjects.Container[];
          await Promise.all(os.map(o => this.tween({ targets: o, x: o.x + 4, duration: 50, yoyo: true, repeat: 1 })));
        }
        return;
      }
      case 'match': {
        this.sfx.match(this.cascada++);
        const objs = e.celdas.map(([f, c]) => this.fichas[f][c]).filter(Boolean) as Phaser.GameObjects.Container[];
        e.celdas.forEach(([f, c]) => (this.fichas[f][c] = null));
        if (!ajustes.reducedMotion) objs.forEach(o => this.chispas(o.x, o.y, COLOR_FICHA[e.ficha]));
        await this.tween({ targets: objs, scale: 0, alpha: 0, duration: this.dur(180) });
        objs.forEach(o => o.destroy());
        return;
      }
      case 'caida': {
        const movs: Promise<void>[] = [];
        for (const { de, a } of e.movimientos) {
          const o = this.fichas[de[0]][de[1]]; if (!o) continue;
          this.fichas[de[0]][de[1]] = null; this.fichas[a[0]][a[1]] = o;
          movs.push(this.tween({ targets: o, y: this.pos(a[0], a[1]).y, duration: this.dur(200), ease: 'Bounce.easeOut' }));
        }
        for (const { a, ficha } of e.nuevas) {
          const o = this.crearFicha(ficha, a[0], a[1], Y0 - CELDA);
          this.fichas[a[0]][a[1]] = o;
          movs.push(this.tween({ targets: o, y: this.pos(a[0], a[1]).y, duration: this.dur(240), ease: 'Bounce.easeOut' }));
        }
        await Promise.all(movs); return;
      }
      case 'nieblaQuitada': {
        this.sfx.niebla();
        const quitar = this.niebla.splice(0, e.zonas);
        await this.tween({ targets: quitar, alpha: 0, duration: this.dur(500) });
        quitar.forEach(q => q.destroy()); return;
      }
      case 'energia': this.hud.setEnergia(e.restante, ajustes.practice); return;
      case 'progreso': this.hud.setProgreso(e.conteo, e.puntos, ajustes.practice); return;
      case 'malaDecision': this.sfx.mala(); this.hud.mensaje(e.mensaje); return;
      case 'mezcla': {
        this.hud.mensaje('No moves left: reshuffling');
        this.fichas.flat().forEach(o => o?.destroy());
        this.crearTablero(e.tablero, true);
        await this.espera(350); return;
      }
      case 'nivelCompleto': {
        if (this.terminado) return;
        this.terminado = true;
        if (e.ganado) this.sfx.gana(); else this.sfx.pierde();
        await this.espera(700);
        this.mostrarFinal(e.ganado); return;
      }
    }
  }

  private async animarSwap(a: Pos, b: Pos) {
    const oa = this.fichas[a[0]][a[1]], ob = this.fichas[b[0]][b[1]]; if (!oa || !ob) return;
    const pa = this.pos(a[0], a[1]), pb = this.pos(b[0], b[1]);
    this.fichas[a[0]][a[1]] = ob; this.fichas[b[0]][b[1]] = oa;
    await Promise.all([
      this.tween({ targets: oa, x: pb.x, y: pb.y, duration: this.dur(150) }),
      this.tween({ targets: ob, x: pa.x, y: pa.y, duration: this.dur(150) }),
    ]);
  }

  private chispas(x: number, y: number, color: number) { // efecto decorativo (no se usa con reducedMotion)
    for (let i = 0; i < 4; i++) {
      const p = this.add.circle(x, y, 3, color).setDepth(10), ang = (Math.PI / 2) * i + Math.PI / 4;
      this.tweens.add({ targets: p, x: x + Math.cos(ang) * 24, y: y + Math.sin(ang) * 24, alpha: 0, duration: 320, onComplete: () => p.destroy() });
    }
  }

  // ---------- resultado ----------
  private mostrarFinal(ganado: boolean) {
    const { levelId, ajustes, reglas } = this.cfg;
    const r = reglas.resultado(this.cfg.tiempoMs());
    const tablero = ganado && levelId === 3;
    const ph = tablero ? 400 : 270, py = H / 2 - ph / 2, pw = W - 40;
    const cont = this.add.container(0, 0).setDepth(50);
    cont.add(this.add.rectangle(W / 2, H / 2, W, H, PALETA.deepNavy, 0.85).setInteractive());
    const panel = this.add.graphics();
    panel.fillStyle(PALETA.deepNavy).fillRoundedRect(20, py, pw, ph, 16).lineStyle(2, PALETA.pearlAqua).strokeRoundedRect(20, py, pw, ph, 16);
    cont.add(panel);
    const txt = (y: number, s: string, size: number, color: number, bold = false) =>
      cont.add(this.add.text(W / 2, y, s, { fontFamily: 'sans-serif', fontSize: `${size}px`, color: css(color), fontStyle: bold ? 'bold' : 'normal', align: 'center', wordWrap: { width: pw - 36 } }).setOrigin(0.5, 0));
    let y = py + 18;
    txt(y, ganado ? 'Level complete!' : 'Out of moves', 22, ganado ? PALETA.pearlAqua : PALETA.thistle, true); y += 40;
    const seg = Math.round(r.tiempoMs / 1000);
    txt(y, ajustes.practice ? 'Practice mode: no score' : `★ ${r.puntos} points`, 18, PALETA.aliceBlue, true); y += 28;
    txt(y, `Time: ${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, 14, PALETA.aliceBlue); y += 26;
    if (!ganado) {
      txt(y, 'You can retry the level.', 15, PALETA.thistle);
    } else if (levelId === 1) {
      txt(y, 'The rock photo is fully revealed.', 15, PALETA.thistle);
    } else if (levelId === 2) {
      txt(y, r.sinErroresDecision ? 'Rock ground and analyzed, no bad decisions.' : 'Rock ground and analyzed.', 15, PALETA.thistle);
    } else {
      this.tableroEvidencia(cont, py + 118, pw);
    }
    // botón continuar
    const by = py + ph - 56, bg = this.add.graphics();
    bg.fillStyle(PALETA.pearlAqua).fillRoundedRect(W / 2 - 90, by, 180, 40, 12);
    cont.add(bg);
    cont.add(this.add.text(W / 2, by + 20, 'Continue', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: css(PALETA.deepNavy) }).setOrigin(0.5));
    const zona = this.add.rectangle(W / 2, by + 20, 180, 40, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    zona.on('pointerup', () => { if (this.entregado) return; this.entregado = true; this.cfg.alTerminar(ganado); });
    cont.add(zona);
    if (!ajustes.reducedMotion) { cont.setAlpha(0); this.tweens.add({ targets: cont, alpha: 1, duration: 300 }); }
  }

  // Nivel 3: tablero de evidencia. Agua antigua se enciende; vida queda en gris.
  private tableroEvidencia(cont: Phaser.GameObjects.Container, y: number, pw: number) {
    const fichas: Ficha[] = ['camara', 'espectrometro', 'energia'], w = (pw - 36) / 3;
    fichas.forEach((f, i) => {
      const x = 38 + i * w + w / 2;
      const g = this.add.graphics({ x: x, y: y + 18 }).setScale(0.8);
      g.fillStyle(COLOR_FICHA[f]).fillRoundedRect(-23, -23, 46, 46, 11); cont.add(g);
      const ic = this.add.graphics({ x: x, y: y + 18 }).setScale(0.8); dibujarIcono(ic, f); cont.add(ic);
      cont.add(this.add.text(x, y + 44, `${NOMBRE[f]} ✓`, { fontFamily: 'sans-serif', fontSize: '11px', color: css(PALETA.aliceBlue) }).setOrigin(0.5, 0));
    });
    const fila = (yy: number, encendido: boolean, titulo: string, detalle: string) => {
      const g = this.add.graphics();
      g.fillStyle(encendido ? PALETA.pearlAqua : PALETA.duskBlue, encendido ? 1 : 0.5).fillCircle(46, yy + 12, 10);
      if (encendido) g.lineStyle(2, PALETA.aliceBlue, 0.8).strokeCircle(46, yy + 12, 14);
      cont.add(g);
      cont.add(this.add.text(70, yy, titulo, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: css(encendido ? PALETA.pearlAqua : PALETA.aliceBlue) }));
      cont.add(this.add.text(70, yy + 19, detalle, { fontFamily: 'sans-serif', fontSize: '12px', color: css(PALETA.aliceBlue), wordWrap: { width: pw - 70 } }));
    };
    fila(y + 80, true, 'Ancient water: lit', 'Hematite spherules and gypsum.');
    fila(y + 140, false, 'Life: grayed out', 'Opportunity found neither life nor evidence of life.');
  }

  // ---------- pausa / cierre ----------
  pausar() { this.scene.pause(); this.sound.pauseAll(); this.sfx?.suspender(); }
  reanudar() { this.scene.resume(); this.sound.resumeAll(); this.sfx?.reanudar(); }
  limpiar() {
    this.sfx?.detener();
    this.input?.removeAllListeners();
    this.tweens?.killAll();
    this.time?.removeAllEvents();
    this.sound?.stopAll();
  }
}
