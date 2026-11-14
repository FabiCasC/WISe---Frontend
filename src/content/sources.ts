/**
 * FUENTES - trazabilidad cientifica.
 *
 * REGLA DEL EQUIPO (Ingenieria Estadistica valida):
 * antes del corte del domingo, abrir cada URL, confirmar que carga y escribir
 * la fecha real en `accessed`. No se publica una ficha sin fuente abierta.
 * Las fechas marcadas con TODO siguen pendientes de esa verificacion.
 */
export interface Source {
  id: string
  title: string
  publisher: string
  url: string
  /** Fecha de acceso confirmada por el equipo (YYYY-MM-DD) o null si falta. */
  accessed: string | null
}

export const SOURCES: Record<string, Source> = {
  'mer-opportunity': {
    id: 'mer-opportunity',
    title: 'Mars Exploration Rover — Opportunity',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-opportunity/',
    accessed: null, // TODO equipo: verificar el día del evento
  },
  'mer-spirit': {
    id: 'mer-spirit',
    title: 'Mars Exploration Rover — Spirit',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/mer-spirit/',
    accessed: null, // TODO equipo: verificar el día del evento
  },
  'apollo-15': {
    id: 'apollo-15',
    title: 'Apollo 15 — Mission Overview',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/apollo-15/',
    accessed: null, // TODO equipo: verificar el día del evento
  },
  'alsep-pds': {
    id: 'alsep-pds',
    title: 'Apollo Lunar Surface Experiments Package — archivos sísmicos',
    publisher: 'NASA Planetary Data System (Geosciences Node)',
    url: 'https://pds-geosciences.wustl.edu/missions/apollo/',
    accessed: null, // TODO equipo: verificar el día del evento
  },
  'lunar-laser': {
    id: 'lunar-laser',
    title: 'Lunar Laser Ranging — retrorreflectores en la superficie lunar',
    publisher: 'NASA',
    url: 'https://science.nasa.gov/moon/',
    accessed: null, // TODO equipo: sustituir por la página específica del LRRR
  },
  'spaceapps': {
    id: 'spaceapps',
    title: 'NASA Space Apps Challenge 2026',
    publisher: 'NASA Space Apps',
    url: 'https://www.spaceappschallenge.org/',
    accessed: '2026-11-13',
  },
  'spaceapps-legal': {
    id: 'spaceapps-legal',
    title: 'Bases legales y guía de marca',
    publisher: 'NASA Space Apps',
    url: 'https://www.spaceappschallenge.org/legal/',
    accessed: '2026-11-13',
  },
}

export function getSources(ids: string[]): Source[] {
  return ids.map((id) => SOURCES[id]).filter((s): s is Source => Boolean(s))
}
