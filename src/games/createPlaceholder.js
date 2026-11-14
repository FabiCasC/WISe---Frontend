import { getMission } from '../content/missions';
/**
 * ANDAMIO PROVISIONAL — se borra cuando llegue el juego real.
 *
 * Existe por una razón concreta del plan: el primer hito del evento es
 * "tres portales que abren y cierran su módulo". Este andamio ya cumple el
 * contrato completo (mountGame → pause/resume/destroy, onComplete, onExit),
 * así que el portal se puede integrar, probar y demostrar mientras cada
 * pareja construye su juego dentro de su carpeta.
 *
 * Para sustituirlo: borrar la llamada en src/games/<id>/index.ts y exportar
 * ahí el mountGame real. Nada más del portal necesita cambiar.
 */
export function createPlaceholder(gameId) {
    return function mountGame(container, ctx) {
        const mission = getMission(gameId);
        const level = mission?.levels.find((l) => l.id === ctx.levelId);
        const startedAt = performance.now();
        let elapsedMs = 0;
        let lastTick = performance.now();
        let paused = false;
        let raf = 0;
        let destroyed = false;
        const root = document.createElement('div');
        root.className = 'stub';
        const ring = document.createElement('div');
        ring.className = 'stub__ring';
        const title = document.createElement('h2');
        title.className = 'stub__title';
        title.textContent = mission?.title ?? gameId;
        const text = document.createElement('p');
        text.className = 'stub__text';
        text.textContent =
            'Módulo reservado. El contenedor, el ciclo de vida y el guardado ya funcionan: ' +
                'la pareja responsable construye el juego dentro de esta carpeta sin tocar el portal.';
        const specs = document.createElement('div');
        specs.className = 'stub__specs';
        const rows = [
            ['Nivel', level ? `${level.id} · ${level.name} — ${level.goal}` : String(ctx.levelId)],
            ['Idea', level?.idea ?? '—'],
            ['Equipo', mission?.crew ?? '—'],
            ['Semilla', ctx.seed],
            [
                'Ajustes',
                `volumen ${Math.round(ctx.settings.volume * 100)}% · ` +
                    `${ctx.settings.reducedMotion ? 'movimiento reducido' : 'movimiento completo'} · ` +
                    `${ctx.settings.practice ? 'práctica' : 'normal'}`,
            ],
        ];
        for (const [label, value] of rows) {
            const row = document.createElement('div');
            row.className = 'stub__spec';
            const b = document.createElement('b');
            b.textContent = label;
            const span = document.createElement('span');
            span.textContent = value;
            row.append(b, span);
            specs.append(row);
        }
        const clock = document.createElement('div');
        clock.className = 'stub__spec';
        const clockLabel = document.createElement('b');
        clockLabel.textContent = 'Reloj';
        const clockValue = document.createElement('span');
        clock.append(clockLabel, clockValue);
        specs.append(clock);
        // Botón de prueba: demuestra el camino completo partida → pasaporte.
        const finish = document.createElement('button');
        finish.type = 'button';
        finish.className = 'btn btn--primary';
        finish.style.marginTop = '8px';
        finish.textContent = 'Simular partida completada';
        finish.addEventListener('click', () => {
            ctx.onComplete({
                gameId,
                levelId: ctx.levelId,
                score: 0,
                durationMs: Math.round(performance.now() - startedAt),
                completed: true,
                evidenceIds: mission?.evidence.map((e) => e.id) ?? [],
                firstAnswerCorrect: false,
            });
        });
        const note = document.createElement('p');
        note.className = 'stub__text';
        note.style.fontSize = '12px';
        note.style.color = 'var(--text-faint)';
        note.textContent =
            'El botón de arriba es una prueba de integración: sella el recuerdo en el ' +
                'pasaporte con puntuación 0 para comprobar el circuito completo.';
        root.append(ring, title, text, specs, finish, note);
        container.append(root);
        // Bucle propio: sirve para verificar que pause/resume/destroy funcionan.
        const tick = () => {
            if (destroyed)
                return;
            const now = performance.now();
            if (!paused)
                elapsedMs += now - lastTick;
            lastTick = now;
            const s = Math.floor(elapsedMs / 1000);
            clockValue.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}${paused ? ' (en pausa)' : ''}`;
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return {
            pause() {
                paused = true;
            },
            resume() {
                lastTick = performance.now();
                paused = false;
            },
            /**
             * Debe resolver SOLO cuando ya no queda nada en el DOM.
             * El juego real hará aquí: game.destroy(true) + esperar su evento.
             */
            destroy() {
                destroyed = true;
                cancelAnimationFrame(raf);
                root.remove();
                return Promise.resolve();
            },
        };
    };
}
