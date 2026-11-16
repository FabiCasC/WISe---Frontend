import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'sand', name: 'Soft sand', pattern: 'soft sand|\\bsand\\b', text: 'Loose ground where the wheels spin without moving forward.' },
  { id: 'silica', name: 'Silica', pattern: 'silica', text: 'A light-colored mineral that on Earth usually forms where there is hot water.' },
  { id: 'springs', name: 'Hot springs', pattern: 'hot springs?|hot water|steam vents?', text: 'Springs of hot water coming out of the ground.' },
  { id: 'panel', name: 'Solar panel', pattern: 'solar panels?|\\bpanels?\\b|solar power', text: 'A plate that turns sunlight into electricity. Facing the Sun gives more light.' },
  { id: 'slope', name: 'Slope', pattern: 'slopes?', text: 'An inclined hillside. If it faces the Sun, the rover gets more light.' },
  { id: 'homeplate', name: 'Home Plate', pattern: 'home plate', text: 'The area of Mars where Spirit got stuck (still to verify).' },
]
