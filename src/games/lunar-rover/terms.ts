import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'lrv', name: 'LRV', pattern: '\\bLRV\\b|lunar roving vehicle|apollo rover|\\bthe rover\\b', text: 'The Lunar Roving Vehicle: the moon buggy of the Apollo 15, 16 and 17 missions.' },
  { id: 'lm', name: 'Lunar module (LM)', pattern: 'lunar module|\\bLM\\b', text: 'The spacecraft that took the astronauts to the surface and back up.' },
  { id: 'battery', name: 'Non-rechargeable battery', pattern: 'batteries|battery', text: 'When it is used up there is nothing to charge it with. Every metre you drive is gone for good.' },
  { id: 'nav', name: 'Navigation computer', pattern: 'navigation computer', text: 'It told the driver the direction and the distance back to the lunar module.' },
  { id: 'sample', name: 'Sample', pattern: 'samples?|stations?', text: 'A rock or a bit of soil brought back to study it.' },
]
