import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'impactor', name: 'Impactor', pattern: 'impactors?|spacecraft', text: 'The spacecraft that crashes on purpose into the asteroid.' },
  { id: 'dimorphos', name: 'Dimorphos', pattern: 'dimorphos|moonlet', text: 'The small moon of the asteroid that DART hit.' },
  { id: 'period', name: 'Orbital period', pattern: 'orbital period|orbit(?:s|ed)?\\b|\\bperiod\\b', text: 'How long the little moon takes to go once around the asteroid.' },
  { id: 'head', name: 'Head-on hit', pattern: 'head-on|square on|against its travel', text: 'A crash against the movement. It slows the moon down.' },
  { id: 'ejecta', name: 'Ejecta', pattern: 'ejecta|debris', text: 'The dust and rocks thrown out by the crash.' },
]
