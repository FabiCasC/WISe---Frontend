/**
 * GAME CATALOG — one entry per game on the arcade wall.
 * -------------------------------------------------------------------------
 * To add a game:
 *   1. Create src/games/<id>/index.ts exporting `mountGame` (see shared/types).
 *   2. Add its loader in src/app/GameHost.tsx (LOADERS).
 *   3. Add an entry here with status 'live'.
 *
 * Each game declares how many levels it has (any number) and the concepts it
 * teaches. Games report decisions with these concept ids in GameResult, and
 * the teacher dashboard shows which ones each student learned.
 *
 * Entries with status 'soon' are slots the team is building right now: they
 * show on the wall as "Soon" and cannot be played yet.
 */

export type Destination = 'moon' | 'mars' | 'earth' | 'sun' | 'deep' | 'giant' | 'orbit' | 'small'

export type WallIcon =
  | 'rover'
  | 'moon'
  | 'rocket'
  | 'scope'
  | 'sat'
  | 'planet'
  | 'sun'
  | 'comet'
  | 'astro'
  | 'wave'
  | 'station'
  | 'earth'

export interface Concept {
  /** Stable id used in GameResult.decisions (never translate it). */
  id: string
  /** What the student learns, in one short line. */
  label: string
}

export interface GameEntry {
  id: string
  title: string
  destination: Destination
  icon: WallIcon
  levels: number
  concepts: Concept[]
  status: 'live' | 'soon'
  /** Optional cover image (public/…). Without it the wall draws the icon. */
  art?: string
  /** Bigger tile on the wall. */
  size?: 'big' | 'wide'
  isNew?: boolean
}

export const DESTINATIONS: Record<Destination, { label: string; color: string }> = {
  moon: { label: 'Moon', color: '#6f7b93' },
  mars: { label: 'Mars', color: '#d2501c' },
  earth: { label: 'Earth', color: '#1c6fd1' },
  sun: { label: 'Sun', color: '#d98a00' },
  deep: { label: 'Deep space', color: '#4b36b8' },
  giant: { label: 'Giants', color: '#a8692d' },
  orbit: { label: 'In orbit', color: '#0d8f79' },
  small: { label: 'Comets & asteroids', color: '#7a5e48' },
}

/** Short helper so "soon" slots stay one line each. */
function soon(
  id: string,
  title: string,
  destination: Destination,
  icon: WallIcon,
  levels: number,
  concepts: string[],
  extra: Partial<GameEntry> = {},
): GameEntry {
  return {
    id,
    title,
    destination,
    icon,
    levels,
    concepts: concepts.map((label, i) => ({ id: `${id}-${i + 1}`, label })),
    status: 'soon',
    ...extra,
  }
}

export const GAMES: GameEntry[] = [
  // ------------------------------------------------------------------ LIVE
  {
    id: 'opportunity',
    title: 'Opportunity Echoes',
    destination: 'mars',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'observar-primero', label: 'Image the rock with cameras before touching it' },
      { id: 'pulir-antes-de-analizar', label: 'Grind off the dusty crust before you analyze a rock' },
      { id: 'varias-evidencias', label: 'A conclusion needs several lines of evidence (images, chemistry, power)' },
    ],
    status: 'live',
    art: 'assets/missions/opportunity.webp',
    size: 'big',
  },
  {
    id: 'lunar-signals',
    title: 'Two Signals from the Moon',
    destination: 'moon',
    icon: 'wave',
    levels: 3,
    concepts: [
      { id: 'laser-mide-distancia', label: 'A laser’s round-trip time to the Apollo retroreflector measures the distance to the Moon' },
      { id: 'tres-estaciones-ubican-sismo', label: 'Three seismometer stations are needed to locate a moonquake' },
      { id: 'datos-insuficientes', label: 'With too few stations, a scientist says the data is not enough' },
    ],
    status: 'live',
    art: 'assets/missions/lunar-signals.webp',
    size: 'big',
  },
  {
    id: 'spirit',
    title: 'Spirit’s Last Route',
    destination: 'mars',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'arena-gasta-energia', label: 'Soft sand drains power and can trap a rover (Spirit, 2009)' },
      { id: 'silice-agua-caliente', label: 'Bright silica soil is a clue that hot water once flowed there' },
      { id: 'inclinar-paneles-al-sol', label: 'In winter, tilting solar panels toward the low Sun gives more power' },
    ],
    status: 'live',
    art: 'assets/missions/spirit.webp',
    size: 'big',
  },

  // Arcade minigames by Kevin (Canvas 2D, src/games/<id>, texts in content/arcade.ts)
  {
    id: 'dust-run',
    title: 'Storm over Meridiani',
    destination: 'mars',
    icon: 'sun',
    levels: 3,
    concepts: [{ id: 'sin-luz-sin-energia', label: 'Without sunlight, a solar rover has no energy' }],
    status: 'live',
    isNew: true,
    art: 'assets/games/dust-run.webp',
  },
  {
    id: 'gusev-maze',
    title: 'Gusev Maze',
    destination: 'mars',
    icon: 'rover',
    levels: 3,
    concepts: [{ id: 'remolinos-limpian-paneles', label: 'Dust devils can clean a rover’s solar panels' }],
    status: 'live',
    isNew: true,
    art: 'assets/games/gusev-maze.webp',
  },
  {
    id: 'sun-shade',
    title: 'Sun and Shade',
    destination: 'mars',
    icon: 'astro',
    levels: 3,
    concepts: [
      { id: 'solar-vs-nuclear', label: 'Solar rovers stop in the shade; nuclear (RTG) rovers do not need sunlight' },
    ],
    status: 'live',
    isNew: true,
    size: 'wide',
    art: 'assets/games/sun-shade.webp',
  },
  {
    id: 'artemis-landing',
    title: 'Artemis Landing',
    destination: 'moon',
    icon: 'rocket',
    levels: 3,
    concepts: [
      { id: 'sin-aire-solo-motor', label: 'No air on the Moon: only the engine can brake' },
      { id: 'combustible-es-tiempo', label: 'Fuel is time — hovering burns it and buys nothing' },
      { id: 'gravedad-baja-no-es-nula', label: 'Low gravity is still gravity, and drift still tips you over' },
    ],
    status: 'live',
    isNew: true,
    // 'big' on purpose: at one cell the two-word name wraps and the tile's
    // contents overflow a 96px box, which clipped the icon and pushed the
    // PLAY and LV chips outside it.
    size: 'big',
    art: 'assets/games/artemis-landing.webp',
  },
  {
    id: 'dart-impact',
    title: 'DART Impact',
    destination: 'small',
    icon: 'comet',
    levels: 3,
    concepts: [
      { id: 'momento-desvia-asteroide', label: 'A small, fast impact can move an asteroid' },
      { id: 'golpe-frontal-frena', label: 'Only a head-on hit takes speed away' },
      { id: 'eyecta-multiplica', label: 'The debris thrown off pushes back, harder than the spacecraft' },
    ],
    status: 'live',
    isNew: true,
    size: 'big',
    art: 'assets/games/dart-impact.webp',
  },
  {
    id: 'orbital-grid',
    title: 'Keep the Link',
    destination: 'earth',
    icon: 'wave',
    levels: 3,
    concepts: [
      { id: 'la-tierra-gira-oculta-antena', label: 'The Earth turns, so one antenna loses a probe for half the day' },
      { id: 'tres-estaciones-cobertura', label: 'Three antennas spread around the world keep probes always in contact' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/orbital-grid.webp',
  },

  // Seven abandoned-hardware games (Canvas 2D, src/games/<id>, texts in content/arcade.ts)
  {
    id: 'eagle-liftoff',
    title: 'Eagle Liftoff',
    destination: 'moon',
    icon: 'rocket',
    levels: 3,
    concepts: [
      { id: 'ventana-de-lanzamiento', label: 'Lift off when the ship you must meet is a little ahead of you' },
      { id: 'orbita-baja-mas-rapida', label: 'A lower orbit is faster: drop below a ship to catch it, then climb back' },
    ],
    status: 'live',
    isNew: true,
    size: 'wide',
    art: 'assets/games/eagle-liftoff.webp',
  },
  {
    id: 'lunar-rover',
    title: 'Moon Buggy Run',
    destination: 'moon',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'bateria-no-recargable', label: 'The Apollo rover’s batteries could not be recharged: plan a short route' },
      { id: 'distancia-caminando-al-lm', label: 'Stay close enough to walk back to the lunar module if the rover breaks' },
      { id: 'navegar-de-vuelta-al-lm', label: 'The rover’s navigation computer always knew the way back to the lunar module' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/lunar-rover.webp',
  },

    {
    id: 'nasa-numbers',
    title: 'NASA Number Mission',
    destination: 'moon',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'nasa-numbers-1', label: 'Halving the range each time finds any number in a few tries' },
      { id: 'nasa-numbers-2', label: 'Real measurements come with a margin of error' },
      { id: 'nasa-numbers-3', label: 'Distance, the speed of light and the laser echo time are linked' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/nasa-numbers.webp',
  },
  
  {
    id: 'pathfinder-bounce',
    title: 'Pathfinder Bounce',
    destination: 'mars',
    icon: 'rocket',
    levels: 3,
    concepts: [
      { id: 'escudo-termico-frena', label: 'The heat shield does most of the braking before a parachute can open' },
      { id: 'aire-fino-cohetes', label: 'Mars air is too thin for a parachute alone: rockets brake the last part' },
      { id: 'airbags-amortiguan', label: 'Airbags let a lander survive hitting the ground and bounce to a stop' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/pathfinder-bounce.webp',
  },
  {
    id: 'sojourner-commands',
    title: 'Sojourner’s Plan',
    destination: 'mars',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'retraso-de-senal', label: 'Radio takes minutes to reach Mars, so rover drivers plan moves ahead instead of steering live' },
      { id: 'apxs-va-detras', label: 'Sojourner’s APXS was on its back: it backed up to rocks to measure them' },
      { id: 'autonomia-evita-peligros', label: 'Far from Earth, a rover must stop by itself in front of hazards' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/sojourner-commands.webp',
  },
  {
    id: 'phoenix-ice',
    title: 'Phoenix Ice Dig',
    destination: 'mars',
    icon: 'astro',
    levels: 3,
    concepts: [
      { id: 'hielo-sublima', label: 'On Mars, exposed water ice turns straight into gas: watching it vanish over days proves it is ice' },
      { id: 'muestra-fresca', label: 'An ice sample must be fresh: ice left in the open sublimates and shows no water' },
      { id: 'invierno-sin-energia', label: 'As winter comes, a solar lander gets less energy each day until it goes silent' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/phoenix-ice.webp',
  },
  {
    id: 'ingenuity-flight',
    title: 'Ingenuity: Fly in Thin Air',
    destination: 'mars',
    icon: 'sat',
    levels: 3,
    concepts: [
      { id: 'aire-fino-giro-rapido', label: 'Thin air gives little lift, so a Mars helicopter must spin its blades very fast' },
      { id: 'bateria-limita-vuelo', label: 'A solar-charged battery allows only about one 90-second flight per day' },
      { id: 'navegar-con-textura', label: 'Ingenuity’s camera needed textured ground; smooth sand ripples ended its last flight' },
    ],
    status: 'live',
    isNew: true,
    size: 'wide',
    art: 'assets/games/ingenuity-flight.webp',
  },
  {
    id: 'lro-search',
    title: 'Seen from Orbit',
    destination: 'moon',
    icon: 'scope',
    levels: 3,
    concepts: [
      { id: 'sombra-revela-altura', label: 'A low Sun makes tall things throw long shadows, which reveal landers from orbit' },
      { id: 'sol-alto-revela-brillo', label: 'A high Sun shrinks shadows and shows brightness differences like footpaths' },
      { id: 'cambio-o-iluminacion', label: 'Comparing photos: a changed shadow is the Sun moving, not a new object' },
    ],
    status: 'live',
    isNew: true,
    art: 'assets/games/lro-search.webp',
  },
  // Snake Express — Lunar Express
  {
    id: 'snake-express',
    title: 'Lunar Express',
    destination: 'moon',
    icon: 'rover',
    levels: 3,
    concepts: [
      { id: 'mares-son-lava', label: 'The dark plains (maria) are cooled lava: dark basalt rock' },
      { id: 'tierras-altas-corteza-antigua', label: 'The bright highlands are the Moon’s oldest crust' },
      { id: 'experimentos-se-quedan', label: 'Science packages were left on purpose, away from the lunar module, to keep sending data' },
    ],
    status: 'live',
    isNew: true,
    size: 'wide',
    art: 'assets/games/snake-express.webp',
  },

  // ------------------------------------------------------- COMING SOON
  soon('perseverance-samples', 'Perseverance Sample Run', 'mars', 'rover', 6, ['Choose rocks that tell a story', 'Seal the sample to keep it clean']),
  soon('curiosity-climb', 'Curiosity Climb', 'mars', 'rover', 5, ['Rock layers record time']),
  soon('gateway-build', 'Lunar Gateway Build', 'moon', 'station', 7, ['Modules connect in orbit']),
  soon('insight-quake', 'InSight Marsquake', 'mars', 'wave', 5, ['Quakes map a planet’s core']),
  soon('viking-soil', 'Viking Soil Test', 'mars', 'rover', 3, ['Chemistry is not biology']),
  soon('moon-phases', 'Moon Phases', 'moon', 'moon', 3, ['Phases are about angles, not shadows']),
  soon('crater-count', 'Crater Count', 'moon', 'moon', 4, ['More craters means an older surface']),
  soon('sample-return', 'Sample Return', 'mars', 'rocket', 8, ['Launching from another world'], { size: 'wide' }),
  soon('parachute-drop', 'Parachute Drop', 'mars', 'rocket', 4, ['Thin air needs big parachutes']),
  soon('ice-drill', 'Ice Drill', 'moon', 'astro', 5, ['Water ice hides in dark craters']),
  soon('rover-wheels', 'Rover Wheels', 'mars', 'rover', 3, ['Wheels need grip on sand']),
  soon('mars-weather', 'Weather on Mars', 'mars', 'sun', 3, ['Mars is cold and its air is thin']),
  soon('lunar-night', 'Lunar Night', 'moon', 'moon', 4, ['A lunar night lasts two weeks']),
]

export function getGame(id: string): GameEntry | undefined {
  return GAMES.find((g) => g.id === id)
}

/** Concept label by id, across every game (for the teacher dashboard). */
export function conceptLabel(id: string): string {
  for (const g of GAMES) {
    const c = g.concepts.find((x) => x.id === id)
    if (c) return c.label
  }
  return id
}

export const LIVE_GAMES = GAMES.filter((g) => g.status === 'live')
