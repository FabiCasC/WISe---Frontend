import type { Term } from '../shared/glossary'

// The six words of the design doc for this game, in one line each.
export const TERMS: Term[] = [
  { id: 'probe', name: 'Space probe', pattern: 'space probe|\\bprobe\\b', text: 'A robot spacecraft that travels far from Earth.' },
  { id: 'range', name: 'Range', pattern: '\\brange\\b', text: 'The stretch where the number you are looking for can still be.' },
  { id: 'halving', name: 'Halving', pattern: 'halv(?:e|ing)|\\bmiddle\\b', text: 'Trying the middle of the range, so you throw away half of the possibilities.' },
  { id: 'margin', name: 'Margin of error', pattern: 'margin of error|\\bmargin\\b', text: 'How far off a measurement can be.' },
  { id: 'echo', name: 'Echo', pattern: '\\becho(?:es)?\\b', text: 'The signal that comes back after bouncing off something.' },
  { id: 'retro', name: 'Retroreflector', pattern: 'retroreflector', text: 'A special mirror that sends light back the way it came. Apollo 15 left one on the Moon.' },
]
