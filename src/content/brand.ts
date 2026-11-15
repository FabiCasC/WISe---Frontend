/**
 * IDENTIDAD - punto unico de cambio.
 * Si el equipo vota otro nombre en la primera reunion, se cambia AQUI y se
 * propaga a portal, <title>, creditos y pagina de proyecto.
 *
 * Alternativas discutidas (ver docs/):
 *   - ORBITA ARCADE      -> continuidad con el plan del equipo  [ELEGIDO]
 *   - ECOS DE OTROS MUNDOS -> mas narrativo, menos "arcade"
 *   - VESTIGIO           -> corto y potente, pierde el guino a Friv
 *   - LEGADO ORBITAL     -> serio, suena a documental
 */
export const BRAND = {
  /** Palabra grande del logotipo. */
  wordmark: 'ORBITA',
  /**
   * Versión para el titular gigante. En caja alta tipográfica la tilde se
   * despega del trazo y ensucia el logotipo, así que el display va sin ella
   * (práctica habitual en identidad). El texto corrido sí la lleva.
   */
  wordmarkDisplay: 'ORBITA',
  /** Segunda linea del logotipo. */
  wordmarkSub: 'ARCADE',
  /** Nombre completo en texto corrido. */
  full: 'Orbita Arcade',
  /** Claim de portada. Corto, memorable, honesto. */
  claim: 'Echoes from other worlds',
  /** Frase de apertura de la demo de 3 minutos. */
  pitch:
    'Some machines stopped moving, but they can still spark questions.',
  /** Subtitulo explicativo del portal. */
  tagline:
    'Three real missions. Three short games. Recover the science behind the machines humanity left on the Moon and Mars.',
  event: 'NASA Space Apps Challenge 2026',
  eventShort: 'Space Apps 2026',
  year: 2026,
  /** Aviso obligatorio: no insinuar respaldo institucional. */
  disclaimer:
    'Independent project made for the NASA Space Apps Challenge 2026. It is not affiliated with or endorsed by NASA. The voices of the machines are educational dramatizations.',
} as const

/** Paleta acordada en el plan. Se refleja 1:1 en src/styles/tokens.css */
export const PALETTE = {
  space: '#0C0D45',
  panel: '#1A2062',
  text: '#DAE8FB',
  action: '#75CBD1',
  moon: '#C8CEDA',
  mars: '#E68A68',
} as const
