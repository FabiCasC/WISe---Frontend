import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { getMission } from '../content/missions';
import ArchiveCard from './components/ArchiveCard';
import Dossier from './components/Dossier';
import SettingsPanel from './components/SettingsPanel';
import Sky from './components/Sky';
import Topbar from './components/Topbar';
import GameHost from './GameHost';
import { navigate, useHashRoute, useScrollReset } from './hooks/useHashRoute';
import { useProgress } from './hooks/useProgress';
import Arcade from './pages/Arcade';
import Landing from './pages/Landing';
export default function App() {
    const route = useHashRoute();
    const { progress, storageOk, record, updateSettings, reset } = useProgress();
    const [dossierId, setDossierId] = useState(null);
    const [archiveItem, setArchiveItem] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [toast, setToast] = useState(null);
    /**
     * Mientras se juega, la página de fondo sigue siendo la que estaba. Así,
     * al salir de la partida se vuelve justo donde se estaba.
     */
    const [lastPage, setLastPage] = useState('landing');
    useEffect(() => {
        if (route.name === 'landing' || route.name === 'arcade')
            setLastPage(route.name);
    }, [route]);
    // Cambiar de página vuelve arriba; moverse por anclas no.
    useScrollReset(lastPage);
    // Aviso único si el navegador bloquea el guardado.
    useEffect(() => {
        if (!storageOk) {
            setToast('Este navegador bloquea el guardado local: podrás jugar, pero el progreso no se conservará.');
        }
    }, [storageOk]);
    useEffect(() => {
        if (!toast)
            return;
        const t = window.setTimeout(() => setToast(null), 6000);
        return () => window.clearTimeout(t);
    }, [toast]);
    /** Siguiente nivel sugerido: el primero sin completar. */
    const nextLevelOf = useCallback((gameId) => {
        const done = progress.games[gameId].levelsCompleted;
        return ([1, 2, 3].find((l) => !done.includes(l)) ?? 1);
    }, [progress]);
    const play = useCallback((mission) => {
        setDossierId(null);
        setArchiveItem(null);
        navigate(`#/jugar/${mission.gameId}/${nextLevelOf(mission.gameId)}`);
    }, [nextLevelOf]);
    const exitGame = useCallback(() => {
        navigate(lastPage === 'arcade' ? '#/arcade' : '#/');
    }, [lastPage]);
    const handleResult = useCallback((result) => {
        record(result);
        const mission = getMission(result.gameId);
        setToast(result.completed
            ? `Recuerdo sellado: ${mission?.title ?? result.gameId}. Ábrelo en el pasaporte.`
            : 'Partida cerrada sin completar. Puedes reintentar cuando quieras.');
        exitGame();
    }, [record, exitGame]);
    const dossierMission = dossierId ? getMission(dossierId) : undefined;
    return (_jsxs(_Fragment, { children: [_jsx(Sky, { reducedMotion: progress.settings.reducedMotion }), _jsx("a", { className: "skip-link", href: "#juegos", children: "Saltar al listado de juegos" }), _jsxs("div", { className: "shell", children: [_jsx(Topbar, { page: lastPage, progress: progress, onSettings: () => setSettingsOpen(true) }), lastPage === 'arcade' ? (_jsx(Arcade, { progress: progress, onPlay: play, onItem: setArchiveItem })) : (_jsx(Landing, { progress: progress, onPlay: play, onDossier: setDossierId }))] }), route.name === 'play' && (_jsx(GameHost, { gameId: route.gameId, levelId: route.levelId, settings: progress.settings, onResult: handleResult, onExit: exitGame })), dossierMission && (_jsx(Dossier, { mission: dossierMission, onClose: () => setDossierId(null), onPlay: () => play(dossierMission) })), archiveItem && (_jsx(ArchiveCard, { item: archiveItem, onClose: () => setArchiveItem(null), onPlay: play })), settingsOpen && (_jsx(SettingsPanel, { settings: progress.settings, storageOk: storageOk, onChange: updateSettings, onReset: () => {
                    reset();
                    setToast('Progreso reiniciado.');
                }, onClose: () => setSettingsOpen(false) })), toast && (_jsxs("div", { className: "toast", role: "status", children: [toast, _jsx("button", { type: "button", className: "btn btn--sm btn--quiet", onClick: () => setToast(null), "aria-label": "Cerrar aviso", children: "Cerrar" })] }))] }));
}
