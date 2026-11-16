import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'rtg', name: 'Nuclear generator (RTG)', pattern: 'nuclear generator|\\bRTG\\b|nuclear', text: 'A "battery" that turns the heat of its fuel into electricity. It needs no light.' },
  { id: 'pu', name: 'Plutonium-238', pattern: 'plutonium-238|plutonium', text: 'The fuel of the RTG. As it slowly decays it gives off heat.' },
  { id: 'solar', name: 'Solar panel', pattern: 'solar panels?|\\bsolar\\b', text: 'A plate that turns light into electricity. Without light it stops.' },
  { id: 'dust', name: 'Dust on the panel', pattern: 'dust', text: 'A layer that blocks the light and lowers the power.' },
  { id: 'shadow', name: 'Shadow', pattern: 'shadows?|\\bshade\\b', text: 'The area with no light behind an object.' },
  { id: 'lander', name: 'Lander', pattern: 'landers?', text: 'A spacecraft that sets down in one place and stays there.' },
]
