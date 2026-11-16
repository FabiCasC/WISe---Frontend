// La roca de estudio de Opportunity Echoes: tres puntos, tres herramientas, una batería.
// Lógica pura (sin Phaser ni DOM) para poder probarla. Los textos que ve el jugador van en inglés.

export type Punto = 'A' | 'B' | 'C'
/** Lo que se ve en la foto de un punto limpio. */
export type Rasgo = 'esferitas' | 'capas' | 'lisa'
export type Herramienta = 'camara' | 'rat' | 'espectrometro'
/** Lo que mide el espectrómetro: polvo si no se pulió, roca si se pulió. */
export type Lectura = 'polvo' | 'hematita' | 'sulfatos' | 'comun'

export interface EstadoPunto {
  id: Punto
  rasgo: Rasgo
  fotografiado: boolean
  /** Se pulió o analizó antes de fotografiarlo: ya no se puede ver como estaba. */
  perturbado: boolean
  pulido: boolean
  lectura: Lectura | null
}

export interface Decision {
  concept: string
  correct: boolean
  texto: string
}

export interface VistaRoca {
  puntos: EstadoPunto[]
  elegido: Punto | null
  energia: number
  energiaMax: number
  evidencias: { imagen: boolean; quimica: boolean; segundo: boolean }
  ultimo: string
  informeEnviado: boolean
}

export interface ResultadoUso {
  /** Lo que ve el jugador sobre lo que acaba de pasar. */
  mensaje: string
  /** Si fue una mala decisión de orden, el aviso corto para la barra de mensajes. */
  mala?: string
}

export const ENERGIA_MAX = 6
export const ENERGIA_INICIAL = 4
export const ENERGIA_POR_RECARGA = 2

/** Lecturas que de verdad hablan de agua (las usa el informe del nivel 3). */
export const LECTURAS_AGUA: readonly Lectura[] = ['hematita', 'sulfatos']

const RASGOS: Rasgo[] = ['esferitas', 'capas', 'lisa']
const IDS: Punto[] = ['A', 'B', 'C']

export const FOTO: Record<Rasgo, string> = {
  esferitas: 'Photo: tiny round balls packed into the rock.',
  capas: 'Photo: thin layers stacked like pages.',
  lisa: 'Photo: just rock and dust, nothing stands out.',
}
const FOTO_PERTURBADA = 'Photo: a scraped surface. Nobody can tell how it looked before.'

export const LECTURA: Record<Lectura, string> = {
  polvo: 'Reads: Martian dust. It is the same on every rock, so it says nothing about this one.',
  hematita: 'Reads: hematite, an iron mineral that often forms where there is water.',
  sulfatos: 'Reads: sulfates, salts that stay behind when salty water dries up.',
  comun: 'Reads: ordinary rock. No sign of water here.',
}

const LECTURA_DE: Record<Rasgo, Lectura> = { esferitas: 'hematita', capas: 'sulfatos', lisa: 'comun' }

export const CONCEPTO_OBSERVAR = 'observar-primero'
export const CONCEPTO_PULIR = 'pulir-antes-de-analizar'
export const CONCEPTO_EVIDENCIAS = 'varias-evidencias'

export interface Roca {
  vista(): VistaRoca
  elegir(p: Punto): void
  hayElegido(): boolean
  /** Aplica una herramienta al punto elegido. Gasta 1 de energía. */
  usar(h: Herramienta): ResultadoUso
  recargar(): void
  /** Solo el nivel 3: ¿cuántas líneas de evidencia faltan? */
  informe(): { ok: boolean; faltan: string[] }
  completo(): boolean
  decisiones(): Decision[]
  resumen(ganado: boolean): string[]
}

/**
 * @param rng semilla del tablero: reparte qué rasgo cae en cada punto.
 * @param libre modo práctica: todo se puede probar y nada termina el nivel.
 */
export function crearRoca(opts: { levelId: number; libre: boolean; rng: () => number }): Roca {
  const { levelId, libre, rng } = opts

  // Mezcla de rasgos: el punto A no es siempre el interesante.
  const rasgos = [...RASGOS]
  for (let i = rasgos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[rasgos[i], rasgos[j]] = [rasgos[j], rasgos[i]]
  }

  const puntos: EstadoPunto[] = IDS.map((id, i) => ({
    id,
    rasgo: rasgos[i],
    // En el nivel 2 las fotos ya están hechas: el nivel trata de pulir antes de leer.
    fotografiado: levelId === 2,
    perturbado: false,
    pulido: false,
    lectura: null,
  }))

  let elegido: Punto | null = null
  let energia = libre ? ENERGIA_MAX : ENERGIA_INICIAL
  let ultimo = ''
  let informeEnviado = false
  const decisiones: Decision[] = []
  const primeraAccion = new Set<Punto>()
  const analizado = new Set<Punto>()
  let informesFallidos = 0

  const punto = (id: Punto) => puntos.find((p) => p.id === id)!

  const evidencias = () => {
    const limpioConRasgo = puntos.some((p) => p.fotografiado && !p.perturbado && p.rasgo !== 'lisa')
    const conAgua = puntos.filter((p) => p.lectura !== null && LECTURAS_AGUA.includes(p.lectura))
    return { imagen: limpioConRasgo, quimica: conAgua.length >= 1, segundo: conAgua.length >= 2 }
  }

  const vista = (): VistaRoca => ({
    puntos: puntos.map((p) => ({ ...p })),
    elegido,
    energia,
    energiaMax: ENERGIA_MAX,
    evidencias: evidencias(),
    ultimo,
    informeEnviado,
  })

  function usar(h: Herramienta): ResultadoUso {
    if (!elegido) return { mensaje: 'Pick a spot on the rock first.' }
    const p = punto(elegido)
    if (energia <= 0) {
      ultimo = 'No power left. Match battery tiles to recharge.'
      return { mensaje: ultimo }
    }
    energia--

    // Nivel 1: lo primero que haces en cada punto es la decisión de "mirar antes de tocar".
    if (levelId === 1 && !libre && !primeraAccion.has(p.id)) {
      const bien = h === 'camara'
      decisiones.push({
        concept: CONCEPTO_OBSERVAR,
        correct: bien,
        texto: bien
          ? `You photographed spot ${p.id} before touching it.`
          : `You touched spot ${p.id} before photographing it.`,
      })
    }
    primeraAccion.add(p.id)

    let mala: string | undefined

    if (h === 'camara') {
      p.fotografiado = true
      ultimo = p.perturbado ? FOTO_PERTURBADA : FOTO[p.rasgo]
    } else if (h === 'rat') {
      if (!p.fotografiado) {
        p.perturbado = true
        mala = `Spot ${p.id} is scraped but was never photographed. Look first, then touch.`
      }
      p.pulido = true
      ultimo = `Grinder (RAT): dust and outer crust scraped off spot ${p.id}. Fresh rock shows.`
    } else {
      if (!p.fotografiado) p.perturbado = true
      p.lectura = p.pulido ? LECTURA_DE[p.rasgo] : 'polvo'
      ultimo = LECTURA[p.lectura]
      if (!p.pulido) mala = `Spot ${p.id} still has dust on it: the reader measured dust, not rock. Grind first.`
      if (levelId === 2 && !libre && !analizado.has(p.id)) {
        decisiones.push({
          concept: CONCEPTO_PULIR,
          correct: p.pulido,
          texto: p.pulido
            ? `You ground spot ${p.id} before reading it.`
            : `You read spot ${p.id} before grinding it.`,
        })
      }
      analizado.add(p.id)
    }
    if (mala) ultimo = `${ultimo} ${mala}`
    return { mensaje: ultimo, mala }
  }

  function informe() {
    const e = evidencias()
    const faltan: string[] = []
    if (!e.imagen) faltan.push('a clean photo of a spot that shows something (taken before you touched it)')
    if (!e.quimica) faltan.push('a chemistry reading of ground rock that points to water')
    if (!e.segundo) faltan.push('a second spot whose ground rock also points to water')
    const ok = faltan.length === 0
    if (!libre && levelId === 3) {
      decisiones.push({
        concept: CONCEPTO_EVIDENCIAS,
        correct: ok,
        texto: ok ? 'You sent the report with all three lines of evidence.' : `You sent the report too early; it lacked ${faltan.length} of 3 lines.`,
      })
    }
    if (ok) informeEnviado = true
    else informesFallidos++
    ultimo = ok
      ? 'Report accepted: three independent clues agree.'
      : `Not enough yet. The team needs ${faltan.join('; ')}.`
    return { ok, faltan }
  }

  function completo(): boolean {
    if (libre) return false
    const e = evidencias()
    if (levelId === 1) return puntos.every((p) => p.fotografiado)
    if (levelId === 2) return puntos.some((p) => p.lectura !== null && p.lectura !== 'polvo')
    return informeEnviado && e.imagen && e.quimica && e.segundo
  }

  function resumen(ganado: boolean): string[] {
    const out: string[] = []
    const malas = decisiones.filter((d) => !d.correct)
    if (levelId === 1) {
      if (!ganado) {
        out.push('You ran out of moves before photographing every spot.')
        out.push('Match three cameras on each spot to photograph it.')
      } else if (malas.length === 0) {
        out.push('You photographed every spot before touching it.')
        out.push('Scientists do the same: grinding a rock changes how it looked, so the photo comes first.')
      } else {
        for (const d of malas) out.push(`${d.texto} After that nobody can see it as it was.`)
        out.push('That is why scientists take pictures first: touching a rock changes it for good.')
      }
    } else if (levelId === 2) {
      const leidos = puntos.filter((p) => p.lectura !== null)
      const polvo = leidos.filter((p) => p.lectura === 'polvo')
      const roca = leidos.find((p) => p.lectura !== null && p.lectura !== 'polvo')
      if (polvo.length > 0) {
        out.push(`You read spot ${polvo.map((p) => p.id).join(', ')} while it was still covered in dust, so the reader measured dust.`)
        out.push('Martian dust is the same on every rock, so that reading tells you nothing about the rock.')
      }
      if (roca && roca.lectura) {
        out.push(`After grinding with the RAT, spot ${roca.id} gave a real reading. ${LECTURA[roca.lectura]}`)
      } else {
        out.push('You ran out of moves before getting a reading of fresh rock.')
      }
      if (polvo.length === 0 && roca) out.push('Grind first, then read: that is how the rover got data from the rock itself.')
    } else {
      const e = evidencias()
      if (informesFallidos > 0) out.push(`The team sent your report back ${informesFallidos} time${informesFallidos > 1 ? 's' : ''}: one clue is not enough.`)
      if (ganado) {
        out.push('Your report had three clues that agree: a clean photo, a chemistry reading, and a second spot that matched.')
        out.push('The minerals point to water long ago. Nothing in this report shows life.')
        out.push('The three ideas of this game: look before you touch, grind before you read, and prove it with several clues.')
      } else {
        out.push(`You ended with ${[e.imagen, e.quimica, e.segundo].filter(Boolean).length} of 3 clues. One or two are not enough to conclude.`)
      }
    }
    return out
  }

  return {
    vista,
    elegir(p) {
      elegido = p
    },
    hayElegido: () => elegido !== null,
    usar,
    recargar() {
      energia = Math.min(ENERGIA_MAX, energia + ENERGIA_POR_RECARGA)
      ultimo = 'Battery recharged.'
    },
    informe,
    completo,
    decisiones: () => decisiones.map((d) => ({ ...d })),
    resumen,
  }
}
