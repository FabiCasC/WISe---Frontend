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
  },

  // ------------------------------------------------------- COMING SOON
  soon('hubble-focus', 'Hubble Focus', 'orbit', 'scope', 7, ['Mirrors focus light', 'A blurry image has a cause', 'Telescopes can be repaired in orbit'], { size: 'big', isNew: true }),
  soon('webb-unfold', 'Webb Mirror Unfold', 'deep', 'scope', 6, ['Infrared sees through dust', 'Mirror segments must line up'], { size: 'wide', isNew: true }),
  soon('iss-docking', 'ISS Docking', 'orbit', 'station', 5, ['Relative speed', 'Being in orbit is falling around Earth']),
  soon('ingenuity-flight', 'Ingenuity First Flight', 'mars', 'sat', 4, ['Thin air needs fast blades'], { size: 'wide' }),
  soon('perseverance-samples', 'Perseverance Sample Run', 'mars', 'rover', 6, ['Choose rocks that tell a story', 'Seal the sample to keep it clean']),
  soon('curiosity-climb', 'Curiosity Climb', 'mars', 'rover', 5, ['Rock layers record time']),
  soon('voyager-record', 'Voyager Golden Record', 'deep', 'sat', 4, ['Signals get weaker with distance'], { size: 'big' }),
  soon('juno-storms', 'Juno Storm Chaser', 'giant', 'planet', 6, ['Jupiter’s storms last for centuries']),
  soon('cassini-rings', 'Cassini Ring Dive', 'giant', 'planet', 7, ['Saturn’s rings are ice and rock'], { size: 'wide' }),
  soon('parker-dive', 'Parker Sun Dive', 'sun', 'sun', 5, ['Heat shields reflect heat', 'The corona is hotter than the surface']),
  soon('apollo11-descent', 'Apollo 11 Descent', 'moon', 'rocket', 4, ['Hover, then touch down']),
  soon('apollo13-power', 'Apollo 13 Power Down', 'deep', 'rocket', 6, ['An energy budget can save lives'], { size: 'wide' }),
  soon('gateway-build', 'Lunar Gateway Build', 'moon', 'station', 7, ['Modules connect in orbit']),
  soon('europa-ice', 'Europa Ice Probe', 'giant', 'planet', 5, ['Ice can hide an ocean']),
  soon('kepler-hunt', 'Kepler Planet Hunt', 'deep', 'scope', 6, ['A planet passing dims its star']),
  soon('insight-quake', 'InSight Marsquake', 'mars', 'wave', 5, ['Quakes map a planet’s core']),
  soon('viking-soil', 'Viking Soil Test', 'mars', 'rover', 3, ['Chemistry is not biology']),
  soon('pathfinder-bounce', 'Pathfinder Bounce', 'mars', 'rocket', 3, ['Airbags absorb the landing']),
  soon('new-horizons', 'New Horizons Pluto', 'deep', 'sat', 5, ['A flyby gets one chance'], { size: 'big' }),
  soon('osiris-grab', 'OSIRIS-REx Grab', 'small', 'comet', 6, ['Touch-and-go sampling']),
  soon('landsat-watch', 'Landsat Earth Watch', 'earth', 'earth', 7, ['Colors from space reveal crops', 'Images over time show change'], { size: 'wide' }),
  soon('goes-hurricane', 'GOES Hurricane Eye', 'earth', 'earth', 5, ['Satellites track storms']),
  soon('aurora-catcher', 'Aurora Catcher', 'earth', 'sun', 4, ['The solar wind lights the sky']),
  soon('moon-phases', 'Moon Phases', 'moon', 'moon', 3, ['Phases are about angles, not shadows']),
  soon('rocket-stages', 'Rocket Stages', 'earth', 'rocket', 5, ['Dropping weight lets you go faster']),
  soon('slingshot', 'Orbit Slingshot', 'deep', 'planet', 6, ['Gravity assists save fuel'], { size: 'wide' }),
  soon('suit-check', 'Suit Check', 'orbit', 'astro', 4, ['Pressure keeps astronauts alive']),
  soon('radiation-shield', 'Radiation Shield', 'deep', 'astro', 5, ['Water can block radiation']),
  soon('mars-greenhouse', 'Mars Greenhouse', 'mars', 'astro', 7, ['Plants need pressure, water and light'], { size: 'big' }),
  soon('comet-tail', 'Comet Tail', 'small', 'comet', 3, ['Tails point away from the Sun']),
  soon('solar-eclipse', 'Solar Eclipse', 'sun', 'sun', 3, ['An eclipse is a lined-up shadow']),
  soon('crater-count', 'Crater Count', 'moon', 'moon', 4, ['More craters means an older surface']),
  soon('star-map', 'Star Map', 'deep', 'scope', 5, ['Constellations depend on where you stand']),
  soon('satellite-relay', 'Satellite Relay', 'orbit', 'sat', 4, ['Radio needs a line of sight']),
  soon('sample-return', 'Sample Return', 'mars', 'rocket', 8, ['Launching from another world'], { size: 'wide' }),
  soon('heat-shield', 'Heat Shield', 'earth', 'rocket', 3, ['Re-entry turns speed into heat']),
  soon('parachute-drop', 'Parachute Drop', 'mars', 'rocket', 4, ['Thin air needs big parachutes']),
  soon('exoplanet-colors', 'Exoplanet Colors', 'deep', 'planet', 5, ['Light reveals what air is made of']),
  soon('ice-drill', 'Ice Drill', 'moon', 'astro', 5, ['Water ice hides in dark craters']),
  soon('rover-wheels', 'Rover Wheels', 'mars', 'rover', 3, ['Wheels need grip on sand']),
  soon('venus-lander', 'Venus Lander', 'sun', 'rocket', 5, ['Pressure and heat crush machines']),
  soon('titan-dragonfly', 'Titan Dragonfly', 'giant', 'sat', 6, ['Thick air makes flying easier'], { size: 'wide', isNew: true }),
  soon('station-garden', 'Space Station Garden', 'orbit', 'station', 4, ['Plants grow without a “down”']),
  soon('water-recycler', 'Clean Water Recycler', 'orbit', 'station', 5, ['Closed loops reuse every drop']),
  soon('meteor-watch', 'Meteor Watch', 'earth', 'comet', 3, ['Shooting stars are tiny dust grains']),
  soon('tides', 'Tides and the Moon', 'earth', 'moon', 4, ['The Moon’s gravity pulls the oceans']),
  soon('light-delay', 'Light Speed Delay', 'deep', 'wave', 3, ['Light takes time to travel']),
  soon('gravity-well', 'Gravity Well', 'deep', 'planet', 5, ['Escape velocity']),
  soon('robot-arm', 'Robot Arm', 'orbit', 'station', 4, ['Precise moves in space']),
  soon('mars-weather', 'Weather on Mars', 'mars', 'sun', 3, ['Mars is cold and its air is thin']),
  soon('lunar-night', 'Lunar Night', 'moon', 'moon', 4, ['A lunar night lasts two weeks']),
  soon('jupiter-moons', 'Jupiter Moons', 'giant', 'planet', 5, ['The four Galilean moons']),
  soon('asteroid-belt', 'Asteroid Belt Run', 'small', 'comet', 6, ['The belt is mostly empty space']),
  soon('solar-flare', 'Solar Flare Alert', 'sun', 'sun', 4, ['Space weather affects Earth']),
  soon('night-lights', 'Earth at Night', 'earth', 'earth', 5, ['City lights map where people live']),
  soon('glacier-melt', 'Glacier Melt', 'earth', 'earth', 6, ['Measuring ice from space'], { size: 'big' }),
  soon('ocean-colors', 'Ocean Colors', 'earth', 'earth', 4, ['Plankton colors the ocean']),
  soon('astronaut-training', 'Astronaut Training', 'orbit', 'astro', 7, ['Living in microgravity']),
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
