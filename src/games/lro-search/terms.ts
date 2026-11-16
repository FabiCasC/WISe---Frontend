import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'lro', name: 'LRO', pattern: '\\bLRO\\b', text: 'A NASA probe that circles the Moon and photographs it since 2009.' },
  { id: 'descent', name: 'Descent stage', pattern: 'descent stage|lunar module', text: 'The bottom part of the lunar module, which stayed on the surface.' },
  { id: 'alsep', name: 'ALSEP', pattern: '\\bALSEP\\b|science station', text: 'The set of experiments the astronauts left working on the Moon.' },
  { id: 'sun', name: 'Sun angle', pattern: 'sun angle|\\bSun\\b', text: 'How high the Sun is above the horizon.' },
  { id: 'shadow', name: 'Shadow', pattern: 'shadows?', text: 'The dark area behind an object. It is longer when the Sun is low.' },
  { id: 'trail', name: 'Footprints', pattern: 'footprints?|\\btrail\\b|\\btracks\\b', text: 'The path the astronauts walked, seen from orbit as a difference in brightness.' },
]
