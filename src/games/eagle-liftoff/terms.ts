import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'orbit', name: 'Orbit', pattern: 'orbits?', text: 'The curved path a spacecraft follows around the Moon.' },
  { id: 'window', name: 'Launch window', pattern: 'launch window|green (?:window|band)|\\bwindow\\b', text: 'The right moment to lift off so you can catch the other spacecraft.' },
  { id: 'dock', name: 'Rendezvous and docking', pattern: 'rendezvous|dock(?:ing|ed)?', text: 'Meeting two spacecraft in space and joining them together.' },
  { id: 'ascent', name: 'Ascent engine', pattern: 'ascent engine|ascent stage', text: 'The engine that lifts the lander up from the ground.' },
  { id: 'descent', name: 'Descent stage', pattern: 'descent stage|launch pad', text: 'The bottom half of the lunar module. It stays on the Moon as the base for liftoff.' },
  { id: 'burn', name: 'Burn', pattern: 'burns?', text: 'Switching an engine on for a moment to change orbit.' },
]
