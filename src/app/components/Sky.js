import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
const COLORS = ['#ffffff', '#dff4ff', '#cfe0ff', '#ffe6d2', '#bfefff'];
/**
 * Campo de estrellas en canvas.
 * - Se redimensiona con el contenedor y respeta devicePixelRatio.
 * - Se detiene al ocultar la pestaña (no gasta batería en móvil).
 * - Con movimiento reducido dibuja UN fotograma fijo y se apaga.
 */
export default function Sky({ reducedMotion }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let stars = [];
        let shooters = [];
        let raf = 0;
        let running = true;
        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        const build = () => {
            const rect = canvas.getBoundingClientRect();
            width = Math.max(1, Math.floor(rect.width));
            height = Math.max(1, Math.floor(rect.height));
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Densidad proporcional al área, con tope para equipos modestos.
            const count = Math.min(420, Math.round((width * height) / 5200));
            stars = Array.from({ length: count }, () => {
                const depth = Math.random();
                return {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    r: 0.4 + depth * 1.5,
                    depth,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.6 + Math.random() * 1.4,
                };
            });
        };
        const spawnShooter = () => {
            if (reducedMotion)
                return;
            const fromLeft = Math.random() > 0.5;
            shooters.push({
                x: fromLeft ? -40 : width + 40,
                y: Math.random() * height * 0.55,
                vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4),
                vy: 1.6 + Math.random() * 1.6,
                life: 1,
                len: 90 + Math.random() * 110,
            });
        };
        const draw = (t) => {
            ctx.clearRect(0, 0, width, height);
            // Parallax suavizado hacia la posición del puntero.
            pointer.x += (pointer.tx - pointer.x) * 0.045;
            pointer.y += (pointer.ty - pointer.y) * 0.045;
            for (const s of stars) {
                const twinkle = reducedMotion
                    ? 0.75
                    : 0.55 + 0.45 * Math.sin(t * 0.0012 * s.speed + s.phase);
                const ox = reducedMotion ? 0 : pointer.x * (4 + s.depth * 20);
                const oy = reducedMotion ? 0 : pointer.y * (4 + s.depth * 20);
                ctx.globalAlpha = Math.max(0.08, twinkle * (0.25 + s.depth * 0.75));
                ctx.fillStyle = COLORS[Math.floor(s.depth * COLORS.length) % COLORS.length];
                ctx.beginPath();
                ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
                ctx.fill();
                // Las estrellas más cercanas reciben un halo discreto.
                if (s.depth > 0.86) {
                    ctx.globalAlpha *= 0.22;
                    ctx.beginPath();
                    ctx.arc(s.x + ox, s.y + oy, s.r * 4.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            // Estrellas fugaces.
            shooters = shooters.filter((sh) => sh.life > 0);
            for (const sh of shooters) {
                sh.x += sh.vx;
                sh.y += sh.vy;
                sh.life -= 0.012;
                const tailX = sh.x - (sh.vx / Math.hypot(sh.vx, sh.vy)) * sh.len;
                const tailY = sh.y - (sh.vy / Math.hypot(sh.vx, sh.vy)) * sh.len;
                const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
                grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, sh.life)})`);
                grad.addColorStop(1, 'rgba(109,226,242,0)');
                ctx.globalAlpha = 1;
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(sh.x, sh.y);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        };
        const loop = (t) => {
            if (!running)
                return;
            draw(t);
            raf = requestAnimationFrame(loop);
        };
        const onResize = () => {
            build();
            if (reducedMotion)
                draw(0);
        };
        const onPointer = (e) => {
            pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
            pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        const onVisibility = () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(raf);
            }
            else if (!reducedMotion) {
                running = true;
                raf = requestAnimationFrame(loop);
            }
        };
        build();
        let shooterTimer = 0;
        if (reducedMotion) {
            draw(0);
        }
        else {
            raf = requestAnimationFrame(loop);
            window.addEventListener('pointermove', onPointer, { passive: true });
            shooterTimer = window.setInterval(spawnShooter, 4200);
        }
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            running = false;
            cancelAnimationFrame(raf);
            window.clearInterval(shooterTimer);
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointermove', onPointer);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [reducedMotion]);
    return (_jsxs("div", { className: "sky", "aria-hidden": "true", children: [_jsx("canvas", { ref: canvasRef, className: "sky__stars" }), _jsx("span", { className: "sky__nebula sky__nebula--a" }), _jsx("span", { className: "sky__nebula sky__nebula--b" }), _jsx("span", { className: "sky__nebula sky__nebula--c" }), _jsx("span", { className: "sky__grid" }), _jsx("span", { className: "sky__vignette" })] }));
}
