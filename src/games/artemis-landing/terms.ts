import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'gravity', name: 'Low gravity', pattern: 'low gravity|gravity', text: 'A small pull: falling is slow, but it never stops pulling, so you cannot float for free.' },
  { id: 'engine', name: 'Descent engine', pattern: 'descent engine|main engine|\\bengine\\b', text: 'The big engine that slows the fall.' },
  { id: 'thruster', name: 'Thruster', pattern: 'thrusters?', text: 'A small engine that pushes sideways to correct the drift.' },
  { id: 'fuel', name: 'Fuel', pattern: '\\bfuel\\b', text: 'What the engine burns. With none left there is no braking.' },
  { id: 'air', name: 'No air', pattern: 'no air|parachute', text: 'The Moon has no air, so a parachute has nothing to push against. Only the engine slows you down.' },
]
