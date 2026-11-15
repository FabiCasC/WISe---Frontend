/** Game CSS. Lives inside the container itself and is removed with it in destroy(). */
export const STYLES = `
.ls-root{position:relative;display:flex;flex-direction:column;gap:14px;width:100%;height:100%;
  overflow:auto;padding:16px;box-sizing:border-box;color:var(--text,#e8f0ff);
  font-family:'Space Grotesk',system-ui,sans-serif}
.ls-head{max-width:760px}
.ls-title{margin:0 0 4px;font-family:Orbitron,system-ui,sans-serif;font-size:20px}
.ls-text{margin:0;color:var(--text-dim,#a9b8d0);font-size:14px;line-height:1.5}
.ls-stage{display:flex;flex-direction:column;gap:14px}
.ls-msg{margin:0;min-height:22px;font-size:14px;line-height:1.45}
.ls-msg.is-ok{color:#7be3a4}.ls-msg.is-bad{color:#ffb38a}
.ls-note{margin:0;font-size:12px;color:var(--text-faint,#7f8fa8)}
.ls-readout{margin:0;font-size:14px;font-variant-numeric:tabular-nums}

/* Level 1 */
.ls-l1{display:flex;flex-direction:column;gap:14px;max-width:760px}
.ls-track{padding:30px 40px;border-radius:14px;background:rgba(10,26,48,.7);border:1px solid rgba(109,226,242,.25)}
.ls-rail{position:relative;height:8px}
.ls-line{position:absolute;inset:3px 0;height:2px;background:rgba(109,226,242,.35)}
.ls-earth,.ls-moon,.ls-pulse,.ls-marker{position:absolute;top:50%;transform:translate(-50%,-50%)}
.ls-earth{left:0;width:34px;height:34px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#9bd7ff,#1f5fa8 60%,#0d2a52)}
.ls-moon{width:26px;height:26px;border-radius:50%;
  background:radial-gradient(circle at 35% 30%,#f2f2f2,#9aa0aa 65%,#5b6068)}
.ls-pulse{width:12px;height:12px;border-radius:50%;background:#9bf6ff;box-shadow:0 0 14px 4px rgba(109,226,242,.8)}
.ls-marker{width:4px;height:42px;border-radius:2px;background:#E68A68;box-shadow:0 0 0 2px rgba(230,138,104,.25)}
.ls-watch{display:flex;align-items:baseline;gap:10px}
.ls-watch__label{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-faint,#7f8fa8)}
.ls-watch__value{font-family:Orbitron,system-ui,sans-serif;font-size:28px;font-variant-numeric:tabular-nums}
.ls-tools{display:flex;flex-direction:column;gap:10px}
.ls-slider{width:100%;min-height:44px;accent-color:#6DE2F2}

/* Levels 2 and 3 */
.ls-quake{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start}
.ls-map{flex:1 1 300px;max-width:460px;aspect-ratio:1;touch-action:manipulation;cursor:crosshair}
.ls-map__bg{fill:#101a2b;stroke:rgba(109,226,242,.3);stroke-width:.4}
.ls-map__crater{fill:none;stroke:rgba(255,255,255,.08);stroke-width:.6}
.ls-station circle{fill:#6DE2F2}
.ls-station text{fill:#e8f0ff;font-size:4px}
.ls-station.is-dead circle{fill:#566176}
.ls-station.is-dead text{fill:#8592a8}
.ls-circle{fill:rgba(109,226,242,.06);stroke:#6DE2F2;stroke-width:.7}
.ls-circle.is-preview{stroke:#E68A68;stroke-dasharray:2 1.6}
.ls-dot{fill:#E68A68}
.ls-dot.is-final{fill:#7be3a4}
.ls-dot.is-ghost{fill:none;stroke:#E68A68;stroke-width:.7;stroke-dasharray:1.4 1}
.ls-pick{fill:#ffffff;stroke:#E68A68;stroke-width:.8}
.ls-panel{flex:1 1 300px;max-width:460px;display:flex;flex-direction:column;gap:10px}
.ls-tabs{display:flex;flex-wrap:wrap;gap:8px}
.ls-tab{min-height:44px;padding:0 14px;border-radius:10px;border:1px solid rgba(109,226,242,.3);
  background:transparent;color:inherit;font:inherit;cursor:pointer}
.ls-tab.is-on{background:rgba(109,226,242,.18);border-color:#6DE2F2}
.ls-tab.is-done::after{content:' ✓';color:#7be3a4}
.ls-tab:disabled{opacity:.45;cursor:not-allowed}
.ls-graph{width:100%;background:rgba(10,26,48,.7);border:1px solid rgba(109,226,242,.25);border-radius:10px}
.ls-graph__trace{fill:none;stroke:#9bf6ff;stroke-width:1}
.ls-graph__mark{stroke:#E68A68;stroke-width:.6;stroke-dasharray:2 2}
.ls-graph__tick{stroke:rgba(255,255,255,.35);stroke-width:.5}
.ls-graph__num{fill:rgba(255,255,255,.5);font-size:4.5px}
.ls-graph__label{fill:#E68A68;font-size:7px;font-weight:700}
.ls-answer{display:flex;flex-wrap:wrap;gap:8px}

/* Ending and pause */
.ls-end{display:flex;flex-direction:column;gap:12px;max-width:760px;padding:16px;border-radius:14px;
  background:rgba(10,26,48,.85);border:1px solid rgba(123,227,164,.4)}
.ls-end p{margin:0;line-height:1.5}
.ls-ficha{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:10px;
  background:rgba(255,255,255,.04)}
.ls-ficha h3{margin:0;font-size:15px}
.ls-ficha a{color:#6DE2F2}
.ls-pause{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(5,11,24,.8);font-family:Orbitron,system-ui,sans-serif;font-size:22px}
.ls-root.is-paused .ls-pause{display:flex}

/* Animations (all disabled by .is-reduced, i.e. "reduced motion") */
.is-reduced *{animation:none!important;transition:none!important}
.ls-beam{position:absolute;top:50%;left:0;width:0;height:3px;transform:translateY(-50%);border-radius:2px;
  background:linear-gradient(90deg,rgba(155,246,255,0),#9bf6ff);pointer-events:none}
.ls-pulse.is-back{background:#ffd6a5;box-shadow:0 0 14px 4px rgba(255,170,90,.8)}
.ls-moon.is-hit{animation:ls-hit .5s ease-out}
@keyframes ls-hit{from{box-shadow:0 0 0 0 rgba(155,246,255,.9)}to{box-shadow:0 0 0 22px rgba(155,246,255,0)}}
.ls-marker.is-locked{background:#7be3a4;animation:ls-lock 1.2s ease-in-out infinite}
@keyframes ls-lock{50%{box-shadow:0 0 0 6px rgba(123,227,164,.35)}}
.ls-graph__trace{stroke-dasharray:1;stroke-dashoffset:0;animation:ls-draw .9s ease-out backwards}
@keyframes ls-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.ls-dot{transform-box:fill-box;transform-origin:center;animation:ls-pop .35s ease-out backwards}
@keyframes ls-pop{from{transform:scale(0)}to{transform:scale(1)}}
.ls-map.is-quake{animation:ls-shake 1.1s ease-in-out}
@keyframes ls-shake{0%,100%{transform:translate(0,0)}10%{transform:translate(-4px,2px)}20%{transform:translate(4px,-2px)}
  30%{transform:translate(-3px,-3px)}40%{transform:translate(3px,3px)}55%{transform:translate(-2px,1px)}70%{transform:translate(2px,-1px)}}
.ls-station:not(.is-dead) circle{animation:ls-blip 2.4s ease-in-out infinite}
@keyframes ls-blip{50%{opacity:.55}}
.ls-wave{fill:none;stroke-width:.8}
.ls-wave--p{stroke:#6DE2F2}
.ls-wave--s{stroke:#E68A68}
`
