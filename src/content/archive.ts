/**
 * ARCHIVO ORBITAL — las fichas de la rejilla tipo Friv.
 *
 * Decisión importante: Friv llena la pantalla de accesos. Nuestro plan prohíbe
 * rellenar el portal con botones que no funcionan. La solución es que cada
 * ficha SÍ haga algo real: abre la tarjeta de ese equipo. Son 3 juegos
 * jugables + un archivo navegable de equipos reales. Densidad sin mentira.
 *
 * REVISIÓN PENDIENTE (Ingeniería Estadística): contrastar año y estado de
 * cada entrada antes del corte del domingo. Las notas son deliberadamente
 * cortas y conservadoras.
 */

export type IconKind =
  | 'rover'
  | 'lander'
  | 'orbiter'
  | 'probe'
  | 'rocket'
  | 'telescope'
  | 'station'
  | 'capsule'
  | 'reflector'
  | 'seismo'
  | 'copter'
  | 'balloon'
  | 'impactor'
  | 'satellite'
  | 'flag'
  | 'sample'
  | 'asteroid'
  | 'comet'

/** Dónde quedó. Decide el color de la ficha en la rejilla. */
export type Place =
  | 'luna'
  | 'marte'
  | 'venus'
  | 'titan'
  | 'mercurio'
  | 'cometa'
  | 'asteroide'
  | 'orbita'
  | 'profundo'
  | 'gigante'

/** activo: sigue operando · silencioso: dejó de comunicar · viaje: sigue en ruta */
export type Status = 'activo' | 'silencioso' | 'viaje'

export interface ArchiveItem {
  name: string
  kind: IconKind
  place: Place
  year: number
  status: Status
  note: string
}

export const PLACE_LABEL: Record<Place, string> = {
  luna: 'Moon',
  marte: 'Mars',
  venus: 'Venus',
  titan: 'Titan',
  mercurio: 'Mercury',
  cometa: 'Comet',
  asteroide: 'Asteroid',
  orbita: 'Earth orbit',
  profundo: 'Deep space',
  gigante: 'Giant planet',
}

export const STATUS_LABEL: Record<Status, string> = {
  activo: 'Still working',
  silencioso: 'No longer talking',
  viaje: 'Still traveling',
}

/**
 * Degradados por destino: la rejilla se lee por color antes que por texto.
 *
 * Saturación alta a propósito. El público objetivo son chicos de 9 a 14 años
 * y la referencia visual es un arcade: las fichas tienen que parecer botones
 * de caramelo, no paneles de instrumentos.
 */
export const PLACE_COLORS: Record<Place, [string, string]> = {
  luna: ['#7FD4FF', '#2B5FCC'],
  marte: ['#FF8A4C', '#C42D2D'],
  venus: ['#FFD24A', '#E07A10'],
  titan: ['#FFB056', '#B4480F'],
  mercurio: ['#9FC4E8', '#3E5A99'],
  cometa: ['#5BF3D6', '#0E8FA8'],
  asteroide: ['#B6E86A', '#3F8A32'],
  orbita: ['#5BA8FF', '#2740C9'],
  profundo: ['#C77BFF', '#6A2BC4'],
  gigante: ['#FFA36B', '#C0541C'],
}

export const ARCHIVE: ArchiveItem[] = [
  // ---------------------------------------------------------------- LUNA
  { name: 'Apollo 11 · descent stage', kind: 'lander', place: 'luna', year: 1969, status: 'silencioso', note: 'The Eagle lander base is still in Mare Tranquillitatis.' },
  { name: 'Apollo 11 · retroreflector', kind: 'reflector', place: 'luna', year: 1969, status: 'activo', note: 'A passive panel. It bounces back laser pulses sent from Earth.' },
  { name: 'Apollo 12 · ALSEP', kind: 'seismo', place: 'luna', year: 1969, status: 'silencioso', note: 'Experiment station switched off by command from Earth in 1977.' },
  { name: 'Surveyor 3', kind: 'lander', place: 'luna', year: 1967, status: 'silencioso', note: 'The Apollo 12 crew brought back parts of it 31 months later.' },
  { name: 'Apollo 14 · ALSEP', kind: 'seismo', place: 'luna', year: 1971, status: 'silencioso', note: 'One of the stations of the lunar seismic network.' },
  { name: 'Apollo 15 · seismometer', kind: 'seismo', place: 'luna', year: 1971, status: 'silencioso', note: 'It recorded vibrations of the lunar ground. Star of one of our games.' },
  { name: 'Apollo 15 · retroreflector', kind: 'reflector', place: 'luna', year: 1971, status: 'activo', note: 'The largest of the Apollo reflectors. Star of one of our games.' },
  { name: 'Apollo 15 · lunar rover', kind: 'rover', place: 'luna', year: 1971, status: 'silencioso', note: 'The first crewed vehicle driven on the Moon.' },
  { name: 'Apollo 16 · lunar rover', kind: 'rover', place: 'luna', year: 1972, status: 'silencioso', note: 'It was left parked in the Descartes highlands.' },
  { name: 'Apollo 17 · lunar rover', kind: 'rover', place: 'luna', year: 1972, status: 'silencioso', note: 'The last crewed vehicle driven on another world.' },
  { name: 'Apollo 17 · ALSEP', kind: 'seismo', place: 'luna', year: 1972, status: 'silencioso', note: 'The last science station set up by a crew.' },
  { name: 'Lunokhod 1', kind: 'rover', place: 'luna', year: 1970, status: 'silencioso', note: 'The first remote-controlled rover to work on another world.' },
  { name: 'Lunokhod 2', kind: 'rover', place: 'luna', year: 1973, status: 'silencioso', note: 'It carries a retroreflector that is still used for measurements.' },
  { name: 'Luna 2', kind: 'impactor', place: 'luna', year: 1959, status: 'silencioso', note: 'The first human-made object to reach the surface of the Moon.' },
  { name: 'Luna 9', kind: 'lander', place: 'luna', year: 1966, status: 'silencioso', note: 'The first soft landing on the Moon that sent back pictures.' },
  { name: 'Luna 16', kind: 'sample', place: 'luna', year: 1970, status: 'silencioso', note: 'The first robotic sample collection returned to Earth.' },
  { name: 'Luna 17', kind: 'lander', place: 'luna', year: 1970, status: 'silencioso', note: 'The lander that delivered Lunokhod 1.' },
  { name: 'Ranger 7', kind: 'impactor', place: 'luna', year: 1964, status: 'silencioso', note: 'It photographed the surface right up to the moment of impact.' },
  { name: 'Changʼe 3', kind: 'lander', place: 'luna', year: 2013, status: 'silencioso', note: 'A lander in Mare Imbrium.' },
  { name: 'Yutu', kind: 'rover', place: 'luna', year: 2013, status: 'silencioso', note: 'A rover that lost its mobility but kept measuring for a while.' },
  { name: 'Changʼe 4', kind: 'lander', place: 'luna', year: 2019, status: 'silencioso', note: 'The first landing on the far side of the Moon.' },
  { name: 'Yutu-2', kind: 'rover', place: 'luna', year: 2019, status: 'silencioso', note: 'The rover that has driven the farthest on the far side.' },
  { name: 'Changʼe 5', kind: 'sample', place: 'luna', year: 2020, status: 'silencioso', note: 'It returned lunar samples after more than four decades without any.' },
  { name: 'Vikram', kind: 'lander', place: 'luna', year: 2023, status: 'silencioso', note: 'It landed near the Moon’s south polar region.' },
  { name: 'Pragyan', kind: 'rover', place: 'luna', year: 2023, status: 'silencioso', note: 'A small rover deployed from Vikram.' },
  { name: 'SLIM', kind: 'lander', place: 'luna', year: 2024, status: 'silencioso', note: 'It demonstrated a high-precision landing.' },
  { name: 'LCROSS', kind: 'impactor', place: 'luna', year: 2009, status: 'silencioso', note: 'It crashed on purpose so the material it threw up could be studied.' },
  { name: 'GRAIL · Ebb and Flow', kind: 'impactor', place: 'luna', year: 2012, status: 'silencioso', note: 'Twin probes that measured the Moon’s gravity.' },
  { name: 'LADEE', kind: 'orbiter', place: 'luna', year: 2014, status: 'silencioso', note: 'It studied the Moon’s thin exosphere before impact.' },
  { name: 'Apollo 11 flag', kind: 'flag', place: 'luna', year: 1969, status: 'silencioso', note: 'A symbolic object, not a science instrument.' },

  // --------------------------------------------------------------- MARTE
  { name: 'Viking 1 · lander', kind: 'lander', place: 'marte', year: 1976, status: 'silencioso', note: 'The first long-lasting US landing on Mars.' },
  { name: 'Viking 2 · lander', kind: 'lander', place: 'marte', year: 1976, status: 'silencioso', note: 'The second lander of the same mission, in Utopia Planitia.' },
  { name: 'Mars Pathfinder', kind: 'lander', place: 'marte', year: 1997, status: 'silencioso', note: 'The lander that deployed the Sojourner rover.' },
  { name: 'Sojourner', kind: 'rover', place: 'marte', year: 1997, status: 'silencioso', note: 'The first rover to drive on the surface of Mars.' },
  { name: 'Spirit (MER-A)', kind: 'rover', place: 'marte', year: 2004, status: 'silencioso', note: 'It got stuck in soft soil. Star of one of our games.' },
  { name: 'Opportunity (MER-B)', kind: 'rover', place: 'marte', year: 2004, status: 'silencioso', note: 'It worked for fifteen years in Meridiani. Star of one of our games.' },
  { name: 'Phoenix', kind: 'lander', place: 'marte', year: 2008, status: 'silencioso', note: 'It dug into the Martian arctic and found water ice.' },
  { name: 'Curiosity', kind: 'rover', place: 'marte', year: 2012, status: 'activo', note: 'It is still exploring Gale crater.' },
  { name: 'InSight', kind: 'seismo', place: 'marte', year: 2018, status: 'silencioso', note: 'It detected marsquakes until it ran out of power.' },
  { name: 'Perseverance', kind: 'rover', place: 'marte', year: 2021, status: 'activo', note: 'It explores Jezero crater and prepares samples.' },
  { name: 'Ingenuity', kind: 'copter', place: 'marte', year: 2021, status: 'silencioso', note: 'The first powered, controlled flight on another planet.' },
  { name: 'Zhurong', kind: 'rover', place: 'marte', year: 2021, status: 'silencioso', note: 'A rover that explored Utopia Planitia.' },
  { name: 'Mars 3', kind: 'lander', place: 'marte', year: 1971, status: 'silencioso', note: 'It transmitted for only a few seconds after landing.' },
  { name: 'Beagle 2', kind: 'lander', place: 'marte', year: 2003, status: 'silencioso', note: 'It reached the surface but never fully unfolded.' },
  { name: 'Schiaparelli', kind: 'lander', place: 'marte', year: 2016, status: 'silencioso', note: 'An entry-and-descent test lander that did not survive touchdown.' },
  { name: 'Perseverance heat shield', kind: 'capsule', place: 'marte', year: 2021, status: 'silencioso', note: 'Dropped during descent; it can be seen from orbit.' },
  { name: 'Perseverance parachute', kind: 'capsule', place: 'marte', year: 2021, status: 'silencioso', note: 'It lies on the ground next to the back shell.' },
  { name: 'Mars Odyssey', kind: 'orbiter', place: 'marte', year: 2001, status: 'activo', note: 'One of the longest-serving orbiters.' },
  { name: 'Mars Reconnaissance Orbiter', kind: 'orbiter', place: 'marte', year: 2006, status: 'activo', note: 'Its high-resolution camera photographs hardware on the surface.' },
  { name: 'MAVEN', kind: 'orbiter', place: 'marte', year: 2014, status: 'activo', note: 'It studies how Mars lost its atmosphere.' },
  { name: 'Mars Express', kind: 'orbiter', place: 'marte', year: 2003, status: 'activo', note: 'A long-lasting European orbiter.' },

  // --------------------------------------------------------------- VENUS
  { name: 'Venera 7', kind: 'lander', place: 'venus', year: 1970, status: 'silencioso', note: 'The first transmission from the surface of another planet.' },
  { name: 'Venera 9', kind: 'lander', place: 'venus', year: 1975, status: 'silencioso', note: 'It sent the first picture from the ground of Venus.' },
  { name: 'Venera 13', kind: 'lander', place: 'venus', year: 1982, status: 'silencioso', note: 'It survived the heat and pressure longer than planned.' },
  { name: 'Venera 14', kind: 'lander', place: 'venus', year: 1982, status: 'silencioso', note: 'Twin of Venera 13, with color pictures of the ground.' },
  { name: 'Pioneer Venus · probes', kind: 'probe', place: 'venus', year: 1978, status: 'silencioso', note: 'Several probes measured the atmosphere as they fell through it.' },
  { name: 'Vega 1 · balloon', kind: 'balloon', place: 'venus', year: 1985, status: 'silencioso', note: 'A balloon that floated in the atmosphere of Venus for hours.' },
  { name: 'Vega 2 · balloon', kind: 'balloon', place: 'venus', year: 1985, status: 'silencioso', note: 'The second atmospheric balloon of the same mission.' },

  // --------------------------------------------- TITÁN, COMETAS Y ASTEROIDES
  { name: 'Huygens', kind: 'probe', place: 'titan', year: 2005, status: 'silencioso', note: 'The only landing ever made on a moon of the outer solar system.' },
  { name: 'Philae', kind: 'lander', place: 'cometa', year: 2014, status: 'silencioso', note: 'It landed on comet 67P after bouncing several times.' },
  { name: 'Rosetta', kind: 'orbiter', place: 'cometa', year: 2016, status: 'silencioso', note: 'It ended its mission by descending onto the comet itself.' },
  { name: 'Deep Impact · impactor', kind: 'impactor', place: 'cometa', year: 2005, status: 'silencioso', note: 'It struck comet Tempel 1 to study what is inside.' },
  { name: 'NEAR Shoemaker', kind: 'probe', place: 'asteroide', year: 2001, status: 'silencioso', note: 'The first spacecraft to land on an asteroid, Eros.' },
  { name: 'MINERVA-II', kind: 'rover', place: 'asteroide', year: 2018, status: 'silencioso', note: 'Small hopping robots deployed on Ryugu.' },
  { name: 'MASCOT', kind: 'lander', place: 'asteroide', year: 2018, status: 'silencioso', note: 'A lander that worked for a few hours on the surface of Ryugu.' },
  { name: 'DART', kind: 'impactor', place: 'asteroide', year: 2022, status: 'silencioso', note: 'It hit Dimorphos to test how to push an asteroid off course.' },
  { name: 'Hayabusa2 · SCI', kind: 'impactor', place: 'asteroide', year: 2019, status: 'silencioso', note: 'It made an artificial crater to reach buried material.' },

  // ----------------------------------------- GIGANTES Y ESPACIO PROFUNDO
  { name: 'Galileo', kind: 'orbiter', place: 'gigante', year: 2003, status: 'silencioso', note: 'It was sent into Jupiter’s atmosphere at the end of its mission.' },
  { name: 'Galileo · atmospheric probe', kind: 'probe', place: 'gigante', year: 1995, status: 'silencioso', note: 'It dropped into Jupiter’s atmosphere, measuring as it fell.' },
  { name: 'Cassini', kind: 'orbiter', place: 'gigante', year: 2017, status: 'silencioso', note: 'It ended by diving into Saturn on purpose.' },
  { name: 'Juno', kind: 'orbiter', place: 'gigante', year: 2016, status: 'activo', note: 'It orbits Jupiter, studying its interior and auroras.' },
  { name: 'MESSENGER', kind: 'orbiter', place: 'mercurio', year: 2015, status: 'silencioso', note: 'It mapped Mercury and finally crashed into it.' },
  { name: 'Mariner 4', kind: 'probe', place: 'profundo', year: 1965, status: 'silencioso', note: 'The first close-up pictures of the surface of Mars.' },
  { name: 'Mariner 9', kind: 'orbiter', place: 'profundo', year: 1971, status: 'silencioso', note: 'The first spacecraft to orbit another planet.' },
  { name: 'Voyager 1', kind: 'probe', place: 'profundo', year: 1977, status: 'viaje', note: 'The most distant human-made object. It still sends data.' },
  { name: 'Voyager 2', kind: 'probe', place: 'profundo', year: 1977, status: 'viaje', note: 'The only spacecraft to have visited Uranus and Neptune.' },
  { name: 'Pioneer 10', kind: 'probe', place: 'profundo', year: 1972, status: 'viaje', note: 'It keeps moving away, now out of contact.' },
  { name: 'Pioneer 11', kind: 'probe', place: 'profundo', year: 1973, status: 'viaje', note: 'The first spacecraft to fly close past Saturn.' },
  { name: 'New Horizons', kind: 'probe', place: 'profundo', year: 2006, status: 'activo', note: 'It flew past Pluto and keeps heading into the Kuiper Belt.' },

  // --------------------------------------------------- ÓRBITA TERRESTRE
  { name: 'International Space Station', kind: 'station', place: 'orbita', year: 1998, status: 'activo', note: 'A laboratory with people on board continuously since 2000.' },
  { name: 'Hubble Space Telescope', kind: 'telescope', place: 'orbita', year: 1990, status: 'activo', note: 'Repaired and upgraded in space several times.' },
  { name: 'James Webb Space Telescope', kind: 'telescope', place: 'profundo', year: 2021, status: 'activo', note: 'It observes in infrared from a point 1.5 million km away.' },
  { name: 'Kepler Space Telescope', kind: 'telescope', place: 'orbita', year: 2009, status: 'silencioso', note: 'It ran out of fuel after finding thousands of exoplanets.' },
  { name: 'Spitzer', kind: 'telescope', place: 'profundo', year: 2003, status: 'silencioso', note: 'An infrared observatory retired in 2020.' },
  { name: 'Chandra', kind: 'telescope', place: 'orbita', year: 1999, status: 'activo', note: 'An X-ray observatory in a very elongated orbit.' },
  { name: 'Gaia', kind: 'telescope', place: 'profundo', year: 2013, status: 'silencioso', note: 'It measured the positions of more than a billion stars.' },
  { name: 'Vanguard 1', kind: 'satellite', place: 'orbita', year: 1958, status: 'silencioso', note: 'The oldest human-made object still in orbit.' },
  { name: 'Explorer 1', kind: 'satellite', place: 'orbita', year: 1958, status: 'silencioso', note: 'The first US satellite; it detected the radiation belts.' },
  { name: 'Telstar 1', kind: 'satellite', place: 'orbita', year: 1962, status: 'silencioso', note: 'It relayed the first television signals between continents.' },
  { name: 'Skylab', kind: 'station', place: 'orbita', year: 1973, status: 'silencioso', note: 'The first US space station; it reentered in 1979.' },
  { name: 'Saturn V · third stage', kind: 'rocket', place: 'profundo', year: 1971, status: 'silencioso', note: 'Several stages were aimed at the Moon to calibrate seismometers.' },
]

/** Conteos para la cabecera del archivo. */
export const ARCHIVE_STATS = {
  total: ARCHIVE.length,
  activos: ARCHIVE.filter((i) => i.status === 'activo').length,
  lunares: ARCHIVE.filter((i) => i.place === 'luna').length,
  marcianos: ARCHIVE.filter((i) => i.place === 'marte').length,
}
