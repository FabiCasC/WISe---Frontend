/**
 * CONTRATO DE INTEGRACION - Orbita Arcade
 * -------------------------------------------------------------------------
 * Este archivo es el unico punto de acuerdo entre el portal (shell) y los
 * tres modulos de juego. Nadie lo modifica sin avisar al integrador (Kevin).
 *
 * Regla de oro del plan: las tres parejas implementan `mountGame` con esta
 * firma ANTES de anadir efectos, arte o sonido.
 */
// ---------------------------------------------------------------------------
// Progreso persistido
// ---------------------------------------------------------------------------
export const PROGRESS_SCHEMA_VERSION = 1;
