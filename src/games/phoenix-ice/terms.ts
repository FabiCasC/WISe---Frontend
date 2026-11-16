import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'sublimation', name: 'Sublimation', pattern: 'sublimat\\w+|turns? straight into gas|turned to gas', text: 'Changing from ice straight to gas, without becoming liquid.' },
  { id: 'ice', name: 'Water ice', pattern: 'water ice|\\bice\\b', text: 'Frozen water.' },
  { id: 'salt', name: 'Salt', pattern: '\\bsalt\\b', text: 'A mineral that does not shrink or vanish with the days.' },
  { id: 'oven', name: 'Oven', pattern: '\\boven\\b', text: 'An instrument that heats a sample to see if it releases water.' },
  { id: 'trench', name: 'Trench', pattern: 'trench(?:es)?', text: 'A ditch dug by the lander arm.' },
  { id: 'sol', name: 'Sol', pattern: '\\bsols?\\b', text: 'One day on Mars.' },
]
