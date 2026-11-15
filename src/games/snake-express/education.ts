/**
 * LUNAR EXPRESS — Contenido educativo
 * -------------------------------------------------------------------------
 * Datos verificados sobre la Luna, misiones Apollo y equipos espaciales.
 * Lenguaje sencillo para niños y jóvenes.
 * Fuente principal: NASA.gov, NSSDCA.
 *
 * Estructura independiente: ampliable sin tocar el motor del juego.
 */

export interface EduFact {
  id: string
  /** Título corto para mostrar en la pantalla */
  title: string
  /** Contenido educativo en lenguaje accesible */
  text: string
  /** Categoría temática */
  category: 'muestras' | 'vehiculos' | 'equipos' | 'mision' | 'descubrimiento'
  /** Este equipo fue DISEÑADO para quedarse (true) o quedó por necesidad operativa (false) */
  intentionallyLeft?: boolean
}

export const EDU_FACTS: EduFact[] = [
  {
    id: 'lunar-samples-weight',
    title: 'Las muestras lunares',
    text:
      'Las misiones Apollo trajeron a la Tierra 382 kg de rocas y suelo lunar. ' +
      'Estos materiales son únicos: la Luna no tiene viento ni agua, por lo que ' +
      'conservan registros de los primeros 4.500 millones de años del sistema solar.',
    category: 'muestras',
  },
  {
    id: 'lrv-lunar-roving-vehicle',
    title: 'El carrito lunar (LRV)',
    text:
      'El Lunar Roving Vehicle fue usado en Apollo 15, 16 y 17. Podía alcanzar ' +
      '14 km/h y recorrió hasta 36 km en una sola misión. Era eléctrico y plegable. ' +
      'Los tres LRV siguen en la Luna: pesaban 210 kg y sería muy costoso traerlos.',
    category: 'vehiculos',
    intentionallyLeft: false,
  },
  {
    id: 'descent-stages',
    title: 'Las etapas de descenso',
    text:
      'Cada módulo lunar Apollo tenía dos partes. La etapa de descenso aterrizaba ' +
      'y se quedaba en la Luna como plataforma de lanzamiento. La etapa de ascenso ' +
      'llevaba a los astronautas de regreso. Las seis etapas de descenso permanecen ' +
      'en la superficie lunar hoy.',
    category: 'equipos',
    intentionallyLeft: true,
  },
  {
    id: 'alsep-experiments',
    title: 'Los experimentos ALSEP',
    text:
      'El Apollo Lunar Surface Experiments Package (ALSEP) era un conjunto de ' +
      'instrumentos científicos que los astronautas instalaban en la Luna. Medían ' +
      'terremotos lunares, el viento solar y el calor interno. La NASA los apagó ' +
      'en 1977 por recorte de presupuesto, pero siguen en su lugar.',
    category: 'equipos',
    intentionallyLeft: true,
  },
  {
    id: 'retroreflectors',
    title: 'Reflectores láser en la Luna',
    text:
      'Apollo 11, 14 y 15 dejaron reflectores de láser que hoy seguimos usando. ' +
      'Al enviar un pulso láser desde la Tierra y medir el tiempo que tarda en ' +
      'volver, podemos calcular la distancia exacta a la Luna: unos 384.400 km, ' +
      'con una precisión de pocos milímetros.',
    category: 'equipos',
    intentionallyLeft: true,
  },
  {
    id: 'apollo11-plaque',
    title: 'La placa de Apollo 11',
    text:
      'Apollo 11 dejó una placa de acero en la Luna que dice: ' +
      '"Aquí los hombres del planeta Tierra pisaron por primera vez la Luna ' +
      'en julio de 1969. Vinimos en paz para toda la humanidad." ' +
      'Fue diseñada para permanecer allí como mensaje permanente.',
    category: 'mision',
    intentionallyLeft: true,
  },
  {
    id: 'moon-rocks-age',
    title: 'Las rocas más antiguas',
    text:
      'Algunas muestras lunares tienen 4.400 millones de años, casi tan antiguas ' +
      'como el sistema solar. Estudiarlas nos enseña cómo se formaron la Tierra y ' +
      'la Luna. Los científicos todavía analizan estas muestras con instrumentos ' +
      'que no existían cuando se recogieron.',
    category: 'descubrimiento',
  },
  {
    id: 'apollo-bags-tools',
    title: 'Herramientas y bolsas',
    text:
      'Los astronautas dejaron en la Luna mochilas de propulsión de respaldo, ' +
      'trajes espaciales ya usados, herramientas, cámaras y bolsas de residuos. ' +
      'El módulo de ascenso solo tenía capacidad para los astronautas y las ' +
      'muestras más valiosas, así que todo lo demás se quedó allí.',
    category: 'equipos',
    intentionallyLeft: false,
  },
  {
    id: 'apollo17-last-visit',
    title: 'La última visita humana',
    text:
      'Apollo 17, en diciembre de 1972, fue la última misión con humanos en la Luna. ' +
      'El geólogo Harrison Schmitt fue el último científico en pisar la superficie. ' +
      'Recogieron 110 kg de muestras en tres paseos lunares que sumaron 22 horas.',
    category: 'mision',
  },
  {
    id: 'moon-water-ice',
    title: 'Hielo en la Luna',
    text:
      'Las misiones más recientes han confirmado que hay hielo de agua en los ' +
      'cráteres permanentemente en sombra de los polos lunares. Este hielo podría ' +
      'usarse para beber, respirar y fabricar combustible en futuras misiones.',
    category: 'descubrimiento',
  },
  {
    id: 'lunar-seismometers',
    title: 'Terremotos en la Luna',
    text:
      'Los sismómetros Apollo detectaron miles de lunarquakes. La Luna tiene ' +
      '"terremotos" causados por el tirón gravitacional de la Tierra y por ' +
      'el enfriamiento de su interior. Los datos de los instrumentos Apollo ' +
      'todavía se estudian para entender la estructura interna de la Luna.',
    category: 'descubrimiento',
  },
  {
    id: 'solar-wind-collector',
    title: 'El colector de viento solar',
    text:
      'Apollo 11 desplegó una lámina de aluminio para capturar partículas del ' +
      'viento solar. Después de 77 minutos en la superficie, la enrollaron y ' +
      'la trajeron de regreso. Fue el primer experimento científico que "viajó" ' +
      'a la Luna y volvió para ser analizado en laboratorios de la Tierra.',
    category: 'equipos',
    intentionallyLeft: false,
  },
]

/** Curiosidad que se desbloquea al completar una partida (rotación por partidas) */
let _factIndex = 0

export function getEndGameFact(): EduFact {
  const fact = EDU_FACTS[_factIndex % EDU_FACTS.length]
  _factIndex++
  return fact
}

/** Hecho educativo para mostrar al recoger una muestra específica */
export function getSampleFact(sampleNumber: number): EduFact | null {
  // Solo en la muestra 3, 6, 9, 12 para no interrumpir demasiado
  if (sampleNumber % 3 !== 0) return null
  const idx = Math.floor(sampleNumber / 3) - 1
  return EDU_FACTS[idx % EDU_FACTS.length] ?? null
}

/** Texto breve para flash educativo durante la recolección */
export const SAMPLE_FLASHES = [
  '¡Muestra recolectada!',
  'Roca lunar asegurada',
  'Muestra en el compartimento',
  '¡Hallazgo científico!',
  'Material registrado',
  'Datos para la NASA',
]

export function getSampleFlash(n: number): string {
  return SAMPLE_FLASHES[n % SAMPLE_FLASHES.length]!
}
