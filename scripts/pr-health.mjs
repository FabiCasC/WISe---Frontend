#!/usr/bin/env node
/**
 * NIVEL DE SANIDAD DE UN PR
 * -------------------------------------------------------------------------
 * Lo ejecuta .github/workflows/pr-health.yml después de typecheck, pruebas y
 * build. Calcula una nota de 0 a 100 y escribe:
 *   - health/report.md   → el comentario fijo que se publica en el PR
 *   - health/score.json  → { score, level, emoji } para el resto del pipeline
 *
 * También se puede correr en local tras los tres comandos:
 *   npm run health
 *
 * Reparto de puntos (determinista, sin IA):
 *   Tipos (tsc)        30
 *   Pruebas (vitest)   30  → proporcional al % de pruebas que pasan
 *   Build (vite)       25
 *   Peso del bundle    15  → JS total comprimido con gzip
 * La revisión de Claude va aparte y da su propia nota cualitativa.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const OUT_DIR = 'health'
const VITEST_JSON = join(OUT_DIR, 'vitest.json')
const ASSETS_DIR = join('dist', 'assets')

/** Presupuesto de JS comprimido. Phaser solo entra en los chunks de juego. */
const BUDGET_KB = { full: 600, half: 900 }

// Resultado de cada paso tal como lo entrega GitHub Actions
// (success | failure | cancelled | skipped). En local se asume success.
const outcome = (name) => (process.env[name] ?? 'success').toLowerCase()
const typecheck = outcome('TYPECHECK_OUTCOME')
const tests = outcome('TEST_OUTCOME')
const build = outcome('BUILD_OUTCOME')

const rows = []
let score = 0

// --- Tipos -----------------------------------------------------------------
{
  const ok = typecheck === 'success'
  const pts = ok ? 30 : 0
  score += pts
  rows.push(['Tipos (`npm run typecheck`)', ok ? '✅ Sin errores' : '❌ Con errores', pts, 30])
}

// --- Pruebas ---------------------------------------------------------------
{
  let pts = 0
  let detail = '❌ No se pudieron ejecutar'
  if (existsSync(VITEST_JSON)) {
    try {
      const r = JSON.parse(readFileSync(VITEST_JSON, 'utf8'))
      const total = r.numTotalTests ?? 0
      const passed = r.numPassedTests ?? 0
      const failed = r.numFailedTests ?? 0
      if (total === 0) {
        detail = '⚠️ No hay pruebas'
      } else {
        pts = Math.round((passed / total) * 30)
        detail = failed === 0 ? `✅ ${passed}/${total} pasan` : `❌ ${failed} fallan · ${passed}/${total} pasan`
      }
    } catch {
      detail = '❌ Informe de pruebas ilegible'
    }
  } else if (tests === 'success') {
    // Sin informe JSON pero el comando terminó bien.
    pts = 30
    detail = '✅ Pasan'
  }
  score += pts
  rows.push(['Pruebas (`npm test`)', detail, pts, 30])
}

// --- Build -----------------------------------------------------------------
const buildOk = build === 'success' && existsSync(ASSETS_DIR)
{
  const pts = buildOk ? 25 : 0
  score += pts
  rows.push(['Build (`npm run build`)', buildOk ? '✅ Compila' : '❌ Falla', pts, 25])
}

// --- Peso del bundle -------------------------------------------------------
let chunks = []
{
  let pts = 0
  let detail = '— Sin build'
  if (buildOk) {
    chunks = readdirSync(ASSETS_DIR)
      .filter((f) => f.endsWith('.js'))
      .map((f) => {
        const buf = readFileSync(join(ASSETS_DIR, f))
        return { file: f, raw: buf.length / 1024, gzip: gzipSync(buf).length / 1024 }
      })
      .sort((a, b) => b.gzip - a.gzip)
    const totalGz = chunks.reduce((s, c) => s + c.gzip, 0)
    if (totalGz <= BUDGET_KB.full) pts = 15
    else if (totalGz <= BUDGET_KB.half) pts = 8
    const icon = pts === 15 ? '✅' : pts > 0 ? '⚠️' : '❌'
    detail = `${icon} ${totalGz.toFixed(1)} KB gzip (presupuesto ${BUDGET_KB.full} KB)`
  }
  score += pts
  rows.push(['Peso del JS', detail, pts, 15])
}

// --- Nivel -----------------------------------------------------------------
const level =
  score >= 90
    ? { emoji: '🟢', label: 'Saludable · listo para revisar y mergear' }
    : score >= 70
      ? { emoji: '🟡', label: 'Revisar antes de mergear' }
      : { emoji: '🔴', label: 'No mergear todavía' }

const bar = (() => {
  const filled = Math.round(score / 10)
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
})()

const sha = (process.env.HEAD_SHA ?? '').slice(0, 7)

const md = [
  '<!-- pr-health -->',
  `## ${level.emoji} Nivel de sanidad: **${score}/100**`,
  '',
  `\`${bar}\` ${level.label}`,
  '',
  '| Chequeo | Resultado | Puntos |',
  '| --- | --- | ---: |',
  ...rows.map(([name, detail, pts, max]) => `| ${name} | ${detail} | ${pts}/${max} |`),
  '',
  chunks.length
    ? [
        '<details><summary>Chunks de JS más pesados</summary>',
        '',
        '| Archivo | Sin comprimir | gzip |',
        '| --- | ---: | ---: |',
        ...chunks.slice(0, 8).map((c) => `| \`${c.file}\` | ${c.raw.toFixed(1)} KB | ${c.gzip.toFixed(1)} KB |`),
        '',
        '</details>',
        '',
      ].join('\n')
    : '',
  '🟢 ≥ 90 · 🟡 70–89 · 🔴 < 70. La revisión de Claude (calidad, accesibilidad, rigor científico) llega en otro comentario.',
  sha ? `\n<sub>Commit \`${sha}\`</sub>` : '',
].join('\n')

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, 'report.md'), md)
writeFileSync(join(OUT_DIR, 'score.json'), JSON.stringify({ score, level: level.label, emoji: level.emoji }))

console.log(md)

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(
    process.env.GITHUB_OUTPUT,
    `score=${score}\nemoji=${level.emoji}\nlevel=${level.label}\n`,
    { flag: 'a' },
  )
}
