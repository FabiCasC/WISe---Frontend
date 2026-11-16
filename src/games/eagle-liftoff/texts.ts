/**
 * EAGLE LIFTOFF - texts (Spanish / English).
 * -------------------------------------------------------------------------
 * Written for 9-year-olds: short sentences, one idea each, emojis as visual
 * anchors. Spanish is the default; English is used when settings.lang is 'en'.
 * The detailed English messages in rules.ts stay for tests and teacher logs;
 * the screen shows these instead (mapped by Verdict.code).
 */
import type { Lang } from '../../shared/types'
import type { VerdictCode } from './rules'

export type ObjectId = 'eagle' | 'columbia' | 'pad' | 'moon' | 'earth' | 'window' | 'ring0' | 'ring1' | 'ring2' | 'ring3' | 'ring4'

export interface Texts {
  hud: {
    gap: string
    gapPad: (lo: number, hi: number) => string
    gapValue: (deg: number, ahead: boolean) => string
    speed: string
    onPad: string
    faster: string
    slower: string
    same: string
    burns: string
    time: string
    infinity: string
  }
  legendFast: string
  legendSlow: string
  launch: string
  launchNow: string
  burnDown: string
  burnDownSub: string
  burnUp: string
  burnUpSub: string
  windowChip: string
  windowNow: string
  staysChip: string
  skip: string
  hintPlay: string
  hintLevel1: string
  hintTutorial: string
  names: Record<ObjectId, { name: string; line: string }>
  flashGood: string[]
  flashBad: string[]
  noBurns: string
  verdict: Record<VerdictCode, string>
  coachPad: string
  coachPadGo: string
  coachOrbit: string
  coachAuto: string
  liftoffNote: string
  start: string
  startTutorial: string
  seeTutorial: string
  skipToLevel: string
  levelIntro: Record<1 | 2 | 3, string>
  levelTitle: Record<1 | 2 | 3, string>
  winTitle: string
  loseTitle: string
  points: (n: number) => string
  practice: string
  winText: Record<1 | 2 | 3, string>
  loseTimeUp: string
  loseSameOrbit: string
  loseNoFuel: string
  loseBehind: string
  loseTooFar: string
  saveContinue: string
  tryAgain: string
  backToArcade: string
  tutorial: {
    title: string
    intro: string
    pips: string
    meet: (done: number, total: number) => string
    meetDone: string
    rings: string
    ringsRight: string
    ringsSame: string
    ringsSlow: string
    launchWait: string
    launchNow: string
    launchLate: string
    launchEarlyTap: string
    launchLateTap: string
    drop: string
    wait: string
    climb: string
    climb2: string
    climbNow: string
    sameOrbit: string
    tooHigh: string
    retry: string
    winTitle: string
    winText: string
    toLevel: string
    again: string
    save: string
    backToLevel: string
  }
}

const ES: Texts = {
  hud: {
    gap: '🛰️ Columbia va',
    gapPad: (lo, hi) => `🛰️ Despega entre ${lo}° y ${hi}°`,
    gapValue: (d, ahead) => `${d}° ${ahead ? 'adelante' : 'atrás'}`,
    speed: '⚡ Velocidad (Eagle vs Columbia)',
    onPad: '🌙 en la Luna',
    faster: '🐇',
    slower: '🐢',
    same: '🟰',
    burns: '🔥 Impulsos',
    time: '⏱️ Tiempo',
    infinity: '∞',
  },
  legendFast: '🐇 adentro = rápido',
  legendSlow: '🐢 afuera = lento',
  launch: '🚀 ¡Despegar!',
  launchNow: '🚀 ¡YA!',
  burnDown: '▼ Bajar',
  burnDownSub: 'más rápido 🐇',
  burnUp: '▲ Subir',
  burnUpSub: 'más lento 🐢',
  windowChip: '🟢 ventana',
  windowNow: '¡DESPEGA!',
  staysChip: 'se queda en la Luna',
  skip: 'Saltar ⏭',
  hintPlay: 'Toca los botones o usa ↓ bajar · ↑ subir · Espacio despegar. ¡Toca los objetos para ver su nombre!',
  hintLevel1: 'Espacio o botón para despegar. ¡Toca los objetos para ver su nombre!',
  hintTutorial: 'Sigue a Capi 🧑‍🚀 · ¡Toca los objetos para ver su nombre!',
  names: {
    eagle: { name: '🦅 Eagle', line: '¡Tu nave! Es la parte de arriba del módulo lunar.' },
    columbia: { name: '🛰️ Columbia', line: 'La nave que te espera dando vueltas.' },
    pad: { name: '🦶 Base de lanzamiento', line: 'La parte de abajo de Eagle. Se queda en la Luna.' },
    moon: { name: '🌙 La Luna', line: 'Aquí caminaron los astronautas de Apollo 11.' },
    earth: { name: '🌍 La Tierra', line: '¡Nuestro hogar! Allá te esperan.' },
    window: { name: '🟢 Ventana de lanzamiento', line: 'Despega cuando Columbia llegue aquí.' },
    ring0: { name: '🐇 Órbita muy baja', line: '¡La más rápida de todas!' },
    ring1: { name: '🐇 Órbita baja', line: '¡Rápida! Corre más que Columbia.' },
    ring2: { name: '🐇 Órbita casi baja', line: 'Un poquito más rápida que Columbia.' },
    ring3: { name: '🛰️ Órbita de Columbia', line: 'Para acoplar debes llegar aquí.' },
    ring4: { name: '🐢 Órbita alta', line: 'Lenta: ¡se queda atrás!' },
  },
  flashGood: ['¡Genial!', '¡Muy bien!', '¡Así se hace!', '¡Eso!'],
  flashBad: ['¡Casi!', 'Mira la velocidad', '¡Otra vez!'],
  noBurns: 'Sin impulsos',
  verdict: {
    'good-launch': '¡Buen despegue! Columbia va adelante y tú irás más rápido 🐇',
    behind: 'Columbia iba detrás de ti. ¡Espera un poco más!',
    'too-far': 'Columbia iba muy lejos. ¡Despega antes!',
    stranded: 'Te quedaste sin impulsos para llegar. ¡Guarda uno para subir!',
    'climbed-above': '¡Subiste de más! Arriba es lento 🐢 y Columbia se aleja.',
    'back-far': 'Misma órbita = misma velocidad. ¡Baja otra vez para alcanzarla!',
    'went-lower': '¡Órbita baja! Ahora eres más rápido 🐇',
    'ready-dock': '¡Listo! Las puertas se encuentran 🚪',
  },
  coachPad: '¡Espera a que Columbia llegue a la banda verde! ⏳',
  coachPadGo: '¡Ahora! Toca despegar 🚀',
  coachOrbit: 'Bajar ▼ = rápido 🐇 · Subir ▲ = lento 🐢',
  coachAuto: '¡Vas más rápido! 🐇 Ya la alcanzas…',
  liftoffNote: '¡Despegue! 🚀 La base se queda en la Luna.',
  start: '¡Empezar! 🚀',
  startTutorial: '¡Vamos a aprender! 🎓',
  seeTutorial: '🎓 Ver tutorial',
  skipToLevel: 'Saltar al nivel 1',
  levelIntro: {
    1: '¡Despega cuando Columbia esté un poquito adelante de ti!',
    2: 'Columbia está lejos adelante. ¡Baja ▼ para correr más y luego sube ▲!',
    3: '¡Misión completa! Elige cuándo despegar, usa 3 impulsos y acopla.',
  },
  levelTitle: { 1: 'Nivel 1 · Ventana', 2: 'Nivel 2 · Abajo es rápido', 3: 'Nivel 3 · ¡Misión completa!' },
  winTitle: '🎉 ¡Acoplaste con Columbia!',
  loseTitle: '😮 ¡Casi alcanzas a Columbia!',
  points: (n) => `${n} puntos`,
  practice: 'Práctica',
  winText: {
    1: '¡Lo lograste! Tu órbita era más baja, o sea, más rápida 🐇\n💡 La base de Eagle sigue en la Luna hoy.',
    2: '¡Bajaste para correr y subiste para acoplar!\n💡 Así se encontraron todos los equipos Apollo.',
    3: '¡Misión cumplida, astronauta! 🧑‍🚀\n💡 Armstrong y Aldrin hicieron justo esto.',
  },
  loseTimeUp: '¡Se acabó el tiempo! Prueba bajar antes ▼.',
  loseSameOrbit: 'Misma órbita = misma velocidad, y no se acerca. ¡Baja primero para ganar terreno!',
  loseNoFuel: 'Quedaste lejos y sin impulsos. ¡Guarda uno para subir!',
  loseBehind: 'Columbia iba detrás de ti. ¡Espera la banda verde!',
  loseTooFar: 'Columbia iba muy lejos. ¡Despega cuando llegue a la banda verde!',
  saveContinue: 'Guardar y seguir ➜',
  tryAgain: 'Intentar otra vez 🔁',
  backToArcade: 'Volver al arcade',
  tutorial: {
    title: '🎓 Nivel 0 · ¡Aprende a volar!',
    intro: 'Capi te enseña 3 cosas:\n⏳ cuándo despegar\n🐇 abajo es rápido\n🚪 cómo acoplar',
    pips: 'Nivel 0',
    meet: (d, t) => `¡Toca cada cosa para conocerla! (${d}/${t})`,
    meetDone: '¡Genial! Ya conoces a todos 🎉',
    rings: 'Las órbitas son pistas de carreras 🏁 ¡Toca la pista MÁS RÁPIDA!',
    ringsRight: '¡Sí! Más abajo = más rápido 🐇',
    ringsSame: 'Esa es la de Columbia. ¡Busca una más abajo!',
    ringsSlow: 'Esa es lenta 🐢. ¡Prueba otra!',
    launchWait: '¡Espera! Columbia debe llegar a la banda verde ⏳',
    launchNow: '¡AHORA! Toca despegar 🚀',
    launchLate: '¡Uy! Columbia ya pasó. Damos otra vuelta 🔄',
    launchEarlyTap: '¡Muy pronto! Columbia aún viene atrás.',
    launchLateTap: '¡Muy tarde! Espera la próxima vuelta.',
    drop: 'Columbia va adelante. ¡Baja ▼ para correr más rápido!',
    wait: '¡Vas más rápido! 🐇 Espera a alcanzarla…',
    climb: '¡Ya casi! Sube ▲ para ir a su órbita',
    climb2: 'Sube otra vez cuando el círculo verde toque a Columbia',
    climbNow: '¡AHORA sube ▲ y acopla!',
    sameOrbit: 'Misma órbita, misma velocidad. ¡Baja ▼ otra vez!',
    tooHigh: '¡Muy arriba! Baja ▼ un poquito.',
    retry: '¡Casi! Probemos de nuevo 💪',
    winTitle: '🎉 ¡Nivel 0 completo!',
    winText: '1️⃣ ⏳ Espera la ventana verde\n2️⃣ 🐇 Abajo es más rápido\n3️⃣ 🚪 Sube y acopla',
    toLevel: '¡Jugar nivel 1! 🚀',
    again: 'Repetir tutorial',
    save: 'Guardar ✔',
    backToLevel: '¡Volver al juego! 🚀',
  },
}

const EN: Texts = {
  hud: {
    gap: '🛰️ Columbia is',
    gapPad: (lo, hi) => `🛰️ Launch at ${lo}° to ${hi}°`,
    gapValue: (d, ahead) => `${d}° ${ahead ? 'ahead' : 'behind'}`,
    speed: '⚡ Speed (Eagle vs Columbia)',
    onPad: '🌙 on the Moon',
    faster: '🐇',
    slower: '🐢',
    same: '🟰',
    burns: '🔥 Burns',
    time: '⏱️ Time',
    infinity: '∞',
  },
  legendFast: '🐇 inside = fast',
  legendSlow: '🐢 outside = slow',
  launch: '🚀 Launch!',
  launchNow: '🚀 NOW!',
  burnDown: '▼ Go lower',
  burnDownSub: 'faster 🐇',
  burnUp: '▲ Go higher',
  burnUpSub: 'slower 🐢',
  windowChip: '🟢 window',
  windowNow: 'LAUNCH!',
  staysChip: 'stays on the Moon',
  skip: 'Skip ⏭',
  hintPlay: 'Tap the buttons or use ↓ lower · ↑ higher · Space launch. Tap objects to see their names!',
  hintLevel1: 'Space or the button to launch. Tap objects to see their names!',
  hintTutorial: 'Follow Capi 🧑‍🚀 · Tap objects to see their names!',
  names: {
    eagle: { name: '🦅 Eagle', line: 'Your ship! The top half of the lunar module.' },
    columbia: { name: '🛰️ Columbia', line: 'The ship waiting for you, going around.' },
    pad: { name: '🦶 Launch pad', line: 'The bottom half of Eagle. It stays on the Moon.' },
    moon: { name: '🌙 The Moon', line: 'Apollo 11 astronauts walked here.' },
    earth: { name: '🌍 The Earth', line: 'Our home! They are waiting for you.' },
    window: { name: '🟢 Launch window', line: 'Launch when Columbia gets here.' },
    ring0: { name: '🐇 Very low orbit', line: 'The fastest of all!' },
    ring1: { name: '🐇 Low orbit', line: 'Fast! Beats Columbia.' },
    ring2: { name: '🐇 Lowish orbit', line: 'A little faster than Columbia.' },
    ring3: { name: '🛰️ Columbia’s orbit', line: 'To dock you must get here.' },
    ring4: { name: '🐢 High orbit', line: 'Slow: you fall behind!' },
  },
  flashGood: ['Great!', 'Well done!', 'Nice one!', 'Yes!'],
  flashBad: ['Almost!', 'Check the speed', 'Try again!'],
  noBurns: 'No burns left',
  verdict: {
    'good-launch': 'Great launch! Columbia is ahead and you will be faster 🐇',
    behind: 'Columbia was behind you. Wait a bit more!',
    'too-far': 'Columbia was too far away. Launch sooner!',
    stranded: 'Not enough burns left to reach it. Save one for the climb!',
    'climbed-above': 'Too high! Up is slow 🐢 and Columbia pulls away.',
    'back-far': 'Same orbit = same speed. Go lower again to catch up!',
    'went-lower': 'Lower orbit! Now you are faster 🐇',
    'ready-dock': 'Ready! The hatches meet 🚪',
  },
  coachPad: 'Wait for Columbia to reach the green band! ⏳',
  coachPadGo: 'Now! Tap launch 🚀',
  coachOrbit: 'Lower ▼ = fast 🐇 · Higher ▲ = slow 🐢',
  coachAuto: 'You are faster! 🐇 Catching up…',
  liftoffNote: 'Liftoff! 🚀 The pad stays on the Moon.',
  start: 'Start! 🚀',
  startTutorial: 'Let’s learn! 🎓',
  seeTutorial: '🎓 See tutorial',
  skipToLevel: 'Skip to level 1',
  levelIntro: {
    1: 'Launch when Columbia is a little ahead of you!',
    2: 'Columbia is far ahead. Go lower ▼ to run faster, then climb ▲!',
    3: 'Full mission! Pick your launch, use 3 burns and dock.',
  },
  levelTitle: { 1: 'Level 1 · Window', 2: 'Level 2 · Lower is faster', 3: 'Level 3 · Full mission!' },
  winTitle: '🎉 You docked with Columbia!',
  loseTitle: '😮 So close to Columbia!',
  points: (n) => `${n} points`,
  practice: 'Practice',
  winText: {
    1: 'You did it! Your orbit was lower, so faster 🐇\n💡 Eagle’s pad is still on the Moon today.',
    2: 'You dropped to run and climbed to dock!\n💡 Every Apollo crew met up this way.',
    3: 'Mission complete, astronaut! 🧑‍🚀\n💡 Armstrong and Aldrin did exactly this.',
  },
  loseTimeUp: 'Time is up! Try going lower sooner ▼.',
  loseSameOrbit: 'Same orbit = same speed, so it never gets closer. Go lower first!',
  loseNoFuel: 'Too far and no burns left. Save one for the climb!',
  loseBehind: 'Columbia was behind you. Wait for the green band!',
  loseTooFar: 'Columbia was too far. Launch when it reaches the green band!',
  saveContinue: 'Save and go on ➜',
  tryAgain: 'Try again 🔁',
  backToArcade: 'Back to the arcade',
  tutorial: {
    title: '🎓 Level 0 · Learn to fly!',
    intro: 'Capi teaches you 3 things:\n⏳ when to launch\n🐇 lower is faster\n🚪 how to dock',
    pips: 'Level 0',
    meet: (d, t) => `Tap each thing to meet it! (${d}/${t})`,
    meetDone: 'Great! You know everyone 🎉',
    rings: 'Orbits are race tracks 🏁 Tap the FASTEST track!',
    ringsRight: 'Yes! Lower = faster 🐇',
    ringsSame: 'That is Columbia’s. Find one lower!',
    ringsSlow: 'That one is slow 🐢. Try another!',
    launchWait: 'Wait! Columbia must reach the green band ⏳',
    launchNow: 'NOW! Tap launch 🚀',
    launchLate: 'Oops! Columbia went past. One more lap 🔄',
    launchEarlyTap: 'Too soon! Columbia is still coming.',
    launchLateTap: 'Too late! Wait for the next lap.',
    drop: 'Columbia is ahead. Go lower ▼ to run faster!',
    wait: 'You are faster! 🐇 Wait to catch up…',
    climb: 'Almost! Go higher ▲ to its orbit',
    climb2: 'Go higher again when the green circle touches Columbia',
    climbNow: 'NOW go higher ▲ and dock!',
    sameOrbit: 'Same orbit, same speed. Go lower ▼ again!',
    tooHigh: 'Too high! Go lower ▼ a little.',
    retry: 'Almost! Let’s try again 💪',
    winTitle: '🎉 Level 0 complete!',
    winText: '1️⃣ ⏳ Wait for the green window\n2️⃣ 🐇 Lower is faster\n3️⃣ 🚪 Climb and dock',
    toLevel: 'Play level 1! 🚀',
    again: 'Repeat tutorial',
    save: 'Save ✔',
    backToLevel: 'Back to the game! 🚀',
  },
}

export function getTexts(lang: Lang | undefined): Texts {
  return lang === 'en' ? EN : ES
}
