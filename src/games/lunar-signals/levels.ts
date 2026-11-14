import type { QuakeDef } from './rules'

/**
 * Adjustable data (no need to touch the engine to change them).
 * Abstract map of 100 x 100 units. ⚠️ Number and position of the real
 * Apollo 15/ALSEP stations: check against an official source before the cutoff.
 */
const STATIONS = (cWorking: boolean) => [
  { id: 'A', pos: { x: 20, y: 70 }, working: true },
  { id: 'B', pos: { x: 80, y: 60 }, working: true },
  { id: 'C', pos: { x: 50, y: 15 }, working: cWorking },
]

export const LEVEL1_MEASURED_ECHO_S = 2.56 // ⚠️ example value; verify

export const LEVEL2_QUAKE: QuakeDef = {
  id: 'level-2',
  epicenter: { x: 45, y: 55 },
  stations: STATIONS(true),
  vp: 10,
  vs: 5.5,
  tolerance: 2,
}

export const LEVEL3_QUAKE: QuakeDef = {
  id: 'level-3',
  epicenter: { x: 60, y: 40 },
  stations: STATIONS(false), // station C stops working
  vp: 10,
  vs: 5.5,
  tolerance: 2,
}
