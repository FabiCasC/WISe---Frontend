import { useEffect, useState } from 'react';
import { GAME_IDS } from '../../shared/progress';
function parse(hash) {
    if (hash === '' || hash === '#' || hash === '#/')
        return { name: 'landing' };
    // Ancla suelta: no es una ruta.
    if (!hash.startsWith('#/'))
        return null;
    const parts = hash.slice(2).split('/').filter(Boolean);
    if (parts[0] === 'arcade')
        return { name: 'arcade' };
    if (parts[0] === 'jugar') {
        const gameId = parts[1];
        const level = Number(parts[2] ?? 1);
        if (GAME_IDS.includes(gameId) && [1, 2, 3].includes(level)) {
            return { name: 'play', gameId, levelId: level };
        }
    }
    return { name: 'landing' };
}
export function navigate(to) {
    if (window.location.hash === to)
        return;
    window.location.hash = to;
}
export function useHashRoute() {
    const [route, setRoute] = useState(() => parse(window.location.hash) ?? { name: 'landing' });
    useEffect(() => {
        const onChange = () => {
            const next = parse(window.location.hash);
            // null = ancla dentro de la página: se queda donde está.
            if (next)
                setRoute(next);
        };
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);
    return route;
}
/**
 * Al cambiar de página hay que volver arriba — salvo que la URL traiga un
 * ancla, en cuyo caso se va a esa sección. Moverse entre anclas de la misma
 * página no dispara esto: lo resuelve el navegador.
 */
export function useScrollReset(key) {
    useEffect(() => {
        // Sirve tanto para un ancla suelta (#pasaporte) como para una ruta que
        // apunta a una sección de otra página (#/pasaporte): tras quitar el
        // prefijo, ambas dejan el mismo id.
        const target = window.location.hash.replace(/^#\/?/, '');
        const el = target ? document.getElementById(decodeURIComponent(target)) : null;
        if (el) {
            // Un frame de margen: la sección acaba de montarse.
            requestAnimationFrame(() => el.scrollIntoView());
            return;
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    }, [key]);
}
