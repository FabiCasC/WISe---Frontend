/**
 * PIPELINE DE IMÁGENES
 * ---------------------------------------------------------------------------
 * Los originales viven en art/originales/ (fuera de public/, para que no se
 * publiquen: pesan megas). Este script los recorta, los comprime y los deja
 * en public/assets/ con el nombre exacto que busca el código.
 *
 *   npm run assets
 *
 * Si añades arte nuevo: déjalo en art/originales/ y añade una línea a JOBS.
 */
import { mkdir, readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'art', 'originales')
const OUT = join(ROOT, 'public', 'assets')

/**
 * Qué original va a qué destino.
 *
 * Los originales se llaman igual que su destino: para sustituir un arte basta
 * con sobrescribir art/originales/<nombre>.png y ejecutar `npm run assets`.
 * No hace falta tocar este archivo.
 *
 * Los dos róvers de Marte son gemelos, así que el arte tiene que
 * distinguirlos a propósito:
 *   · opportunity → llanura de Meridiani con esferas de hematita, luz de
 *     mediodía, róver erguido trabajando en un afloramiento.
 *   · spirit → atardecer ámbar en Gusev, róver inclinado y surco de sílice.
 */
const JOBS = [
  {
    src: 'opportunity.png',
    out: 'missions/opportunity.webp',
    width: 1200,
    height: 1200,
    format: 'webp',
    // La roca en capas y las esferas de hematita son mucho detalle fino:
    // a calidad 78 se iba a 241 kB. A 64 queda en ~165 kB sin diferencia visible.
    quality: 64,
  },
  {
    src: 'lunar-signals.png',
    out: 'missions/lunar-signals.webp',
    width: 1200,
    height: 1200,
    format: 'webp',
    // Más comprimida que el resto: el regolito es ruido de alta frecuencia y
    // dispara el peso. A 58 no se nota en pantalla y baja de 247 a ~150 kB.
    quality: 58,
  },
  {
    src: 'spirit.png',
    out: 'missions/spirit.webp',
    width: 1200,
    height: 1200,
    format: 'webp',
    quality: 78,
  },
  {
    // Fondo de la portada. Se ve a pantalla completa, así que va más grande
    // que la versión social.
    src: 'og.png',
    out: 'brand/hero.webp',
    width: 1920,
    height: 1040,
    format: 'webp',
    quality: 72,
  },
  {
    // JPEG y no WebP: algunos lectores de enlaces (WhatsApp, Slack antiguos)
    // todavía no previsualizan WebP.
    src: 'og.png',
    out: 'brand/og.jpg',
    width: 1200,
    height: 630,
    format: 'jpeg',
    quality: 82,
  },
  // Game tiles: real NASA photos and artist concepts (public domain; see
  // art/originales/games/CREDITS.txt). Square, small: they are thumbnails.
  ...[
    'dust-run', 'gusev-maze', 'orbital-grid', 'sun-shade', 'eagle-liftoff', 'lunar-rover',
    'pathfinder-bounce', 'sojourner-commands', 'phoenix-ice', 'ingenuity-flight', 'lro-search',
    'dart-impact', 'artemis-landing', 'snake-express',
  ].map((id) => ({
    src: 'games/' + id + '.jpg',
    out: 'games/' + id + '.webp',
    width: 640,
    height: 640,
    format: 'webp',
    quality: 70,
    // The dust-storm strip goes from clear to dark sky: keep the clear end.
    position: id === 'dust-run' ? 'west' : 'centre',
  })),
]

/** Aviso si una imagen se pasa del presupuesto de peso. El fondo de portada puede permitirse algo mas. */
const BUDGET_KB = 260

const kb = (bytes) => Math.round(bytes / 102.4) / 10

async function main() {
  let available
  try {
    available = await readdir(SRC)
  } catch {
    console.error(`No existe ${SRC}. Deja ahí los originales y vuelve a ejecutar.`)
    process.exitCode = 1
    return
  }

  let failures = 0
  let overBudget = 0

  for (const job of JOBS) {
    const from = join(SRC, job.src)
    const to = join(OUT, job.out)

    if (!available.includes(job.src.split('/')[0])) {
      console.error(`  ✕ falta  ${job.src}`)
      failures++
      continue
    }

    await mkdir(dirname(to), { recursive: true })

    const pipeline = sharp(from).resize(job.width, job.height, {
      fit: 'cover',
      position: job.position ?? 'centre',
    })

    if (job.format === 'webp') pipeline.webp({ quality: job.quality, effort: 6 })
    else pipeline.jpeg({ quality: job.quality, mozjpeg: true, progressive: true })

    await pipeline.toFile(to)

    const before = (await stat(from)).size
    const after = (await stat(to)).size
    const flag = after / 1024 > BUDGET_KB ? '  ⚠ por encima del presupuesto' : ''
    if (flag) overBudget++

    console.log(
      `  ✓ ${job.out.padEnd(30)} ${job.width}×${job.height}  ` +
        `${kb(before)} kB → ${kb(after)} kB${flag}`,
    )
  }

  console.log('')
  if (failures) {
    console.error(`${failures} original(es) sin encontrar. Revisa art/originales/.`)
    process.exitCode = 1
  } else if (overBudget) {
    console.warn(
      `${overBudget} imagen(es) superan ${BUDGET_KB} kB. Baja "quality" en JOBS.`,
    )
  } else {
    console.log(`Todo dentro del presupuesto de ${BUDGET_KB} kB por imagen.`)
  }
}

main()
