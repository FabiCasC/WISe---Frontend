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
  luna: 'Luna',
  marte: 'Marte',
  venus: 'Venus',
  titan: 'Titán',
  mercurio: 'Mercurio',
  cometa: 'Cometa',
  asteroide: 'Asteroide',
  orbita: 'Órbita terrestre',
  profundo: 'Espacio profundo',
  gigante: 'Planeta gigante',
}

export const STATUS_LABEL: Record<Status, string> = {
  activo: 'En operación',
  silencioso: 'Ya no comunica',
  viaje: 'Sigue viajando',
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
  { name: 'Apollo 11 · etapa de descenso', kind: 'lander', place: 'luna', year: 1969, status: 'silencioso', note: 'La plataforma del módulo Eagle sigue en Mare Tranquillitatis.' },
  { name: 'Apollo 11 · retrorreflector', kind: 'reflector', place: 'luna', year: 1969, status: 'activo', note: 'Panel pasivo. Devuelve pulsos láser enviados desde la Tierra.' },
  { name: 'Apollo 12 · ALSEP', kind: 'seismo', place: 'luna', year: 1969, status: 'silencioso', note: 'Estación de experimentos apagada por orden desde Tierra en 1977.' },
  { name: 'Surveyor 3', kind: 'lander', place: 'luna', year: 1967, status: 'silencioso', note: 'La tripulación de Apollo 12 recuperó piezas suyas 31 meses después.' },
  { name: 'Apollo 14 · ALSEP', kind: 'seismo', place: 'luna', year: 1971, status: 'silencioso', note: 'Una de las estaciones de la red sísmica lunar.' },
  { name: 'Apollo 15 · sismómetro', kind: 'seismo', place: 'luna', year: 1971, status: 'silencioso', note: 'Registró vibraciones del suelo lunar. Protagonista de un juego.' },
  { name: 'Apollo 15 · retrorreflector', kind: 'reflector', place: 'luna', year: 1971, status: 'activo', note: 'El mayor de los reflectores Apollo. Protagonista de un juego.' },
  { name: 'Apollo 15 · rover lunar', kind: 'rover', place: 'luna', year: 1971, status: 'silencioso', note: 'Primer vehículo tripulado que rodó sobre la Luna.' },
  { name: 'Apollo 16 · rover lunar', kind: 'rover', place: 'luna', year: 1972, status: 'silencioso', note: 'Quedó aparcado en las tierras altas de Descartes.' },
  { name: 'Apollo 17 · rover lunar', kind: 'rover', place: 'luna', year: 1972, status: 'silencioso', note: 'El último vehículo tripulado que recorrió otro mundo.' },
  { name: 'Apollo 17 · ALSEP', kind: 'seismo', place: 'luna', year: 1972, status: 'silencioso', note: 'Última estación científica desplegada por una tripulación.' },
  { name: 'Lunokhod 1', kind: 'rover', place: 'luna', year: 1970, status: 'silencioso', note: 'Primer rover teledirigido que funcionó en otro cuerpo celeste.' },
  { name: 'Lunokhod 2', kind: 'rover', place: 'luna', year: 1973, status: 'silencioso', note: 'Lleva un retrorreflector que todavía se usa en mediciones.' },
  { name: 'Luna 2', kind: 'impactor', place: 'luna', year: 1959, status: 'silencioso', note: 'Primer objeto humano que alcanzó la superficie de la Luna.' },
  { name: 'Luna 9', kind: 'lander', place: 'luna', year: 1966, status: 'silencioso', note: 'Primer alunizaje suave con envío de imágenes.' },
  { name: 'Luna 16', kind: 'sample', place: 'luna', year: 1970, status: 'silencioso', note: 'Primera recogida robótica de muestras devuelta a la Tierra.' },
  { name: 'Luna 17', kind: 'lander', place: 'luna', year: 1970, status: 'silencioso', note: 'La plataforma que depositó a Lunokhod 1.' },
  { name: 'Ranger 7', kind: 'impactor', place: 'luna', year: 1964, status: 'silencioso', note: 'Fotografió la superficie hasta el instante del impacto.' },
  { name: 'Changʼe 3', kind: 'lander', place: 'luna', year: 2013, status: 'silencioso', note: 'Módulo de aterrizaje en Mare Imbrium.' },
  { name: 'Yutu', kind: 'rover', place: 'luna', year: 2013, status: 'silencioso', note: 'Rover que perdió movilidad pero siguió midiendo un tiempo.' },
  { name: 'Changʼe 4', kind: 'lander', place: 'luna', year: 2019, status: 'silencioso', note: 'Primer alunizaje en la cara oculta de la Luna.' },
  { name: 'Yutu-2', kind: 'rover', place: 'luna', year: 2019, status: 'silencioso', note: 'El rover que más distancia ha recorrido en la cara oculta.' },
  { name: 'Changʼe 5', kind: 'sample', place: 'luna', year: 2020, status: 'silencioso', note: 'Devolvió muestras lunares tras más de cuatro décadas sin hacerlo.' },
  { name: 'Vikram', kind: 'lander', place: 'luna', year: 2023, status: 'silencioso', note: 'Aterrizó cerca de la región polar sur lunar.' },
  { name: 'Pragyan', kind: 'rover', place: 'luna', year: 2023, status: 'silencioso', note: 'Pequeño rover desplegado desde Vikram.' },
  { name: 'SLIM', kind: 'lander', place: 'luna', year: 2024, status: 'silencioso', note: 'Demostró aterrizaje de alta precisión.' },
  { name: 'LCROSS', kind: 'impactor', place: 'luna', year: 2009, status: 'silencioso', note: 'Impactó a propósito para analizar el material levantado.' },
  { name: 'GRAIL · Ebb y Flow', kind: 'impactor', place: 'luna', year: 2012, status: 'silencioso', note: 'Dos sondas gemelas que midieron la gravedad lunar.' },
  { name: 'LADEE', kind: 'orbiter', place: 'luna', year: 2014, status: 'silencioso', note: 'Estudió la tenue exosfera lunar antes de impactar.' },
  { name: 'Bandera de Apollo 11', kind: 'flag', place: 'luna', year: 1969, status: 'silencioso', note: 'Objeto simbólico, no instrumento científico.' },

  // --------------------------------------------------------------- MARTE
  { name: 'Viking 1 · lander', kind: 'lander', place: 'marte', year: 1976, status: 'silencioso', note: 'Primer aterrizaje estadounidense con operación prolongada.' },
  { name: 'Viking 2 · lander', kind: 'lander', place: 'marte', year: 1976, status: 'silencioso', note: 'Segundo módulo de la misma misión, en Utopia Planitia.' },
  { name: 'Mars Pathfinder', kind: 'lander', place: 'marte', year: 1997, status: 'silencioso', note: 'Plataforma que desplegó al rover Sojourner.' },
  { name: 'Sojourner', kind: 'rover', place: 'marte', year: 1997, status: 'silencioso', note: 'El primer rover que rodó sobre la superficie de Marte.' },
  { name: 'Spirit (MER-A)', kind: 'rover', place: 'marte', year: 2004, status: 'silencioso', note: 'Quedó inmovilizado en suelo blando. Protagonista de un juego.' },
  { name: 'Opportunity (MER-B)', kind: 'rover', place: 'marte', year: 2004, status: 'silencioso', note: 'Trabajó quince años en Meridiani. Protagonista de un juego.' },
  { name: 'Phoenix', kind: 'lander', place: 'marte', year: 2008, status: 'silencioso', note: 'Excavó en el ártico marciano y encontró hielo de agua.' },
  { name: 'Curiosity', kind: 'rover', place: 'marte', year: 2012, status: 'activo', note: 'Sigue recorriendo el cráter Gale.' },
  { name: 'InSight', kind: 'seismo', place: 'marte', year: 2018, status: 'silencioso', note: 'Detectó terremotos marcianos hasta quedarse sin energía.' },
  { name: 'Perseverance', kind: 'rover', place: 'marte', year: 2021, status: 'activo', note: 'Explora el cráter Jezero y prepara muestras.' },
  { name: 'Ingenuity', kind: 'copter', place: 'marte', year: 2021, status: 'silencioso', note: 'Primer vuelo propulsado controlado en otro planeta.' },
  { name: 'Zhurong', kind: 'rover', place: 'marte', year: 2021, status: 'silencioso', note: 'Rover que recorrió Utopia Planitia.' },
  { name: 'Mars 3', kind: 'lander', place: 'marte', year: 1971, status: 'silencioso', note: 'Transmitió apenas unos segundos tras posarse.' },
  { name: 'Beagle 2', kind: 'lander', place: 'marte', year: 2003, status: 'silencioso', note: 'Llegó a la superficie pero no llegó a desplegarse del todo.' },
  { name: 'Schiaparelli', kind: 'lander', place: 'marte', year: 2016, status: 'silencioso', note: 'Demostrador de entrada y descenso que no sobrevivió al aterrizaje.' },
  { name: 'Escudo térmico de Perseverance', kind: 'capsule', place: 'marte', year: 2021, status: 'silencioso', note: 'Pieza desechada durante el descenso, visible desde órbita.' },
  { name: 'Paracaídas de Perseverance', kind: 'capsule', place: 'marte', year: 2021, status: 'silencioso', note: 'Quedó en el suelo junto a la cubierta trasera.' },
  { name: 'Mars Odyssey', kind: 'orbiter', place: 'marte', year: 2001, status: 'activo', note: 'Uno de los orbitadores que más tiempo lleva en servicio.' },
  { name: 'Mars Reconnaissance Orbiter', kind: 'orbiter', place: 'marte', year: 2006, status: 'activo', note: 'Su cámara de alta resolución fotografía el hardware en superficie.' },
  { name: 'MAVEN', kind: 'orbiter', place: 'marte', year: 2014, status: 'activo', note: 'Estudia cómo Marte perdió su atmósfera.' },
  { name: 'Mars Express', kind: 'orbiter', place: 'marte', year: 2003, status: 'activo', note: 'Orbitador europeo de larga duración.' },

  // --------------------------------------------------------------- VENUS
  { name: 'Venera 7', kind: 'lander', place: 'venus', year: 1970, status: 'silencioso', note: 'Primera transmisión desde la superficie de otro planeta.' },
  { name: 'Venera 9', kind: 'lander', place: 'venus', year: 1975, status: 'silencioso', note: 'Envió la primera imagen desde el suelo de Venus.' },
  { name: 'Venera 13', kind: 'lander', place: 'venus', year: 1982, status: 'silencioso', note: 'Resistió el calor y la presión más tiempo del previsto.' },
  { name: 'Venera 14', kind: 'lander', place: 'venus', year: 1982, status: 'silencioso', note: 'Gemela de Venera 13, con imágenes en color del terreno.' },
  { name: 'Pioneer Venus · sondas', kind: 'probe', place: 'venus', year: 1978, status: 'silencioso', note: 'Varias sondas atravesaron la atmósfera midiendo en el descenso.' },
  { name: 'Vega 1 · globo', kind: 'balloon', place: 'venus', year: 1985, status: 'silencioso', note: 'Globo que flotó en la atmósfera venusiana durante horas.' },
  { name: 'Vega 2 · globo', kind: 'balloon', place: 'venus', year: 1985, status: 'silencioso', note: 'Segundo globo atmosférico de la misma misión.' },

  // --------------------------------------------- TITÁN, COMETAS Y ASTEROIDES
  { name: 'Huygens', kind: 'probe', place: 'titan', year: 2005, status: 'silencioso', note: 'Único aterrizaje realizado en una luna del sistema solar exterior.' },
  { name: 'Philae', kind: 'lander', place: 'cometa', year: 2014, status: 'silencioso', note: 'Se posó sobre el cometa 67P tras rebotar varias veces.' },
  { name: 'Rosetta', kind: 'orbiter', place: 'cometa', year: 2016, status: 'silencioso', note: 'Terminó su misión descendiendo sobre el propio cometa.' },
  { name: 'Deep Impact · impactador', kind: 'impactor', place: 'cometa', year: 2005, status: 'silencioso', note: 'Golpeó el cometa Tempel 1 para estudiar su interior.' },
  { name: 'NEAR Shoemaker', kind: 'probe', place: 'asteroide', year: 2001, status: 'silencioso', note: 'Primera nave que se posó sobre un asteroide, Eros.' },
  { name: 'MINERVA-II', kind: 'rover', place: 'asteroide', year: 2018, status: 'silencioso', note: 'Pequeños robots saltarines desplegados sobre Ryugu.' },
  { name: 'MASCOT', kind: 'lander', place: 'asteroide', year: 2018, status: 'silencioso', note: 'Módulo que trabajó unas horas sobre la superficie de Ryugu.' },
  { name: 'DART', kind: 'impactor', place: 'asteroide', year: 2022, status: 'silencioso', note: 'Impactó Dimorphos para probar la desviación de asteroides.' },
  { name: 'Hayabusa2 · SCI', kind: 'impactor', place: 'asteroide', year: 2019, status: 'silencioso', note: 'Creó un cráter artificial para acceder a material no expuesto.' },

  // ----------------------------------------- GIGANTES Y ESPACIO PROFUNDO
  { name: 'Galileo', kind: 'orbiter', place: 'gigante', year: 2003, status: 'silencioso', note: 'Se dirigió a la atmósfera de Júpiter al final de su misión.' },
  { name: 'Galileo · sonda atmosférica', kind: 'probe', place: 'gigante', year: 1995, status: 'silencioso', note: 'Descendió en la atmósfera joviana midiendo mientras caía.' },
  { name: 'Cassini', kind: 'orbiter', place: 'gigante', year: 2017, status: 'silencioso', note: 'Terminó entrando deliberadamente en Saturno.' },
  { name: 'Juno', kind: 'orbiter', place: 'gigante', year: 2016, status: 'activo', note: 'Orbita Júpiter estudiando su interior y sus auroras.' },
  { name: 'MESSENGER', kind: 'orbiter', place: 'mercurio', year: 2015, status: 'silencioso', note: 'Cartografió Mercurio y acabó impactando contra él.' },
  { name: 'Mariner 4', kind: 'probe', place: 'profundo', year: 1965, status: 'silencioso', note: 'Primeras imágenes cercanas de la superficie de Marte.' },
  { name: 'Mariner 9', kind: 'orbiter', place: 'profundo', year: 1971, status: 'silencioso', note: 'Primer orbitador de otro planeta.' },
  { name: 'Voyager 1', kind: 'probe', place: 'profundo', year: 1977, status: 'viaje', note: 'El objeto humano más lejano. Sigue enviando datos.' },
  { name: 'Voyager 2', kind: 'probe', place: 'profundo', year: 1977, status: 'viaje', note: 'La única nave que ha visitado Urano y Neptuno.' },
  { name: 'Pioneer 10', kind: 'probe', place: 'profundo', year: 1972, status: 'viaje', note: 'Sigue alejándose, ya sin comunicación.' },
  { name: 'Pioneer 11', kind: 'probe', place: 'profundo', year: 1973, status: 'viaje', note: 'Primera nave en sobrevolar Saturno de cerca.' },
  { name: 'New Horizons', kind: 'probe', place: 'profundo', year: 2006, status: 'activo', note: 'Sobrevoló Plutón y continúa hacia el cinturón de Kuiper.' },

  // --------------------------------------------------- ÓRBITA TERRESTRE
  { name: 'Estación Espacial Internacional', kind: 'station', place: 'orbita', year: 1998, status: 'activo', note: 'Laboratorio habitado de forma continua desde el año 2000.' },
  { name: 'Telescopio Hubble', kind: 'telescope', place: 'orbita', year: 1990, status: 'activo', note: 'Reparado y actualizado en vuelo varias veces.' },
  { name: 'Telescopio James Webb', kind: 'telescope', place: 'profundo', year: 2021, status: 'activo', note: 'Observa en infrarrojo desde un punto a 1,5 millones de km.' },
  { name: 'Telescopio Kepler', kind: 'telescope', place: 'orbita', year: 2009, status: 'silencioso', note: 'Agotó su combustible tras descubrir miles de exoplanetas.' },
  { name: 'Spitzer', kind: 'telescope', place: 'profundo', year: 2003, status: 'silencioso', note: 'Observatorio infrarrojo retirado en 2020.' },
  { name: 'Chandra', kind: 'telescope', place: 'orbita', year: 1999, status: 'activo', note: 'Observatorio de rayos X en órbita muy elíptica.' },
  { name: 'Gaia', kind: 'telescope', place: 'profundo', year: 2013, status: 'silencioso', note: 'Midió la posición de más de mil millones de estrellas.' },
  { name: 'Vanguard 1', kind: 'satellite', place: 'orbita', year: 1958, status: 'silencioso', note: 'El objeto humano más antiguo que sigue en órbita.' },
  { name: 'Explorer 1', kind: 'satellite', place: 'orbita', year: 1958, status: 'silencioso', note: 'Primer satélite estadounidense; detectó los cinturones de radiación.' },
  { name: 'Telstar 1', kind: 'satellite', place: 'orbita', year: 1962, status: 'silencioso', note: 'Retransmitió las primeras señales de televisión entre continentes.' },
  { name: 'Skylab', kind: 'station', place: 'orbita', year: 1973, status: 'silencioso', note: 'Primera estación espacial estadounidense; reentró en 1979.' },
  { name: 'Saturno V · tercera etapa', kind: 'rocket', place: 'profundo', year: 1971, status: 'silencioso', note: 'Varias etapas fueron dirigidas contra la Luna para calibrar sismómetros.' },
]

/** Conteos para la cabecera del archivo. */
export const ARCHIVE_STATS = {
  total: ARCHIVE.length,
  activos: ARCHIVE.filter((i) => i.status === 'activo').length,
  lunares: ARCHIVE.filter((i) => i.place === 'luna').length,
  marcianos: ARCHIVE.filter((i) => i.place === 'marte').length,
}
