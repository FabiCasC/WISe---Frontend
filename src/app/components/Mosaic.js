import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ARCHIVE, PLACE_COLORS, PLACE_LABEL, } from '../../content/archive';
import { MISSIONS } from '../../content/missions';
import GameTile from './GameTile';
import TileIcon from './TileIcon';
/* --------------------------------------------------------------------------
   Variación de color por ficha.
   El destino decide la familia cromática (Luna azul, Marte naranja…), pero si
   todas las fichas de una familia fueran idénticas la rejilla se vería como
   bloques planos. Un desplazamiento determinista de tono y luz por nombre les
   da la variedad de un arcade sin perder la lectura por color.
   -------------------------------------------------------------------------- */
function hash(text) {
    let h = 0;
    for (let i = 0; i < text.length; i++)
        h = (h * 31 + text.charCodeAt(i)) | 0;
    return Math.abs(h);
}
function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0)
        return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h;
    if (max === r)
        h = ((g - b) / d) % 6;
    else if (max === g)
        h = (b - r) / d + 2;
    else
        h = (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s * 100, l * 100];
}
function shift(hex, dh, dl) {
    const [h, s, l] = hexToHsl(hex);
    const hh = (h + dh + 360) % 360;
    const ll = Math.min(92, Math.max(8, l + dl));
    return `hsl(${hh.toFixed(1)} ${s.toFixed(1)}% ${ll.toFixed(1)}%)`;
}
function tileGradient(item) {
    const [from, to] = PLACE_COLORS[item.place];
    const seed = hash(item.name);
    const dh = ((seed % 29) - 14) * 1.1; // ±15° de tono
    const dl = (((seed >> 5) % 17) - 8) * 0.9; // ±7 % de luz
    const angle = 130 + (seed % 5) * 14;
    return `linear-gradient(${angle}deg, ${shift(from, dh, dl)}, ${shift(to, dh, dl * 0.5)})`;
}
/**
 * Baraja determinista (Fisher-Yates con PRNG sembrado).
 * El archivo está escrito agrupado por destino, pero mostrado así la rejilla
 * sale en franjas de color. Mezclado se ve como un arcade; y quien quiera
 * agrupar por destino tiene las pestañas de filtro.
 */
function shuffled(list, seed = 20261114) {
    const out = [...list];
    let s = seed;
    const rand = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
    };
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
/**
 * El gesto característico de Friv: el logotipo huye a otro punto de la
 * rejilla cuando intentas pasarle el ratón por encima, y cambia de forma al
 * llegar. Cada posición tiene su propia silueta de "mancha".
 */
const BLOB_SPOTS = [
    { x: 85, y: 87, rot: -4, shape: '56% 44% 52% 48% / 58% 54% 46% 42%' },
    { x: 16, y: 85, rot: 6, shape: '44% 56% 38% 62% / 48% 42% 58% 52%' },
    { x: 86, y: 20, rot: 5, shape: '62% 38% 58% 42% / 40% 60% 40% 60%' },
    { x: 50, y: 54, rot: -7, shape: '38% 62% 46% 54% / 62% 38% 62% 38%' },
    { x: 18, y: 24, rot: -6, shape: '50% 50% 62% 38% / 44% 56% 44% 56%' },
    { x: 66, y: 68, rot: 8, shape: '58% 42% 40% 60% / 52% 60% 40% 48%' },
];
const FILTERS = [
    { id: 'todo', label: 'Todo' },
    { id: 'luna', label: 'Luna' },
    { id: 'marte', label: 'Marte' },
    { id: 'venus', label: 'Venus' },
    { id: 'asteroide', label: 'Asteroides' },
    { id: 'cometa', label: 'Cometas' },
    { id: 'titan', label: 'Titán' },
    { id: 'mercurio', label: 'Mercurio' },
    { id: 'gigante', label: 'Gigantes' },
    { id: 'orbita', label: 'Órbita' },
    { id: 'profundo', label: 'Lejos' },
];
/** Dónde se intercalan los juegos entre las fichas del archivo. */
const GAME_SLOTS = [6, 34, 63];
/**
 * La pared de fichas. Los juegos viven DENTRO de la rejilla, como en Friv:
 * ocupan 2×2 celdas y se reconocen por la cinta «JUGAR». Arriba de la página
 * aparecen además destacados, igual que un portal de juegos pone delante sus
 * novedades.
 */
export default function Mosaic({ progress, reducedMotion, onPlay, onItem }) {
    const [filter, setFilter] = useState('todo');
    const [spot, setSpot] = useState(0);
    const cells = useMemo(() => {
        const items = filter === 'todo' ? shuffled(ARCHIVE) : ARCHIVE.filter((i) => i.place === filter);
        // Al filtrar por cuerpo solo tienen sentido los juegos de ese cuerpo.
        const games = filter === 'todo'
            ? MISSIONS
            : filter === 'luna' || filter === 'marte'
                ? MISSIONS.filter((m) => m.body === filter)
                : [];
        const out = [];
        let g = 0;
        items.forEach((item, i) => {
            if (g < games.length && GAME_SLOTS.includes(i))
                out.push({ t: 'game', mission: games[g++] });
            out.push({ t: 'item', item });
        });
        while (g < games.length)
            out.push({ t: 'game', mission: games[g++] });
        return out;
    }, [filter]);
    const itemCount = cells.filter((c) => c.t === 'item').length;
    const gameCount = cells.length - itemCount;
    /** Salta a cualquier punto menos al actual. */
    const dodge = () => {
        if (reducedMotion)
            return;
        setSpot((prev) => {
            let next = prev;
            while (next === prev)
                next = Math.floor(Math.random() * BLOB_SPOTS.length);
            return next;
        });
    };
    return (_jsxs("section", { className: "mosaic", id: "archivo", "aria-label": "Archivo orbital", children: [_jsxs("div", { className: "mosaic__bar", children: [_jsx("div", { className: "mosaic__tabs", role: "tablist", "aria-label": "Filtrar el archivo", children: FILTERS.map((f) => (_jsx("button", { type: "button", role: "tab", "aria-selected": filter === f.id, className: `tab${filter === f.id ? ' is-on' : ''}`, onClick: () => setFilter(f.id), children: f.label }, f.id))) }), _jsxs("p", { className: "mosaic__hint", children: [gameCount > 0 && (_jsxs(_Fragment, { children: [_jsxs("strong", { children: [gameCount, " juegos"] }), " \u00B7", ' '] })), itemCount, " equipos \u00B7 toca cualquier ficha"] })] }), _jsx("div", { className: "mosaic__grid", children: cells.map((cell) => cell.t === 'game' ? (_jsx(GameTile, { mission: cell.mission, progress: progress, onPlay: () => onPlay(cell.mission) }, `g-${cell.mission.gameId}`)) : (_jsxs("button", { type: "button", className: `tile tile--item is-${cell.item.status}`, style: { background: tileGradient(cell.item) }, onClick: () => onItem(cell.item), title: `${cell.item.name} · ${PLACE_LABEL[cell.item.place]} · ${cell.item.year}`, children: [_jsx("span", { className: "tile__glyph", children: _jsx(TileIcon, { kind: cell.item.kind }) }), _jsx("span", { className: "tile__year", children: cell.item.year }), _jsx("span", { className: "tile__status" }), _jsx("span", { className: "tile__label", children: cell.item.name })] }, cell.item.name))) }), _jsxs("div", { className: "mosaic__blob", "aria-hidden": "true", onMouseEnter: dodge, style: {
                    left: `${BLOB_SPOTS[spot].x}%`,
                    top: `${BLOB_SPOTS[spot].y}%`,
                    borderRadius: BLOB_SPOTS[spot].shape,
                    ['--rot']: `${BLOB_SPOTS[spot].rot}deg`,
                }, children: [_jsx("span", { className: "mosaic__blob-word", children: "\u00D3RBITA" }), _jsx("span", { className: "mosaic__blob-sub", children: "ARCADE" }), _jsx("span", { className: "mosaic__blob-badge", children: "archivo" })] })] }));
}
