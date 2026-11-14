import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ARCHIVE_STATS } from '../../content/archive';
import { MISSIONS } from '../../content/missions';
import { GAME_IDS } from '../../shared/progress';
import GameTile from '../components/GameTile';
import Mosaic from '../components/Mosaic';
import SiteFooter from '../components/SiteFooter';
export default function Arcade({ progress, onPlay, onItem }) {
    const levelsDone = GAME_IDS.reduce((n, id) => n + progress.games[id].levelsCompleted.length, 0);
    return (_jsxs(_Fragment, { children: [_jsxs("section", { className: "arcade-top", id: "juegos", children: [_jsx("div", { className: "arcade-top__aurora", "aria-hidden": "true" }), _jsxs("div", { className: "arcade-top__inner", children: [_jsxs("div", { className: "arcade-top__head", children: [_jsx("h1", { className: "arcade-top__title", children: "Elige tu misi\u00F3n" }), _jsxs("div", { className: "arcade-top__meta", children: [_jsxs("span", { className: "chip chip--accent", children: [MISSIONS.length, " juegos listos"] }), _jsxs("span", { className: "chip", children: [levelsDone, "/9 niveles"] }), _jsxs("span", { className: "chip", children: [ARCHIVE_STATS.total, " equipos en el archivo"] })] })] }), _jsx("div", { className: "arcade-top__row", children: MISSIONS.map((mission, i) => (_jsx("div", { className: "arcade-top__slot", style: { ['--delay']: `${i * 110}ms` }, children: _jsx(GameTile, { mission: mission, progress: progress, variant: "featured", onPlay: () => onPlay(mission) }) }, mission.gameId))) })] })] }), _jsx(Mosaic, { progress: progress, reducedMotion: progress.settings.reducedMotion, onPlay: onPlay, onItem: onItem }), _jsx(SiteFooter, {})] }));
}
