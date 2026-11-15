export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LevelLayout {
  time: number;
  rocks: Rect[];
  batteries: Rect[];
  samples: Rect[];
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'CONTROL',
  2: 'VICTORIA',
  3: 'DESCUBRIMIENTO',
};

export const INSTRUCTIONS: Record<number, string[]> = {
  1: [
    'OBJETIVO: llega a la meta conservando energía.',
    'Evita las rocas: cada choque resta 25 puntos de energía.',
    'Recoge baterías amarillas para recuperar energía.',
    'PIERDES si la energía llega a cero o se acaba el tiempo.',
    'GANAS si alcanzas la meta antes de que termine el tiempo.',
  ],
  2: [
    'OBJETIVO: gana la carrera contra el rover rival.',
    'El rival AZUL es virtual: avanza por el carril superior.',
    'Avanza con flecha derecha; salta rocas y recoge baterías.',
    'PIERDES si el rival virtual llega primero o te quedas sin energía',
    'o se acaba el tiempo. GANAS si Spirit llega primero.',
  ],
  3: [
    'OBJETIVO: encuentra y analiza tres muestras marcianas.',
    'Avanza por el terreno hasta tocar cada muestra brillante.',
    'Cuando aparezca una pregunta, responde con 1, 2 o 3.',
    'Cada respuesta incorrecta resta 30 puntos de energía.',
    'PIERDES si la energía llega a cero o se acaba el tiempo.',
  ],
};

const rock = (x: number): Rect => ({ x, y: 468, w: 48, h: 32 });
const battery = (x: number): Rect => ({ x, y: 425, w: 28, h: 32 });
const sample = (x: number): Rect => ({ x, y: 430, w: 32, h: 32 });

/** Equivale a reset_level() del original. */
export function buildLevel(level: number): LevelLayout {
  const out: LevelLayout = { time: 0, rocks: [], batteries: [], samples: [] };

  if (level === 1) {
    out.time = 90;
    for (let i = 0; i < 8; i++) {
      const x = 420 + i * 245;
      out.rocks.push(rock(x));
      if (i % 2 === 0) out.batteries.push(battery(x + 115));
    }
  } else if (level === 2) {
    out.time = 120;
    for (let i = 0; i < 8; i++) {
      const x = 390 + i * 245;
      out.rocks.push(rock(x));
      if (i % 2 === 1) out.batteries.push(battery(x + 115));
    }
  } else {
    out.time = 150;
    out.samples.push(sample(440), sample(1020), sample(1600));
    out.rocks.push(rock(760), rock(1330));
    out.batteries.push(battery(650), battery(1190));
  }
  return out;
}
