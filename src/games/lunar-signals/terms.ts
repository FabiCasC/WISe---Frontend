import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'retro', name: 'Retroreflector', pattern: 'retroreflector', text: 'A special mirror that sends light back the way it came. Apollo 15 astronauts left one on the Moon.' },
  { id: 'echo', name: 'Echo', pattern: '\\bechoes?\\b', text: 'The signal that comes back after bouncing off something.' },
  { id: 'roundtrip', name: 'Round trip', pattern: 'round trip|there and back', text: 'The light goes and comes back, so the distance is half of what it travelled.' },
  { id: 'seismometer', name: 'Seismometer', pattern: 'seismometers?', text: 'An instrument that feels the ground shake.' },
  { id: 'moonquake', name: 'Moonquake', pattern: 'moonquakes?|\\bquakes?\\b', text: 'A tremor of the Moon, like an earthquake.' },
  { id: 'pands', name: 'P and S waves', pattern: 'P and S waves?|\\bP wave|\\bS wave', text: 'Two waves of a quake. The P wave arrives first; the gap before the S wave tells how far away the quake was.' },
]
