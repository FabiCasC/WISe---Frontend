import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';
import './styles/app.css';
const host = document.getElementById('root');
if (!host) {
    throw new Error('No se encontró #root en index.html');
}
createRoot(host).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
