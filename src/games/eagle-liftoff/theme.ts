/**
 * EAGLE LIFTOFF - colourful theme.
 * -------------------------------------------------------------------------
 * The shared stage (HUD, message cards, buttons) is dark and plain. This game
 * is for 9-year-olds, so it paints its own bright look WITHOUT touching the
 * shared CSS: a <style> tag scoped to `.mg--eagle` is added on mount and
 * removed on destroy. Nothing here leaks into the other games.
 */

export const PALETTE = {
  skyTop: '#2a1465',
  skyMid: '#14235f',
  skyBottom: '#071a33',
  // One colour per orbit, inner (fast) to outer (slow).
  rings: ['#ff6b9d', '#ff9f43', '#ffe066', '#5eead4', '#a78bfa'],
  starColors: ['#ffffff', '#ffe9a8', '#bde0fe', '#ffc8dd', '#c8ffd9'],
  gold: '#ffd166',
  goldDeep: '#f3a712',
  ok: '#4ade80',
  bad: '#ff6b6b',
  ink: '#2b1a00',
  bubble: '#fff7e0',
  bubbleText: '#3a2a6b',
} as const

const CSS = `
.mg--eagle {
  background:
    radial-gradient(120% 80% at 15% 0%, rgba(255,107,157,.28), transparent 55%),
    radial-gradient(110% 80% at 100% 100%, rgba(94,234,212,.22), transparent 55%),
    linear-gradient(165deg, #2a1465 0%, #14235f 55%, #0b2a45 100%);
  border-radius: 20px;
}

/* --- Marcadores: cuatro tarjetas de colores --- */
.mg--eagle .mg__stat {
  border: 2px solid rgba(255,255,255,.25);
  border-radius: 16px;
  background: rgba(255,255,255,.09);
  padding: 7px 12px;
  box-shadow: 0 4px 0 rgba(0,0,0,.25);
}
.mg--eagle .mg__stat[data-key='gap']   { border-color: #5eead4; }
.mg--eagle .mg__stat[data-key='speed'] { border-color: #ff9f43; }
.mg--eagle .mg__stat[data-key='burns'] { border-color: #ff6b9d; }
.mg--eagle .mg__stat[data-key='time']  { border-color: #a78bfa; }
.mg--eagle .mg__stat-label {
  text-transform: none;
  letter-spacing: 0;
  font-size: 12px;
  font-weight: 800;
  color: #dfe6ff;
}
.mg--eagle .mg__stat-value {
  font-size: 19px;
  font-weight: 900;
  color: #fff;
}
.mg--eagle .mg__stat.is-ok .mg__stat-value   { color: #7dffb0; }
.mg--eagle .mg__stat.is-warn .mg__stat-value { color: #ffd166; }
.mg--eagle .mg__stat.is-bad .mg__stat-value  { color: #ff9aa8; }
.mg--eagle .mg__stat-bar { height: 8px; background: rgba(255,255,255,.18); }
.mg--eagle .mg__stat-bar i { background: linear-gradient(90deg, #a78bfa, #5eead4); }

/* --- Lienzo --- */
.mg--eagle .mg__canvas {
  border: 3px solid rgba(255,255,255,.28);
  border-radius: 24px;
  box-shadow: 0 0 0 4px rgba(167,139,250,.25), 0 18px 50px -20px rgba(0,0,0,.8);
}

/* --- Tarjetas de mensajes --- */
.mg--eagle .mg__overlay {
  background: radial-gradient(circle at 50% 40%, rgba(60,30,140,.78), rgba(8,10,40,.88));
}
.mg--eagle .mg__card {
  max-width: 420px;
  padding: 22px 24px 20px;
  gap: 12px;
  border-radius: 28px;
  border: 3px solid #ffd166;
  background: linear-gradient(170deg, #3a2488 0%, #1b2a6b 100%);
  box-shadow: 0 8px 0 #c98a1c, 0 24px 50px -14px rgba(0,0,0,.7);
  animation: eagle-pop .45s cubic-bezier(.2,1.4,.4,1);
}
.mg--eagle .mg__card-title {
  font-size: clamp(22px, 4.2vw, 30px);
  font-weight: 900;
  color: #ffe08a;
  text-shadow: 0 3px 0 rgba(0,0,0,.3);
}
.mg--eagle .mg__overlay[data-tone='win'] .mg__card-title  { color: #7dffb0; }
.mg--eagle .mg__overlay[data-tone='lose'] .mg__card-title { color: #ffb4c0; }
.mg--eagle .mg__card-score {
  font-size: 22px;
  font-weight: 900;
  color: #ffd166;
  letter-spacing: .02em;
}
.mg--eagle .mg__card-text {
  font-size: 17px;
  line-height: 1.5;
  font-weight: 700;
  color: #fff;
  white-space: pre-line;
}

/* --- Botones grandes y redondos --- */
.mg--eagle .mg__card-actions .btn {
  border-radius: 999px;
  min-height: 48px;
  padding: 0 22px;
  font-size: 17px;
  font-weight: 900;
  transition: transform .12s ease;
}
.mg--eagle .mg__card-actions .btn--primary {
  background: linear-gradient(180deg, #ffe08a, #ffb02e);
  color: #3a1c00;
  border: 0;
  box-shadow: 0 5px 0 #c26a00, 0 10px 18px -8px rgba(0,0,0,.6);
}
.mg--eagle .mg__card-actions .btn--primary:hover  { transform: translateY(-2px) scale(1.03); }
.mg--eagle .mg__card-actions .btn--primary:active { transform: translateY(3px); box-shadow: 0 2px 0 #c26a00; }
.mg--eagle .mg__card-actions .btn--quiet {
  background: rgba(255,255,255,.1);
  color: #fff;
  border: 2px solid rgba(255,255,255,.4);
}

/* --- Avisos flotantes --- */
.mg--eagle .mg__flash {
  padding: 6px 16px;
  font-size: 18px;
  font-weight: 900;
  color: #2b1a00;
  background: linear-gradient(180deg, #b6ffd0, #4ade80);
  border: 2px solid #fff;
}
.mg--eagle .mg__flash.is-bad {
  background: linear-gradient(180deg, #ffd0d6, #ff8a9b);
}

.mg--eagle .mg__hint { font-size: 13px; color: #dfe6ff; font-weight: 700; }

@keyframes eagle-pop {
  0%   { opacity: 0; transform: scale(.7) translateY(14px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
:root[data-motion='reduced'] .mg--eagle .mg__card { animation: none; }
:root[data-motion='reduced'] .mg--eagle .mg__card-actions .btn { transition: none; }

@media (max-width: 560px) {
  .mg--eagle .mg__stat { padding: 5px 8px; }
  .mg--eagle .mg__stat-value { font-size: 15px; }
  .mg--eagle .mg__stat-label { font-size: 10.5px; }
  .mg--eagle .mg__card { padding: 16px 16px 14px; }
  .mg--eagle .mg__card-text { font-size: 15px; }
}
`

/** Adds the theme to the stage root. Returns the function that removes it. */
export function applyTheme(root: HTMLElement): () => void {
  root.classList.add('mg--eagle')
  const style = document.createElement('style')
  style.setAttribute('data-eagle-liftoff', '')
  style.textContent = CSS
  root.append(style)
  return () => {
    style.remove()
    root.classList.remove('mg--eagle')
  }
}
