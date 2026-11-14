import { PROGRESS_SCHEMA_VERSION, } from './types';
const STORAGE_KEY = 'orbita-arcade:progress';
export const DEFAULT_SETTINGS = {
    volume: 0.6,
    reducedMotion: false,
    practice: false,
    lang: 'es',
};
export const GAME_IDS = ['opportunity', 'lunar-signals', 'spirit'];
export function createEmptyProgress() {
    return {
        schemaVersion: PROGRESS_SCHEMA_VERSION,
        games: {
            opportunity: { levelsCompleted: [], bestScore: {} },
            'lunar-signals': { levelsCompleted: [], bestScore: {} },
            spirit: { levelsCompleted: [], bestScore: {} },
        },
        memories: [],
        evidence: [],
        settings: { ...DEFAULT_SETTINGS },
        updatedAt: new Date().toISOString(),
    };
}
/**
 * Lectura defensiva: si el JSON esta corrupto, el schema cambio o el
 * almacenamiento esta bloqueado (modo privado de Safari), se vuelve a un
 * progreso vacio. Nunca lanza: jugar debe seguir siendo posible.
 */
export function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return createEmptyProgress();
        const parsed = JSON.parse(raw);
        if (parsed?.schemaVersion !== PROGRESS_SCHEMA_VERSION)
            return createEmptyProgress();
        const base = createEmptyProgress();
        return {
            ...base,
            ...parsed,
            games: { ...base.games, ...(parsed.games ?? {}) },
            memories: Array.isArray(parsed.memories) ? parsed.memories : [],
            evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
            settings: { ...base.settings, ...(parsed.settings ?? {}) },
        };
    }
    catch {
        return createEmptyProgress();
    }
}
/** Un guardado fallido jamas debe impedir jugar: devuelve false y sigue. */
export function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...progress, updatedAt: new Date().toISOString() }));
        return true;
    }
    catch {
        return false;
    }
}
export function resetProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch {
        /* almacenamiento bloqueado: seguimos en memoria */
    }
    return createEmptyProgress();
}
/** Aplica un GameResult al progreso. Funcion pura: facil de probar con Vitest. */
export function applyResult(progress, result) {
    const game = progress.games[result.gameId];
    if (!game)
        return progress;
    const levelsCompleted = result.completed
        ? Array.from(new Set([...game.levelsCompleted, result.levelId])).sort()
        : game.levelsCompleted;
    const previousBest = game.bestScore[result.levelId] ?? 0;
    const bestScore = result.completed
        ? { ...game.bestScore, [result.levelId]: Math.max(previousBest, result.score) }
        : game.bestScore;
    const memories = result.completed && !progress.memories.includes(result.gameId)
        ? [...progress.memories, result.gameId]
        : progress.memories;
    const evidence = Array.from(new Set([...progress.evidence, ...result.evidenceIds]));
    return {
        ...progress,
        games: { ...progress.games, [result.gameId]: { levelsCompleted, bestScore } },
        memories,
        evidence,
    };
}
export function totalScore(progress) {
    return GAME_IDS.reduce((sum, id) => {
        const scores = Object.values(progress.games[id]?.bestScore ?? {});
        return sum + scores.reduce((a, b) => a + (b ?? 0), 0);
    }, 0);
}
export function completedLevels(progress, gameId) {
    return progress.games[gameId]?.levelsCompleted.length ?? 0;
}
