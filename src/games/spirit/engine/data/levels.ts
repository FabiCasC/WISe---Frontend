export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A stretch of ground, in world x (scroll) coordinates. */
export interface Zone {
  x: number;
  w: number;
}

export type Facing = 'north' | 'south';

export interface Slope extends Zone {
  facing: Facing;
}

export interface LevelLayout {
  time: number;
  rocks: Rect[];
  batteries: Rect[];
  /** Level 1: soft sand that slows the rover and can trap it. */
  sand: Zone[];
  /** Level 2: bright silica soil hidden under the dust. */
  silica: Zone[];
  /** Level 3: slopes where the rover can park for the winter. */
  slopes: Slope[];
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'SOFT SAND',
  2: 'THE BROKEN WHEEL',
  3: 'WINTER ON A SLOPE',
};

/**
 * Each level is one real moment of Spirit's mission (NASA, MER mission pages):
 *  1. May 2009: Spirit got stuck in soft sand near Home Plate and never left.
 *  2. 2006-2007: its right front wheel stopped turning; driving backward, the
 *     dragged wheel dug up bright soil that was ~90% silica, a sign of hot
 *     springs or steam vents.
 *  3. Gusev crater is south of the equator, so in winter the Sun stays low in
 *     the NORTH. Spirit survived winters parked on north-facing slopes, its
 *     panels tilted toward the Sun.
 */
export const INSTRUCTIONS: Record<number, string[]> = {
  1: [
    'GOAL: reach the finish with power left.',
    'Pale, rippled ground is SOFT SAND: the wheels spin and drain power.',
    'Stay in it too long and Spirit gets stuck for good (it really happened in 2009).',
    'Jump over the sand and the rocks. Yellow cells give back power.',
    'You LOSE if power or time runs out, or if you get stuck.',
  ],
  2: [
    'GOAL: uncover 3 patches of hidden bright soil.',
    'Spirit\'s right front wheel is broken: it drives backward, dragging it.',
    'The dragged wheel scrapes the ground and uncovers what is under the dust,',
    'but only while Spirit is ON the ground. Jump only when a rock is close.',
    'You LOSE if you reach the end with fewer than 3 patches found.',
  ],
  3: [
    'GOAL: park Spirit for the winter before the season runs out.',
    'Gusev is south of the equator: in winter the Sun is low in the NORTH.',
    'Watch SOLAR POWER: it changes with the ground under the rover.',
    'Stop still for 3 seconds on the slope that gives the most power.',
    'You LOSE if winter arrives and Spirit is not parked well.',
  ],
};

const rock = (x: number): Rect => ({ x, y: 468, w: 48, h: 32 });
const battery = (x: number): Rect => ({ x, y: 425, w: 28, h: 32 });

export function buildLevel(level: number): LevelLayout {
  const out: LevelLayout = { time: 0, rocks: [], batteries: [], sand: [], silica: [], slopes: [] };

  if (level === 1) {
    out.time = 90;
    out.sand.push({ x: 430, w: 130 }, { x: 900, w: 140 }, { x: 1380, w: 150 });
    out.rocks.push(rock(690), rock(1170), rock(1680));
    out.batteries.push(battery(800), battery(1280));
  } else if (level === 2) {
    out.time = 120;
    out.silica.push({ x: 520, w: 70 }, { x: 960, w: 70 }, { x: 1380, w: 70 }, { x: 1760, w: 70 });
    out.rocks.push(rock(740), rock(1180), rock(1580));
    out.batteries.push(battery(860), battery(1470));
  } else {
    out.time = 80;
    out.slopes.push(
      { x: 420, w: 230, facing: 'south' },
      { x: 900, w: 230, facing: 'north' },
      { x: 1400, w: 230, facing: 'south' },
    );
    out.rocks.push(rock(720), rock(1250));
  }
  return out;
}
