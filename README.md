# Órbita Arcade · Ecos de otros mundos

Portal arcade educativo sobre los equipos que la humanidad dejó en la Luna y en Marte.
Tres juegos cortos, tres niveles cada uno, una ficha científica real con fuente detrás
de cada partida.

**NASA Space Apps Challenge 2026** · Proyecto independiente, sin afiliación ni respaldo
de la NASA.

---

## ⚠️ Antes de nada: la ventana de trabajo autorizada

El plan del equipo recoge que el GO Team pide **empezar el proyecto el sábado 14 a las
09:00 de la sede local**, y advierte que adelantarlo puede descalificar.

Este repositorio es **la base del portal (shell)**: navegación, contrato de integración,
progreso y diseño. Trátalo como preparación y prototipo personal. El día del evento:

1. Confirma con la sede qué se considera inicio del trabajo.
2. Crea el repositorio oficial **dentro de la ventana autorizada** y haz ahí el primer
   commit.
3. Declara en la entrega lo que existía antes (preparación) y lo que se construyó durante
   el evento.

Si la sede lo prohíbe, se reconstruye el shell desde cero el sábado: son unas 2 horas
porque el diseño y el contrato ya están decididos. Ese es el verdadero valor de tener
esto hecho: **las decisiones**, no los archivos.

---

## Arranque

```bash
npm install
npm run dev       # http://localhost:5173
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Comprobación de tipos + bundle de producción en `dist/` |
| `npm run preview` | Sirve `dist/` como lo hará el hosting |
| `npm test` | Pruebas de reglas con Vitest |

Requisitos: Node 20 o superior. **Un solo `package-lock.json` compartido**: nadie cambia
dependencias sin avisar al integrador.

---

## Las dos páginas

El enrutado es por hash, así que recargar cualquier URL funciona en hosting estático.
**Una ruta siempre empieza por `#/`**; cualquier otro hash es un ancla dentro de la
página actual y no cambia de página.

| Ruta | Qué es |
| --- | --- |
| `#/` | **Portada.** Pantalla completa sobre la imagen de la Luna y Marte, los tres juegos en detalle, pasaporte, equipo. |
| `#/arcade` | **Arcade.** Los tres juegos grandes y centrados arriba, y debajo la rejilla densa del archivo con 91 equipos reales. |
| `#/jugar/<juego>/<nivel>` | Partida. Se superpone a la página en la que estabas y vuelve a ella al salir. |

La rejilla del arcade es densa como la de Friv, pero **ninguna ficha es decorativa**:
las grandes abren un juego y las pequeñas abren la ficha de ese equipo. El logotipo
flotante esquiva el cursor y cambia de forma al aterrizar — el gesto característico de
Friv, hecho con posiciones predefinidas en `Mosaic.tsx`.

Archivos: `src/app/pages/Landing.tsx`, `src/app/pages/Arcade.tsx`. `App.tsx` es solo el
armazón (cielo, barra superior, modales, avisos).

---

## El contrato de integración

Es lo único que las tres parejas necesitan acordar. Está en
[`src/shared/types.ts`](src/shared/types.ts) y **no se modifica sin avisar a Kevin**.

```ts
mountGame(container: HTMLElement, context: GameContext): Promise<GameController> | GameController

interface GameController {
  pause(): void
  resume(): void
  destroy(): Promise<void>   // resuelve SOLO cuando el canvas ya no está en el DOM
}
```

El portal entrega en `context`: `gameId`, `levelId`, `seed`, `settings` (volumen,
movimiento reducido, práctica, idioma) y los callbacks `onComplete(result)` y `onExit()`.

El juego devuelve un `GameResult` con `score`, `durationMs`, `completed`, `evidenceIds` y
`firstAnswerCorrect`. El portal lo procesa **una sola vez por partida**: un reintento es
una partida nueva.

### Qué ya funciona sin que hagas nada

- Carga perezosa del módulo (cada juego es su propio *chunk*).
- Montaje, pausa, reanudación y destrucción encadenada: un juego nuevo espera a que el
  anterior termine de destruirse. Sin canvas ni audio duplicados.
- Pausa automática al cambiar de pestaña.
- Escape vuelve al portal.
- Guardado en `localStorage` con `schemaVersion` y recuperación segura si los datos están
  corruptos o el almacenamiento está bloqueado.
- Estado de error aislado: si un módulo falla al montar, el resto del arcade sigue vivo.

### Cómo sustituir tu andamio por el juego real

Cada `src/games/<id>/index.ts` exporta hoy un andamio que ya cumple el contrato completo.
Para sustituirlo:

```ts
// src/games/spirit/index.ts
import type { GameContext, GameController } from '../../shared/types'

export async function mountGame(
  container: HTMLElement,
  ctx: GameContext,
): Promise<GameController> {
  const Phaser = (await import('phaser')).default   // solo en el navegador
  const game = new Phaser.Game({ /* ... */ })

  return {
    pause: () => game.scene.pause('main'),
    resume: () => game.scene.resume('main'),
    destroy: () =>
      new Promise<void>((resolve) => {
        game.events.once('destroy', () => resolve())   // esperar el evento real
        game.destroy(true)
      }),
  }
}
```

Reglas de Phaser que pide el plan: escalado `FIT`, conversión de coordenadas de entrada,
y detener audio, temporizadores y listeners en `destroy`.

---

## Reparto de carpetas

| Carpeta | Contenido | Responsable |
| --- | --- | --- |
| `src/app/` | Portal, GameHost, fichas, pasaporte, ajustes | Kevin |
| `src/shared/` | Tipos, progreso, contrato | Kevin · revisa Sistemas |
| `src/games/opportunity/` | Reglas, escenas y niveles del juego 1 | Comp. Científica 1 + Software |
| `src/games/lunar-signals/` | Mapas, interruptores y señales del juego 2 | Comp. Científica 2 + Sistemas |
| `src/games/spirit/` | Mapas, energía y rival del juego 3 | Kevin + Estadística |
| `src/content/` | Misiones, archivo orbital, fuentes, marca | Edición por juego · valida Estadística |
| `public/assets/` | Imágenes, sonidos y créditos | Reparto por juego |

Ramas: `feat/shell`, `feat/opportunity`, `feat/lunar-signals`, `feat/spirit`.
Integrar cada 2–3 horas mediante PR. Software revisa el juego 2, Sistemas el 3, Kevin el 1.

---

## Separar reglas de dibujo

Pon las reglas en un `rules.ts` **sin Phaser**, y la escena en otro archivo. Así las
reglas se prueban con Vitest sin canvas, que es lo que el plan pide automatizar:

- Juego 1: intercambio válido, cascadas y remezcla del tablero.
- Juego 2: puertas, espejos y reinicio del mapa.
- Juego 3: rutas, gasto de energía y puntuación.

Hay un ejemplo funcionando en [`src/shared/progress.test.ts`](src/shared/progress.test.ts).

---

## Honestidad científica (no negociable)

Está codificado en [`src/content/missions.ts`](src/content/missions.ts), y la ficha de
cada misión lo muestra en pantalla:

- Ninguna prueba de vida. Hematita, yeso y sílice indican **agua**, no organismos.
- Ningún equipo se reactiva, se repara ni vuelve a casa.
- El retrorreflector lunar es **pasivo**: sin batería, no transmite. El sismómetro ALSEP
  dejó de enviar datos en 1977; los reflectores se siguen usando.
- La voz en primera persona va siempre etiquetada como dramatización.
- El rival de la carrera está identificado como recorrido programado.
- Cada ficha lleva su fuente oficial. **Antes del corte del domingo hay que abrir cada URL
  y escribir la fecha real de acceso** en `src/content/sources.ts`; las que siguen con
  `accessed: null` aparecen como "pendiente de verificar".

---

## Imágenes

Los **originales** viven en `art/originales/` — fuera de `public/`, porque pesan megas y
no deben publicarse. El pipeline los recorta y comprime:

```bash
npm run assets
```

| Original | Destino | Peso |
| --- | --- | --- |
| `opportunity.png` | `public/assets/missions/opportunity.webp` | 3,1 MB → 185 kB |
| `lunar-signals.png` | `public/assets/missions/lunar-signals.webp` | 3,3 MB → 175 kB |
| `spirit.png` | `public/assets/missions/spirit.webp` | 2,7 MB → 153 kB |
| `og.png` | `public/assets/brand/hero.webp` (fondo de portada) | 2,1 MB → 74 kB |
| `og.png` | `public/assets/brand/og.jpg` (vista previa al compartir) | 2,1 MB → 63 kB |

El script avisa si alguna supera **260 kB**, que es el presupuesto para cumplir la meta
de «primera interacción en menos de 5 s en móvil». Para añadir arte nuevo: déjalo en
`art/originales/` y añade una línea a `JOBS` en `scripts/optimize-assets.mjs`.
Para **sustituir** un arte existente basta con sobrescribir el `.png` del mismo nombre:
los originales se llaman igual que su destino.

**Las imágenes son opcionales.** Si un archivo falta o falla al cargar, debajo sigue
estando la escena dibujada en CSS/SVG y no se ve ningún hueco roto. Eso permite trabajar
sin bloquearse esperando arte.

### Qué NO se genera con IA

| Recurso | Qué hacer |
| --- | --- |
| Logo NASA Space Apps | Del kit oficial 2026 de la sede. Sin deformar ni recolorear. |
| Emblema de la NASA | Nunca como logo del producto ni insinuando respaldo. |
| Fotos para las fichas científicas | Las reales de la NASA (dominio público), **con su crédito**. |

La IA ilustra el juego; la NASA documenta la ciencia. Una imagen generada presentada
como evidencia rompe la honestidad del proyecto. Anota cada recurso en
`public/assets/CREDITOS.md`: origen, autor o institución, URL y condiciones de uso, y
declara cuáles son ilustraciones generadas.

---

## Publicación

El `base` de Vite es relativo y el enrutado va por hash (`#/jugar/spirit/2`), así que
recargar una URL profunda nunca da 404 en hosting estático.

```bash
npm run build       # genera dist/
npm run preview     # comprobar dist/ antes de subir
```

Sube `dist/` a cualquier hosting estático con HTTPS y URL estable. Guarda una **copia
local de `dist/` y un vídeo de respaldo** por si falla la red en la exposición.

---

## Alcance declarado

**Incluye:** tres juegos, tres niveles cada uno, juego individual, cooperación local
opcional en PC, controles táctiles, pausa, reinicio, volumen, movimiento reducido,
progreso local y créditos.

**No incluye:** multijugador por internet, cuentas, chat, IA en vivo, panel docente,
ranking global ni más juegos. La rejilla del portal es densa como la de Friv, pero cada
ficha hace algo real: las grandes abren un juego y las pequeñas abren la ficha de ese
equipo. **Ni un solo botón que no funcione.**

**Orden de recorte si falta tiempo:** rival virtual → modo simultáneo → efectos y voces →
niveles adicionales. Se conservan siempre los tres juegos base, la evidencia científica y
la navegación.

---

## Cambiar el nombre del proyecto

Todo sale de [`src/content/brand.ts`](src/content/brand.ts). Cambia ahí `wordmark`,
`wordmarkDisplay`, `full` y `claim`, y se propaga al portal, al `<title>`, a los créditos
y a la página de proyecto.
