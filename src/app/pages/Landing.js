import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ARCHIVE_STATS } from '../../content/archive';
import { BRAND } from '../../content/brand';
import { MISSIONS } from '../../content/missions';
import { GAME_IDS, totalScore } from '../../shared/progress';
import { IconPlay, IconStamp } from '../components/Art';
import PortalCard from '../components/PortalCard';
import SiteFooter from '../components/SiteFooter';
const CREW = [
    {
        role: 'Kevin · Telecomunicaciones',
        task: 'Integración, portal, UX y publicación. Apoyo al juego 3.',
        out: 'Una sola navegación, carga de módulos, progreso y demo pública.',
    },
    {
        role: 'Computación Científica 1',
        task: 'Reglas y generación del juego 1.',
        out: 'Intercambios, cascadas y tablero siempre jugable.',
    },
    {
        role: 'Ingeniería de Software',
        task: 'Escenas, interacción y entrega del juego 1.',
        out: 'Tres niveles integrados; build y pruebas automatizadas comunes.',
    },
    {
        role: 'Computación Científica 2',
        task: 'Reglas y mapas del juego 2.',
        out: 'Interruptores, haces y tres soluciones comprobadas.',
    },
    {
        role: 'Ingeniería de Sistemas',
        task: 'Controles, escenas del juego 2 y apoyo al despliegue.',
        out: 'Modo individual completo; móvil probado y URL de respaldo.',
    },
    {
        role: 'Ingeniería Estadística',
        task: 'Reglas del juego 3, dificultad y validación educativa.',
        out: 'Rutas con energía suficiente; registro de pruebas honesto.',
    },
];
export default function Landing({ progress, onPlay, onDossier }) {
    const stamps = progress.memories.length;
    const score = totalScore(progress);
    const levelsDone = GAME_IDS.reduce((n, id) => n + progress.games[id].levelsCompleted.length, 0);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "cover", children: [_jsxs("div", { className: "cover__media", "aria-hidden": "true", children: [_jsx("img", { className: "cover__img", src: "assets/brand/hero.webp", alt: "" }), _jsx("span", { className: "cover__tint" })] }), _jsxs("div", { className: "cover__inner", children: [_jsx("span", { className: "cover__eyebrow", children: BRAND.event }), _jsxs("h1", { className: "cover__word", "aria-label": BRAND.full, children: [_jsx("span", { "aria-hidden": "true", children: BRAND.wordmarkDisplay }), _jsx("span", { className: "cover__word-sub", "aria-hidden": "true", children: BRAND.wordmarkSub })] }), _jsx("p", { className: "cover__claim", children: BRAND.claim }), _jsx("p", { className: "cover__lede", children: BRAND.tagline }), _jsxs("div", { className: "cover__cta", children: [_jsxs("a", { className: "btn btn--xl btn--primary", href: "#/arcade", children: [_jsx(IconPlay, { size: 24 }), "Entrar al arcade"] }), _jsx("a", { className: "btn btn--xl btn--ghost", href: "#juegos", children: "Ver los tres juegos" })] }), _jsxs("div", { className: "cover__stats", children: [_jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat__value", children: MISSIONS.length }), _jsx("div", { className: "stat__label", children: "Juegos" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat__value", children: ARCHIVE_STATS.total }), _jsx("div", { className: "stat__label", children: "Equipos reales" })] }), _jsxs("div", { className: "stat", children: [_jsxs("div", { className: "stat__value", children: [levelsDone, "/9"] }), _jsx("div", { className: "stat__label", children: "Niveles" })] }), _jsxs("div", { className: "stat", children: [_jsxs("div", { className: "stat__value", children: [stamps, "/3"] }), _jsx("div", { className: "stat__label", children: "Recuerdos" })] }), _jsxs("div", { className: "stat", children: [_jsx("div", { className: "stat__value", style: { fontVariantNumeric: 'tabular-nums' }, children: score.toLocaleString('es') }), _jsx("div", { className: "stat__label", children: "Puntos" })] })] })] }), _jsx("a", { className: "cover__scroll", href: "#juegos", "aria-label": "Bajar a los juegos", children: _jsx("span", {}) })] }), _jsxs("section", { className: "section wrap", id: "juegos", children: [_jsxs("div", { className: "section__head section__head--center", children: [_jsx("span", { className: "section__kicker", children: "Tres misiones reales" }), _jsx("h2", { className: "section__title", children: "Tres equipos que siguen all\u00ED" }), _jsx("p", { className: "section__note", children: "Cada partida dura entre dos y cuatro minutos. Al terminar se abre el recuerdo de la misi\u00F3n y su ficha real con fuente." })] }), _jsx("div", { className: "portals portals--center", children: MISSIONS.map((mission) => (_jsx(PortalCard, { mission: mission, progress: progress, onPlay: () => onPlay(mission), onDossier: () => onDossier(mission.gameId) }, mission.gameId))) }), _jsx("div", { className: "section__foot", children: _jsxs("a", { className: "btn btn--lg btn--ghost", href: "#/arcade", children: [_jsx(IconPlay, {}), "Ver tambi\u00E9n el archivo de ", ARCHIVE_STATS.total, " equipos"] }) })] }), _jsx("section", { className: "section wrap", id: "pasaporte", children: _jsxs("div", { className: "passport", children: [_jsxs("div", { className: "section__head", style: { marginBottom: 0 }, children: [_jsxs("div", { children: [_jsx("span", { className: "section__kicker", children: "Progreso" }), _jsxs("h2", { className: "section__title", children: ["Pasaporte de recuerdos \u00B7 ", stamps, "/3"] })] }), _jsx("p", { className: "section__note", children: "Al completar una misi\u00F3n se sella su recuerdo. Con los tres sellos se abre el museo final, donde los tres protagonistas aparecen juntos." })] }), _jsx("div", { className: "passport__grid", children: MISSIONS.map((mission) => {
                                const unlocked = progress.memories.includes(mission.gameId);
                                const best = Math.max(0, ...Object.values(progress.games[mission.gameId].bestScore).map((v) => v ?? 0));
                                return (_jsxs("div", { className: `memory${unlocked ? ' is-unlocked' : ''}`, style: { ['--accent']: mission.accent }, children: [_jsx("span", { className: "memory__seal", children: _jsx(IconStamp, { size: 20 }) }), _jsx("span", { className: "memory__name", children: mission.hardware }), _jsx("span", { className: "memory__state", children: unlocked
                                                ? `Recuerdo recuperado · mejor puntuación ${best}`
                                                : 'Sin sellar. Completa un nivel para abrirlo.' })] }, mission.gameId));
                            }) })] }) }), _jsxs("section", { className: "section wrap", id: "equipo", children: [_jsxs("div", { className: "section__head", children: [_jsxs("div", { children: [_jsx("span", { className: "section__kicker", children: "Seis integrantes \u00B7 tres parejas" }), _jsx("h2", { className: "section__title", children: "Qui\u00E9n construye qu\u00E9" })] }), _jsx("p", { className: "section__note", children: "Cada pareja trabaja en su carpeta contra el mismo contrato de integraci\u00F3n, as\u00ED que la base nunca bloquea a los juegos." })] }), _jsx("div", { className: "crew", children: CREW.map((member) => (_jsxs("div", { className: "crew__card", children: [_jsx("div", { className: "crew__role", children: member.role }), _jsx("p", { className: "crew__task", children: member.task }), _jsx("p", { className: "crew__out", children: member.out })] }, member.role))) })] }), _jsx(SiteFooter, {})] }));
}
