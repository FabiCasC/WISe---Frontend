#!/usr/bin/env node
/**
 * REVISIÓN DE IA CON GITHUB MODELS
 * -------------------------------------------------------------------------
 * Llama directamente a la API de GitHub Models (compatible con OpenAI) con el
 * GITHUB_TOKEN del workflow: no hace falta ninguna key. Prueba varios modelos
 * en orden hasta que uno responda y deja:
 *   review/response.md  → texto de la revisión (o el motivo del fallo)
 *   GITHUB_OUTPUT       → ok=true|false, model=<modelo usado>
 *
 * Nunca falla el job: la revisión es orientativa.
 *
 * Variables:
 *   GITHUB_TOKEN    token con permiso models: read
 *   AI_MODELS       lista separada por comas (orden de preferencia)
 *   AI_ENDPOINT     por defecto https://models.github.ai/inference
 *   SYSTEM_PROMPT   ruta del prompt de sistema
 *   USER_PROMPT     ruta del prompt con el diff
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const endpoint = (process.env.AI_ENDPOINT ?? 'https://models.github.ai/inference').replace(/\/$/, '')
const models = (process.env.AI_MODELS ?? 'openai/gpt-4.1,openai/gpt-4o,openai/gpt-4o-mini')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean)
const token = process.env.GITHUB_TOKEN ?? ''
const system = readFileSync(process.env.SYSTEM_PROMPT ?? '.github/prompts/revision-pr.md', 'utf8')
const user = readFileSync(process.env.USER_PROMPT ?? 'review/prompt.txt', 'utf8')

mkdirSync('review', { recursive: true })

function output(key, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

/** Explica en español los fallos más comunes de GitHub Models. */
function explain(status, body) {
  if (status === 401 || status === 403)
    return 'el token no tiene acceso a GitHub Models (revisa el permiso `models: read` y que Models esté habilitado en el repositorio u organización)'
  if (status === 404) return 'el modelo no existe o fue retirado'
  if (status === 413) return 'el diff es demasiado grande para el plan gratis'
  if (status === 429) return 'se alcanzó el límite de uso del plan gratis; reintenta más tarde'
  if (status >= 500) return 'error temporal del servicio'
  return `respuesta inesperada (${body.slice(0, 120).replace(/\s+/g, ' ')})`
}

async function ask(model) {
  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* cuerpo no JSON: se reporta abajo */
  }
  const content = json?.choices?.[0]?.message?.content
  if (res.ok && typeof content === 'string' && content.trim()) return { ok: true, content: content.trim() }
  const detail = json?.error?.message ?? text
  console.log(`· ${model}: HTTP ${res.status} → ${detail.slice(0, 300)}`)
  return { ok: false, reason: explain(res.status, String(detail)) }
}

const failures = []
for (const model of models) {
  try {
    const r = await ask(model)
    if (r.ok) {
      console.log(`✓ Revisión generada con ${model}`)
      writeFileSync('review/response.md', r.content)
      output('ok', 'true')
      output('model', model)
      process.exit(0)
    }
    failures.push(`\`${model}\`: ${r.reason}`)
  } catch (err) {
    console.log(`· ${model}: ${err}`)
    failures.push(`\`${model}\`: no se pudo conectar (${String(err).slice(0, 80)})`)
  }
}

writeFileSync(
  'review/response.md',
  [
    '## 🤖 Revisión de IA: no disponible',
    '',
    'Ningún modelo de GitHub Models respondió:',
    ...failures.map((f) => `- ${f}`),
    '',
    'La nota de sanidad no depende de esto. Vuelve a lanzar el job desde la pestaña Actions.',
  ].join('\n'),
)
output('ok', 'false')
output('model', models[0] ?? '')
