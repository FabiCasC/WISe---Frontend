import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useId, useRef } from 'react';
import { IconClose } from './Art';
const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
/**
 * Diálogo accesible: cierra con Escape, atrapa el foco, bloquea el scroll de
 * fondo y devuelve el foco al elemento que lo abrió.
 */
export default function Modal({ title, subtitle, onClose, children, footer }) {
    const ref = useRef(null);
    const titleId = useId();
    const opener = useRef(null);
    useEffect(() => {
        opener.current = document.activeElement;
        document.body.classList.add('is-locked');
        const node = ref.current;
        node?.querySelector(FOCUSABLE)?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !node)
                return;
            const items = Array.from(node.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
            if (items.length === 0)
                return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
            else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey, true);
        return () => {
            document.removeEventListener('keydown', onKey, true);
            document.body.classList.remove('is-locked');
            opener.current?.focus?.();
        };
    }, [onClose]);
    return (_jsx("div", { className: "overlay", onPointerDown: (e) => {
            if (e.target === e.currentTarget)
                onClose();
        }, children: _jsxs("div", { className: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId, ref: ref, children: [_jsxs("div", { className: "modal__head", children: [_jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsx("h2", { className: "modal__title", id: titleId, children: title }), subtitle && _jsx("p", { className: "modal__sub", children: subtitle })] }), _jsx("button", { type: "button", className: "btn btn--quiet btn--icon modal__close", onClick: onClose, "aria-label": "Cerrar", children: _jsx(IconClose, {}) })] }), _jsxs("div", { className: "modal__body", children: [children, footer] })] }) }));
}
