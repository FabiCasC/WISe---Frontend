/** Game CSS. It lives inside the game's own container and is removed with it on destroy(). */
export const STYLES = `
.nq-root{position:relative;display:flex;flex-direction:column;gap:14px;width:100%;height:100%;
  overflow:auto;padding:16px;box-sizing:border-box;color:var(--text,#e8f0ff);
  font-family:'Space Grotesk',system-ui,sans-serif}
.nq-card{display:flex;flex-direction:column;gap:12px;max-width:760px;padding:16px;border-radius:16px;
  background:rgba(10,26,48,.75);border:1px solid rgba(109,226,242,.3)}
.nq-status{margin:0;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#6DE2F2}
.nq-title{margin:0;font-family:Orbitron,system-ui,sans-serif;font-size:20px}
.nq-intro{margin:0;font-size:14px;color:var(--text-dim,#a9b8d0);line-height:1.5}
.nq-clue{margin:0;font-size:20px;line-height:1.35}
.nq-range{margin:0;font-size:13px;color:var(--text-faint,#7f8fa8)}
.nq-hint{margin:0;font-size:15px;color:#F2C94C}
.nq-hint:empty,.nq-feedback:empty{display:none}
.nq-feedback{margin:0;min-height:22px;font-size:16px;line-height:1.4}
.nq-feedback.is-ok{color:#7be3a4}.nq-feedback.is-bad{color:#ffb38a}
.nq-row{display:flex;flex-wrap:wrap;gap:10px}
.nq-input{flex:1 1 160px;min-height:52px;padding:0 16px;border:none;border-radius:14px;background:#fff;
  color:#1875E8;font:700 24px 'Space Grotesk',system-ui,sans-serif}
.nq-input:disabled{opacity:.5}
.nq-log{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;
  background:rgba(24,117,232,.15);border:1px solid #1875E8}
.nq-log strong{font-family:Orbitron,system-ui,sans-serif;font-size:15px}
.nq-log p{margin:0;font-size:15px;line-height:1.45}
.nq-log a,.nq-end a{color:#6DE2F2;font-size:14px}
.nq-end{display:flex;flex-direction:column;gap:10px;max-width:760px;padding:16px;border-radius:16px;
  background:rgba(10,26,48,.85);border:1px solid rgba(123,227,164,.4)}
.nq-end p{margin:0;line-height:1.5}
.nq-end ul{margin:0;padding-left:18px}
.nq-bar{position:relative;height:26px;border-radius:13px;background:rgba(255,255,255,.1);overflow:hidden}
.nq-bar-fill{position:absolute;top:0;bottom:0;background:linear-gradient(90deg,#1875E8,#6DE2F2);border-radius:13px;transition:left .35s,width .35s}
.nq-bar-ticks{position:absolute;inset:0}
.nq-tick{position:absolute;top:2px;bottom:2px;width:4px;margin-left:-2px;border-radius:2px}
.nq-tick.is-read{background:#F2C94C}.nq-tick.is-truth{background:#7be3a4;width:6px}
.nq-help{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;cursor:pointer;
  border:2px solid #6DE2F2;background:rgba(12,16,28,.92);color:#eef3ff;font:700 16px system-ui,sans-serif}
.nq-pause{position:absolute;inset:0;display:none;align-items:center;justify-content:center;
  background:rgba(5,11,24,.8);font-family:Orbitron,system-ui,sans-serif;font-size:22px}
.nq-root.is-paused .nq-pause{display:flex}
`
