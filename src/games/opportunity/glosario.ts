// Palabras técnicas del juego explicadas en una línea, en lenguaje de todos los días.
// Cada término que aparece en pantalla se subraya y, al tocarlo, muestra esta explicación.
// Regla del diseño: si un término no se puede explicar en una línea, no entra al juego.

export interface Termino {
  id: string
  /** Cómo se llama en pantalla. */
  nombre: string
  /** Patrón (sin banderas) que lo detecta dentro de un texto. */
  patron: string
  /** Una línea para quien no sabe nada del tema. */
  texto: string
}

export const TERMINOS: Termino[] = [
  {
    id: 'rover',
    nombre: 'Rover',
    patron: 'rover',
    texto: 'A robot with wheels that explores another planet with nobody on board.',
  },
  {
    id: 'opportunity',
    nombre: 'Opportunity',
    patron: 'Opportunity',
    texto: 'The NASA rover that explored Mars for more than 14 years.',
  },
  {
    id: 'meridiani',
    nombre: 'Meridiani Planum',
    patron: 'Meridiani Planum',
    texto: 'The flat plain on Mars where Opportunity worked.',
  },
  {
    id: 'rat',
    nombre: 'Grinder (RAT)',
    patron: '\\bRAT\\b|grinder',
    texto:
      'A grinder on the rover’s arm. It scrapes off the dust and the outer crust of a rock so you can see the fresh rock inside. RAT stands for Rock Abrasion Tool.',
  },
  {
    id: 'lector',
    nombre: 'Chemistry reader (spectrometer)',
    patron: 'chemistry reader|spectrometer|\\breader\\b',
    texto: 'An instrument that measures what something is made of. Here it tells you which minerals a rock has.',
  },
  {
    id: 'polvo',
    nombre: 'Martian dust',
    patron: 'Martian dust|\\bdust\\b',
    texto: 'Fine dust covers almost everything on Mars. It is the same everywhere, so measuring it says nothing about one rock.',
  },
  {
    id: 'corteza',
    nombre: 'Crust',
    patron: '\\bcrust\\b',
    texto: 'The outer layer of a rock, changed by being exposed for a long time. It is not like the inside.',
  },
  {
    id: 'mineral',
    nombre: 'Mineral',
    patron: '\\bminerals?\\b',
    texto: 'A natural material with a fixed makeup, like salt or the iron-rich kind in rust.',
  },
  {
    id: 'hematita',
    nombre: 'Hematite',
    patron: 'hematite',
    texto: 'A mineral with iron in it. On Earth it often forms where there is water.',
  },
  {
    id: 'esferitas',
    nombre: 'Spherules',
    patron: 'spherules',
    texto: 'Tiny round balls. Opportunity found hematite ones in the rock, and scientists nicknamed them blueberries.',
  },
  {
    id: 'sulfatos',
    nombre: 'Sulfates',
    patron: 'sulfates?',
    texto: 'Salts that contain sulfur. They stay behind when salty water dries up.',
  },
  {
    id: 'pista',
    nombre: 'Clue (evidence)',
    patron: '\\bclues?\\b|\\bevidence\\b',
    texto: 'A fact that helps prove an idea. One clue is rarely enough; scientists look for several that agree.',
  },
  {
    id: 'informe',
    nombre: 'Report',
    patron: '\\breport\\b',
    texto: 'The summary the team sends to Earth with what was found and how sure they are.',
  },
  {
    id: 'raspado',
    nombre: 'Scraped spot',
    patron: '\\bscraped\\b',
    texto: 'A spot that was ground or analysed before being photographed. Nobody can see it as it was anymore. This is a rule of the game.',
  },
  {
    id: 'bateria',
    nombre: 'Battery',
    patron: '\\bbattery\\b|\\bpower\\b',
    texto: 'Every tool uses power. Opportunity used solar panels; here you recharge by matching battery tiles.',
  },
]

/** Lo que hace cada ficha, con su nombre simple y el real al lado. */
export const FICHAS: { clave: string; nombre: string; texto: string }[] = [
  { clave: 'camara', nombre: 'Camera', texto: 'Takes a photo of the chosen spot from a distance, without touching it.' },
  { clave: 'rat', nombre: 'Grinder (RAT)', texto: 'Scrapes the dust and the outer crust off the chosen spot.' },
  { clave: 'espectrometro', nombre: 'Chemistry reader (spectrometer)', texto: 'Measures what the chosen spot is made of.' },
  { clave: 'energia', nombre: 'Battery', texto: 'Recharges the power every tool uses.' },
]
