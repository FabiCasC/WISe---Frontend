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
  wordmark: 'ÓRBITA',
  /**
   * Versión para el titular gigante. En caja alta tipográfica la tilde se
   * despega del trazo y ensucia el logotipo, así que el display va sin ella
   * (práctica habitual en identidad). El texto corrido sí la lleva.
   */
  wordmarkDisplay: 'ORBITA',
  /** Segunda linea del logotipo. */
  wordmarkSub: 'ARCADE',
  /** Nombre completo en texto corrido. */
  full: 'Órbita Arcade',
  /** Claim de portada. Corto, memorable, honesto. */
  claim: 'Ecos de otros mundos',
  /** Frase de apertura de la demo de 3 minutos. */
  pitch:
    'Hay máquinas que dejaron de moverse, pero todavía pueden despertar preguntas.',
  /** Subtitulo explicativo del portal. */
  tagline:
    'Tres misiones reales. Tres juegos cortos. Recupera el recuerdo científico de los equipos que la humanidad dejó en la Luna y en Marte.',
  event: 'NASA Space Apps Challenge 2026',
  eventShort: 'Space Apps 2026',
  year: 2026,
  /** Aviso obligatorio: no insinuar respaldo institucional. */
  disclaimer:
    'Proyecto independiente creado para el NASA Space Apps Challenge 2026. No está afiliado ni respaldado por la NASA. Las voces de los vehículos son dramatizaciones educativas.',
} as const

/** Paleta acordada en el plan. Se refleja 1:1 en src/styles/tokens.css */
export const PALETTE = {
  space: '#071427',
  panel: '#12243A',
  text: '#F5F8FF',
  action: '#6DE2F2',
  moon: '#C8CEDA',
  mars: '#E68A68',
} as const
