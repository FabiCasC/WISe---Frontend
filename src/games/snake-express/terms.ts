import type { Term } from '../shared/glossary'

export const TERMS: Term[] = [
  { id: 'maria', name: 'Lunar sea (maria)', pattern: '\\bmaria\\b|\\bmare\\b|lunar seas?|sea of tranquility', text: 'A big dark plain of rock that was once lava.' },
  { id: 'basalt', name: 'Basalt', pattern: 'basalt', text: 'Dark volcanic rock that forms when lava cools.' },
  { id: 'highlands', name: 'Highlands', pattern: 'highlands?', text: 'Bright, mountainous parts of the Moon. They are the oldest crust.' },
  { id: 'crust', name: 'Crust', pattern: '\\bcrust\\b', text: 'The outer layer of a rocky world.' },
  { id: 'package', name: 'Science package (ALSEP)', pattern: 'science packages?|\\bALSEP\\b|\\bpackages?\\b', text: 'Experiments the astronauts left on the Moon so they would keep sending data.' },
  { id: 'lm', name: 'Lunar module (LM)', pattern: 'lunar module|\\bLM\\b', text: 'The spacecraft that took astronauts down to the surface and back up.' },
]
