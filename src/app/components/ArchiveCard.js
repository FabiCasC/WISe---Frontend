import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PLACE_COLORS, PLACE_LABEL, STATUS_LABEL, } from '../../content/archive';
import { MISSIONS } from '../../content/missions';
import { IconPlay } from './Art';
import Modal from './Modal';
import TileIcon from './TileIcon';
/** Si la ficha del archivo tiene juego, lo ofrece. Si no, lo dice claramente. */
function linkedMission(item) {
    const n = item.name.toLowerCase();
    if (n.includes('opportunity'))
        return MISSIONS.find((m) => m.gameId === 'opportunity');
    if (n.includes('spirit'))
        return MISSIONS.find((m) => m.gameId === 'spirit');
    if (n.includes('apollo 15'))
        return MISSIONS.find((m) => m.gameId === 'lunar-signals');
    return undefined;
}
export default function ArchiveCard({ item, onClose, onPlay, }) {
    const [from, to] = PLACE_COLORS[item.place];
    const mission = linkedMission(item);
    return (_jsxs(Modal, { title: item.name, subtitle: `${PLACE_LABEL[item.place]} · ${item.year} · ${STATUS_LABEL[item.status]}`, onClose: onClose, footer: mission ? (_jsxs("div", { style: { display: 'flex', gap: 10, flexWrap: 'wrap' }, children: [_jsxs("button", { type: "button", className: "btn btn--primary", onClick: () => onPlay(mission), children: [_jsx(IconPlay, {}), "Jugar \u00AB", mission.title, "\u00BB"] }), _jsx("button", { type: "button", className: "btn btn--quiet", onClick: onClose, children: "Seguir explorando" })] })) : (_jsx("button", { type: "button", className: "btn btn--quiet", onClick: onClose, children: "Seguir explorando" })), children: [_jsx("div", { className: "archive-hero", style: { background: `linear-gradient(155deg, ${from}, ${to})` }, children: _jsx(TileIcon, { kind: item.kind, size: 74 }) }), _jsxs("div", { className: "field", children: [_jsx("div", { className: "field__label", children: "Qu\u00E9 es" }), _jsx("div", { className: "field__value", children: item.note })] }), _jsxs("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }, children: [_jsxs("div", { className: "field", children: [_jsx("div", { className: "field__label", children: "D\u00F3nde est\u00E1" }), _jsx("div", { className: "field__value", children: PLACE_LABEL[item.place] })] }), _jsxs("div", { className: "field", children: [_jsx("div", { className: "field__label", children: "A\u00F1o" }), _jsx("div", { className: "field__value", children: item.year })] }), _jsxs("div", { className: "field", children: [_jsx("div", { className: "field__label", children: "Estado" }), _jsx("div", { className: "field__value", children: STATUS_LABEL[item.status] })] })] }), mission ? (_jsxs("div", { className: "field", style: { borderColor: 'rgba(109,226,242,.35)' }, children: [_jsx("div", { className: "field__label", children: "Tiene juego" }), _jsxs("div", { className: "field__value", children: ["Este equipo es protagonista de \u00AB", mission.title, "\u00BB. Su ficha cient\u00EDfica completa, con fuentes, est\u00E1 en la secci\u00F3n de misiones jugables."] })] })) : (_jsxs("div", { className: "field field--warn", children: [_jsx("div", { className: "field__label", children: "Ficha breve" }), _jsx("div", { className: "field__value", children: "Entrada del archivo, todav\u00EDa sin juego ni ficha cient\u00EDfica completa. Los datos est\u00E1n pendientes de contraste con fuente oficial antes de la entrega." })] }))] }));
}
