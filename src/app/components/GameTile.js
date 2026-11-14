import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { IconPlay, MissionScene } from './Art';
/**
 * Azulejo de juego. Dos tamaños:
 *   · grid     → ocupa 2×2 celdas dentro del mosaico
 *   · featured → suelto y grande, para la fila centrada de juegos reales
 */
export default function GameTile({ mission, progress, onPlay, variant = 'grid', }) {
    const done = progress.games[mission.gameId]?.levelsCompleted ?? [];
    // La ilustración solo se muestra si de verdad cargó; si falta, debajo sigue
    // estando la escena dibujada en CSS/SVG y el azulejo nunca se ve roto.
    const [artLoaded, setArtLoaded] = useState(false);
    const featured = variant === 'featured';
    return (_jsxs("button", { type: "button", className: `tile tile--game${featured ? ' tile--featured' : ''}`, style: { ['--accent']: mission.accent }, onClick: onPlay, children: [_jsx("span", { className: "tile__scene", children: _jsx(MissionScene, { gameId: mission.gameId, accent: mission.accent }) }), _jsx("img", { className: `tile__art${artLoaded ? ' is-loaded' : ''}`, src: mission.art, alt: "", loading: featured ? 'eager' : 'lazy', decoding: "async", onLoad: () => setArtLoaded(true), onError: () => setArtLoaded(false) }), _jsx("span", { className: "tile__flag", children: "JUGAR" }), _jsx("span", { className: "tile__shade" }), _jsxs("span", { className: "tile__caption", children: [featured && _jsx("span", { className: "tile__body", children: mission.bodyLabel }), _jsx("span", { className: "tile__name", children: mission.title }), featured && _jsx("span", { className: "tile__kicker", children: mission.genre }), _jsxs("span", { className: "tile__dots", children: [mission.levels.map((l) => (_jsx("i", { className: `dot${done.includes(l.id) ? ' is-on' : ''}` }, l.id))), featured && (_jsxs("span", { className: "tile__count", children: [done.length, "/", mission.levels.length] }))] })] }), _jsx("span", { className: "tile__play", children: _jsx(IconPlay, { size: featured ? 30 : 22 }) })] }));
}
