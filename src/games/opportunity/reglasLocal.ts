import type { Conteo, Evento, Ficha, Pos, PuertoReglas, Resultado } from './events';

// Lógica del juego, determinista (seed): tablero, combinaciones, cascadas, niveles, puntos y resultado.
// Para ajustar dificultad cambia NIVELES (movimientos y metas); la escena no se toca.

const N = 6;
const TIPOS: Ficha[] = ['camara', 'rat', 'espectrometro', 'energia'];
const PULIDO_MIN = 3; // nivel 2: fichas RAT juntadas antes de que el análisis cuente (una combinación)

interface Nivel { movimientos: number; metas: Conteo; objetivo: string; nota: string }
const NIVELES: Record<number, Nivel> = {
  1: { movimientos: 12, metas: { camara: 6 }, objetivo: 'Observe: collect 6 cameras to uncover the rock photo',
       nota: 'Look first. Each camera uncovers a piece of the photo.' },
  2: { movimientos: 16, metas: { rat: 6, espectrometro: 6 }, objetivo: 'Investigate: collect 6 RAT and 6 spectrometers',
       nota: 'The RAT grinds the rock to expose its interior. Grind before you analyze: spectrometer tiles matched too early do not count.' },
  3: { movimientos: 18, metas: { camara: 6, espectrometro: 6, energia: 6 }, objetivo: 'Interpret: collect 6 cameras, 6 spectrometers and 6 energy',
       nota: 'A conclusion needs several lines of evidence together.' },
};
const EVIDENCIAS: Record<number, string[]> = {
  1: ['roca-observada'],
  2: ['roca-pulida', 'roca-analizada'],
  3: ['camara', 'espectrometro', 'energia', 'agua-antigua'],
};

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Tablero = (Ficha | null)[][];

function grupos(t: Tablero): { ficha: Ficha; celdas: Pos[] }[] {
  const marca: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      const v = t[f][c]; if (!v) continue;
      let k = c; while (k + 1 < N && t[f][k + 1] === v) k++;
      if (k - c >= 2) for (let i = c; i <= k; i++) marca[f][i] = true;
      k = f; while (k + 1 < N && t[k + 1][c] === v) k++;
      if (k - f >= 2) for (let i = f; i <= k; i++) marca[i][c] = true;
    }
  }
  const out = new Map<Ficha, Pos[]>();
  for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
    if (marca[f][c]) { const v = t[f][c] as Ficha; if (!out.has(v)) out.set(v, []); out.get(v)!.push([f, c]); }
  }
  // RAT primero: el orden importa en el nivel 2 (pulir antes de analizar).
  return TIPOS.filter(x => out.has(x)).map(ficha => ({ ficha, celdas: out.get(ficha)! }));
}

function hayJugada(t: Tablero): boolean {
  for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
    for (const [df, dc] of [[0, 1], [1, 0]]) {
      const f2 = f + df, c2 = c + dc; if (f2 >= N || c2 >= N) continue;
      [t[f][c], t[f2][c2]] = [t[f2][c2], t[f][c]];
      const ok = grupos(t).length > 0;
      [t[f][c], t[f2][c2]] = [t[f2][c2], t[f][c]];
      if (ok) return true;
    }
  }
  return false;
}

export function crearReglasLocal(levelId: number, seed: number, practica: boolean): PuertoReglas {
  const nivel = NIVELES[levelId] ?? NIVELES[1];
  const rng = mulberry32(seed || 1);
  const azar = (): Ficha => TIPOS[Math.floor(rng() * TIPOS.length)];

  function generar(): Ficha[][] {
    for (;;) {
      const t: Tablero = Array.from({ length: N }, () => Array(N).fill(null));
      for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) {
        let v: Ficha;
        do { v = azar(); } while (
          (c >= 2 && t[f][c - 1] === v && t[f][c - 2] === v) || (f >= 2 && t[f - 1][c] === v && t[f - 2][c] === v));
        t[f][c] = v;
      }
      if (hayJugada(t)) return t as Ficha[][];
    }
  }

  let tablero = generar() as Tablero;
  const inicial = tablero.map(r => [...r]) as Ficha[][];
  const conteo: Conteo = {};
  let movs = nivel.movimientos, puntos = 0, fin = false, ganado = false, malas = 0, nieblaQuitada = 0, ratsJuntados = 0;
  const sumar = (n: number) => { if (!practica) puntos += n; };
  const progreso = (): Extract<Evento, { tipo: 'progreso' }> => ({ tipo: 'progreso', conteo: { ...conteo }, metas: nivel.metas, puntos });
  const cumplida = () => Object.entries(nivel.metas).every(([k, m]) => (conteo[k as Ficha] ?? 0) >= (m as number));

  function intentarSwap(a: Pos, b: Pos): Evento[] {
    if (fin) return [];
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return [];
    const ev: Evento[] = [{ tipo: 'swap', a, b }];
    const t = tablero;
    [t[a[0]][a[1]], t[b[0]][b[1]]] = [t[b[0]][b[1]], t[a[0]][a[1]]];
    if (grupos(t).length === 0) { // sin combinación: se revierte y no gasta movimiento
      [t[a[0]][a[1]], t[b[0]][b[1]]] = [t[b[0]][b[1]], t[a[0]][a[1]]];
      ev.push({ tipo: 'swapRevertido', a: b, b: a });
      return ev;
    }
    if (!practica) movs--;
    ev.push({ tipo: 'energia', delta: practica ? 0 : -1, restante: practica ? nivel.movimientos : movs });

    for (let k = 0; ; k++) {
      const gs = grupos(t); if (gs.length === 0) break;
      if (k > 0) sumar(25 * k); // bono de cascada
      for (const g of gs) {
        sumar(10 * g.celdas.length);
        ev.push({ tipo: 'match', celdas: g.celdas, ficha: g.ficha });
        if (g.ficha === 'rat') ratsJuntados += g.celdas.length;
        const esMeta = g.ficha in nivel.metas;
        if (levelId === 2 && g.ficha === 'espectrometro' && ratsJuntados < PULIDO_MIN) {
          malas++; // analizó sin pulir: esas fichas no cuentan
          ev.push({ tipo: 'malaDecision', mensaje: 'Grind with the RAT first: those tiles do not count' });
        } else if (esMeta) {
          conteo[g.ficha] = (conteo[g.ficha] ?? 0) + g.celdas.length;
        }
      }
      if (levelId === 1) { // cada cámara destapa un pedazo de la foto
        const zonas = Math.min(6, conteo.camara ?? 0) - nieblaQuitada;
        if (zonas > 0) { nieblaQuitada += zonas; ev.push({ tipo: 'nieblaQuitada', zonas }); }
      }
      // quitar, caer y rellenar
      const movimientos: { de: Pos; a: Pos }[] = [], nuevas: { a: Pos; ficha: Ficha }[] = [];
      for (const g of gs) for (const [f, c] of g.celdas) t[f][c] = null;
      for (let c = 0; c < N; c++) {
        let r = N - 1;
        for (let f = N - 1; f >= 0; f--) {
          const v = t[f][c]; if (!v) continue;
          if (f !== r) { movimientos.push({ de: [f, c], a: [r, c] }); t[r][c] = v; t[f][c] = null; }
          r--;
        }
        for (let f = r; f >= 0; f--) { const v = azar(); t[f][c] = v; nuevas.push({ a: [f, c], ficha: v }); }
      }
      ev.push({ tipo: 'caida', movimientos, nuevas });
      ev.push(progreso());
    }

    if (cumplida()) {
      fin = ganado = true;
      if (!practica) sumar(100 + 20 * movs + (malas === 0 ? 50 : 0));
      ev.push(progreso(), { tipo: 'nivelCompleto', ganado: true });
    } else if (!practica && movs <= 0) {
      fin = true; ev.push({ tipo: 'nivelCompleto', ganado: false });
    } else if (!hayJugada(t)) { // remezcla sin costo
      do {
        const planas = t.flat() as Ficha[];
        for (let i = planas.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [planas[i], planas[j]] = [planas[j], planas[i]]; }
        for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) t[f][c] = planas[f * N + c];
      } while (grupos(t).length > 0 || !hayJugada(t));
      ev.push({ tipo: 'mezcla', tablero: t.map(r => [...r]) as Ficha[][] });
    }
    return ev;
  }

  return {
    tableroInicial: () => inicial,
    progresoInicial: progreso,
    intentarSwap,
    objetivo: () => nivel.objetivo,
    nota: () => nivel.nota,
    movimientosMax: () => nivel.movimientos,
    zonasNiebla: () => 6,
    resultado: (tiempoMs: number): Resultado => ({
      levelId, completado: ganado, puntos: practica ? 0 : puntos, tiempoMs,
      evidencias: ganado && !practica ? EVIDENCIAS[levelId] ?? [] : [],
      sinErroresDecision: malas === 0, practica,
    }),
  };
}
