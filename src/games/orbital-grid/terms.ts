import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'dsn', name: 'Deep Space Network (DSN)', pattern: 'deep space network|\\bDSN\\b', text: 'The giant antennas of NASA that talk to far-away probes.' },
  { id: 'sites', name: 'Goldstone, Madrid and Canberra', pattern: 'goldstone|madrid|canberra', text: 'The three sites of the network, spread around the world.' },
  { id: 'horizon', name: 'Horizon', pattern: 'horizon|turns? (?:it )?away|turns away', text: 'The line where the sky meets the Earth. An antenna only sees what is above it.' },
  { id: 'probe', name: 'Probe', pattern: 'probes?', text: 'A robot spacecraft that travels far from Earth.' },
  { id: 'blackout', name: 'Blackout', pattern: 'blackouts?|lose the probe|loses the probe|lost the probe', text: 'The time when no antenna sees the probe.' },
  { id: 'dish', name: 'Dish (antenna)', pattern: 'dish(?:es)?|antennas?', text: 'A big antenna that listens to the probe.' },
]
