import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'devil', name: 'Dust devil', pattern: 'dust devils?', text: 'A column of air that spins and lifts dust.' },
  { id: 'panel', name: 'Solar panel', pattern: 'solar panels?|\\bpanels?\\b', text: 'A plate that turns sunlight into electricity. With dust on top it makes less.' },
  { id: 'cleaning', name: 'Cleaning event', pattern: 'cleaning events?', text: 'A moment when the wind cleaned the panels and the power jumped up.' },
  { id: 'gusev', name: 'Gusev crater', pattern: 'gusev( crater)?', text: 'The place on Mars where Spirit explored.' },
  { id: 'sample', name: 'Sample', pattern: 'samples?', text: 'A bit of rock or soil collected to study it.' },
]
