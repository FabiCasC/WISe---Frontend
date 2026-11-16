import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'rotor', name: 'Rotor', pattern: 'rotors?|blades?', text: 'The blades that spin to push air downward.' },
  { id: 'rpm', name: 'Revolutions per minute (rpm)', pattern: '\\brpm\\b|revolutions per minute', text: 'How many turns the rotor makes in one minute.' },
  { id: 'lift', name: 'Lift', pattern: '\\blift(?:s|ed)?\\b', text: 'The force that pushes the aircraft up.' },
  { id: 'thin', name: 'Thin air', pattern: 'thin air|less than 1%|air is thin', text: 'Very little air to push on, so the rotor must spin much faster.' },
  { id: 'nav', name: 'Navigation camera', pattern: 'navigation camera|\\bcamera\\b', text: 'The camera that looks at the ground to know where the helicopter is moving.' },
  { id: 'sol', name: 'Sol', pattern: '\\bsols?\\b|martian day', text: 'One day on Mars.' },
]
