import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'tau', name: 'τ (tau, opacity)', pattern: 'τ|\\btau\\b|opacity', text: 'A number that measures how much light the dust in the air blocks. Higher means darker.' },
  { id: 'storm', name: 'Global dust storm', pattern: 'global dust storm|dust storm|\\bstorm\\b', text: 'A storm that covers the whole planet and darkens the sky.' },
  { id: 'panel', name: 'Solar panel', pattern: 'solar panels?|\\bpanels?\\b', text: 'A plate that turns light into electricity.' },
  { id: 'energy', name: 'Energy', pattern: '\\benergy\\b|\\bpower\\b', text: 'What the rover uses to move and to talk to Earth.' },
  { id: 'opportunity', name: 'Opportunity', pattern: 'Opportunity', text: 'The NASA rover that explored Mars for more than 14 years.' },
  { id: 'sunbreak', name: 'Sun break', pattern: 'sun breaks?', text: 'A gap in the dust where sunlight gets through and the panels charge.' },
]
