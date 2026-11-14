import { useCallback, useEffect, useMemo, useState } from 'react';
import { applyResult, loadProgress, resetProgress, saveProgress, } from '../../shared/progress';
export function useProgress() {
    const [progress, setProgress] = useState(() => loadProgress());
    const [storageOk, setStorageOk] = useState(true);
    // Persistir cada cambio. Un fallo no interrumpe la partida: solo se marca.
    useEffect(() => {
        const ok = saveProgress(progress);
        setStorageOk((prev) => (prev === ok ? prev : ok));
    }, [progress]);
    // Aplicar movimiento reducido al documento.
    useEffect(() => {
        document.documentElement.dataset.motion = progress.settings.reducedMotion
            ? 'reduced'
            : 'full';
    }, [progress.settings.reducedMotion]);
    // Idioma del documento, para lectores de pantalla.
    useEffect(() => {
        document.documentElement.lang = progress.settings.lang;
    }, [progress.settings.lang]);
    const record = useCallback((result) => {
        setProgress((prev) => applyResult(prev, result));
    }, []);
    const updateSettings = useCallback((patch) => {
        setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    }, []);
    const reset = useCallback(() => {
        setProgress(resetProgress());
    }, []);
    return useMemo(() => ({ progress, storageOk, record, updateSettings, reset }), [progress, storageOk, record, updateSettings, reset]);
}
