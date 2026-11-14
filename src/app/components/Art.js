import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* =========================================================================
   Logotipo
   ========================================================================= */
export function BrandGlyph({ className = 'brandmark__glyph' }) {
    return (_jsxs("svg", { className: className, viewBox: "0 0 64 64", role: "img", "aria-label": "\u00D3rbita Arcade", children: [_jsx("defs", { children: _jsxs("radialGradient", { id: "bg-core", cx: "38%", cy: "32%", children: [_jsx("stop", { offset: "0", stopColor: "#ffffff" }), _jsx("stop", { offset: "0.45", stopColor: "#6DE2F2" }), _jsx("stop", { offset: "1", stopColor: "#1C6E86" })] }) }), _jsx("rect", { width: "64", height: "64", rx: "15", fill: "#0A1A30" }), _jsx("rect", { width: "64", height: "64", rx: "15", fill: "none", stroke: "rgba(109,226,242,.35)" }), _jsx("ellipse", { cx: "32", cy: "32", rx: "26", ry: "9.5", fill: "none", stroke: "#E68A68", strokeWidth: "2.4", opacity: "0.9", transform: "rotate(-24 32 32)" }), _jsx("circle", { cx: "32", cy: "32", r: "11.5", fill: "url(#bg-core)" }), _jsx("circle", { cx: "28", cy: "28", r: "3", fill: "#ffffff", opacity: "0.65" }), _jsx("circle", { cx: "53", cy: "18.5", r: "3.1", fill: "#E68A68" })] }));
}
const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
};
export function IconPlay({ size = 20 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M8 5.5v13l11-6.5z", fill: "currentColor" }) }));
}
export function IconInfo({ size = 18 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "9", ...stroke }), _jsx("path", { d: "M12 11v5M12 7.6v.2", ...stroke })] }));
}
export function IconGear({ size = 20 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "3.2", ...stroke }), _jsx("path", { d: "M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6", ...stroke })] }));
}
export function IconClose({ size = 20 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "m6 6 12 12M18 6 6 18", ...stroke }) }));
}
export function IconBack({ size = 20 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M15 5 8 12l7 7", ...stroke }) }));
}
export function IconPause({ size = 18 }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M9 5v14M15 5v14", ...stroke }) }));
}
export function IconStamp({ size = 18 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M12 4a3 3 0 0 0-3 3c0 1.7 1 2.2 1 4H14c0-1.8 1-2.3 1-4a3 3 0 0 0-3-3Z", ...stroke }), _jsx("path", { d: "M5 15h14v2H5zM6.5 19h11", ...stroke })] }));
}
export function IconLink({ size = 15 }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("path", { d: "M14 5h5v5M19 5l-8 8", ...stroke }), _jsx("path", { d: "M18 14v4a1.8 1.8 0 0 1-1.8 1.8H6A1.8 1.8 0 0 1 4.2 18V7.8A1.8 1.8 0 0 1 6 6h4", ...stroke })] }));
}
/* =========================================================================
   Protagonistas, dibujados en SVG
   ========================================================================= */
/**
 * Rover de seis ruedas con panel solar, mástil y brazo.
 * `stuck` dibuja la variante de Spirit: inclinado, con la rueda delantera
 * derecha trabada y la huella que dejó al arrastrarla.
 */
function Rover({ accent, stuck = false }) {
    return (_jsxs("svg", { viewBox: "0 0 200 130", className: "rover", "aria-hidden": "true", width: "100%", style: stuck ? { transform: 'rotate(-6deg)' } : undefined, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: `panel-${accent.slice(1)}`, x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "0", stopColor: "#1b3a66" }), _jsx("stop", { offset: "1", stopColor: "#0a1c33" })] }) }), _jsx("ellipse", { cx: "100", cy: "122", rx: "62", ry: "6", fill: "rgba(0,0,0,.35)" }), _jsx("path", { d: "M28 58h144l-10 14H38z", fill: `url(#panel-${accent.slice(1)})`, stroke: "#8FB7E0", strokeWidth: "1.2" }), _jsx("path", { d: "M40 61h120M44 66h112", stroke: "#6DE2F2", strokeWidth: "0.9", opacity: "0.6" }), _jsx("rect", { x: "66", y: "72", width: "68", height: "26", rx: "5", fill: "#D8DEE9", stroke: "#7D8794", strokeWidth: "1.4" }), _jsx("rect", { x: "72", y: "78", width: "22", height: "12", rx: "2.5", fill: "#0C2038", stroke: accent, strokeWidth: "1.2" }), _jsx("rect", { x: "100", y: "78", width: "12", height: "5", rx: "1.5", fill: accent }), _jsx("path", { d: "M100 58V38", stroke: "#AEB8C6", strokeWidth: "3.4", strokeLinecap: "round" }), _jsx("rect", { x: "84", y: "24", width: "33", height: "15", rx: "4", fill: "#C8CEDA", stroke: "#7D8794", strokeWidth: "1.3" }), _jsx("circle", { cx: "93", cy: "31.5", r: "4", fill: "#0C2038", stroke: accent, strokeWidth: "1.3" }), _jsx("circle", { cx: "108", cy: "31.5", r: "4", fill: "#0C2038", stroke: accent, strokeWidth: "1.3" }), _jsx("circle", { cx: "93", cy: "31.5", r: "1.4", fill: accent }), _jsx("circle", { cx: "108", cy: "31.5", r: "1.4", fill: accent }), _jsx("path", { d: "M66 86 48 96l-7 9", stroke: "#AEB8C6", strokeWidth: "3", fill: "none", strokeLinecap: "round" }), _jsx("circle", { cx: "40", cy: "106", r: "4.6", fill: "#0C2038", stroke: accent, strokeWidth: "1.6" }), _jsx("path", { d: "M72 98 56 108M100 98v10M128 98l16 10", stroke: "#8C96A4", strokeWidth: "3", strokeLinecap: "round" }), [54, 100, 146].map((cx) => {
                // En la variante de Spirit la rueda delantera no gira: se dibuja
                // hundida en el suelo y sin radios visibles.
                const jammed = stuck && cx === 146;
                return (_jsxs("g", { transform: jammed ? 'translate(0 5)' : undefined, children: [_jsx("circle", { cx: cx, cy: "112", r: "10", fill: "#2A3242", stroke: jammed ? accent : '#AEB8C6', strokeWidth: "2", strokeDasharray: jammed ? '4 3' : undefined }), _jsx("circle", { cx: cx, cy: "112", r: "3.4", fill: jammed ? accent : '#AEB8C6' })] }, cx));
            }), stuck && (_jsx("path", { d: "M150 122h44", stroke: "#F4E7D2", strokeWidth: "7", strokeLinecap: "round", opacity: "0.85" }))] }));
}
/** Estación lunar: sismómetro con antena + panel retrorreflector. */
function LunarStation({ accent }) {
    return (_jsxs("svg", { viewBox: "0 0 200 130", "aria-hidden": "true", width: "100%", children: [_jsx("ellipse", { cx: "100", cy: "122", rx: "66", ry: "6", fill: "rgba(0,0,0,.45)" }), _jsx("path", { d: "M150 20 134 92", stroke: "#6DE2F2", strokeWidth: "2", opacity: "0.85", strokeDasharray: "5 5", children: _jsx("animate", { attributeName: "stroke-dashoffset", from: "20", to: "0", dur: "1.1s", repeatCount: "indefinite" }) }), _jsx("path", { d: "M158 20 142 92", stroke: "#9BF6FF", strokeWidth: "1.2", opacity: "0.5" }), _jsxs("g", { transform: "translate(118 90) skewX(-12)", children: [_jsx("rect", { x: "0", y: "0", width: "46", height: "26", rx: "3", fill: "#101F36", stroke: "#C8CEDA", strokeWidth: "1.5" }), [0, 1, 2, 3, 4].map((i) => [0, 1, 2].map((j) => (_jsx("circle", { cx: 6 + i * 9, cy: 6 + j * 8, r: "3", fill: "#6DE2F2", opacity: 0.35 + ((i + j) % 3) * 0.22 }, `${i}-${j}`))))] }), _jsx("path", { d: "M36 116h56l-7-24H43z", fill: "#D8DEE9", stroke: "#7D8794", strokeWidth: "1.4" }), _jsx("rect", { x: "48", y: "66", width: "30", height: "28", rx: "4", fill: "#C8CEDA", stroke: "#7D8794", strokeWidth: "1.4" }), _jsx("rect", { x: "54", y: "72", width: "18", height: "9", rx: "2", fill: "#0C2038", stroke: accent, strokeWidth: "1.2" }), _jsx("path", { d: "M63 66V44", stroke: "#AEB8C6", strokeWidth: "3", strokeLinecap: "round" }), _jsx("path", { d: "M50 44a13 13 0 0 1 26 0", fill: "none", stroke: "#AEB8C6", strokeWidth: "2.6" }), _jsx("circle", { cx: "63", cy: "40", r: "3.2", fill: accent, children: _jsx("animate", { attributeName: "opacity", values: "1;0.25;1", dur: "2.4s", repeatCount: "indefinite" }) }), _jsx("path", { d: "M20 104q8-9 16 0t16 0", fill: "none", stroke: accent, strokeWidth: "1.8", opacity: "0.7", children: _jsx("animate", { attributeName: "opacity", values: "0.15;0.8;0.15", dur: "2.8s", repeatCount: "indefinite" }) })] }));
}
/**
 * Escena de respaldo de cada portal. Es 100 % CSS+SVG: el portal se ve
 * terminado aunque no exista todavía ninguna ilustración.
 */
export function MissionScene({ gameId, accent }) {
    const isMoon = gameId === 'lunar-signals';
    const isSpirit = gameId === 'spirit';
    const variant = isMoon ? 'scene--luna' : isSpirit ? 'scene--spirit' : 'scene--marte';
    return (_jsxs("div", { className: `scene ${variant}`, "aria-hidden": "true", children: [_jsx("span", { className: "scene__sky" }), isMoon && _jsx("span", { className: "scene__starfield" }), _jsx("span", { className: "scene__sun" }), isMoon && _jsx("span", { className: "scene__earth" }), _jsx("span", { className: "scene__ground" }), isSpirit && _jsx("span", { className: "scene__silica" }), _jsx("span", { className: "scene__dust" }), _jsx("div", { className: "scene__subject", children: isMoon ? _jsx(LunarStation, { accent: accent }) : _jsx(Rover, { accent: accent, stuck: isSpirit }) }), _jsx("span", { className: "scene__scan" })] }));
}
