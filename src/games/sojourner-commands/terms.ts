import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'sol', name: 'Sol', pattern: '\\bsols?\\b', text: 'One day on Mars. It lasts a little longer than an Earth day.' },
  { id: 'apxs', name: 'APXS', pattern: '\\bAPXS\\b', text: 'An instrument that measures what a rock is made of. On Sojourner it was on the back.' },
  { id: 'autonomy', name: 'Hazard avoidance (autonomy)', pattern: 'hazard avoidance|autonomy|stopped by itself|stops by itself|stops itself', text: 'The rover stops by itself in front of a big rock or a drop.' },
  { id: 'lander', name: 'Lander', pattern: 'landers?', text: 'The base ship that every message of the rover went through.' },
  { id: 'command', name: 'Command', pattern: 'commands?', text: 'A movement order sent from Earth.' },
  { id: 'delay', name: 'Signal delay', pattern: 'signal delay|radio signal|uplink', text: 'The time the radio takes to reach Mars.' },
]
