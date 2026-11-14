import { useEffect, useState } from 'react'
import type { GameId, LevelId } from '../../shared/types'
import { GAME_IDS } from '../../shared/progress'

/**
 * Enrutado por hash: recargar una URL profunda nunca da 404 en hosting
 * estático. Lo pide el plan (capa "Publicación").
 *
 *   #/                       -> portada
 *   #/arcade                 -> arcade: juegos destacados + archivo
 *   #/jugar/spirit/2         -> partida (se superpone a la página actual)
 *   #/profesor               -> crear una clase
 *   #/clase  o  #/clase/LUNA-27 -> entrar a una clase (con el código ya puesto)
 *   #/panel/<token>          -> panel privado del profesor
 *
 * Convención: **una ruta siempre empieza por `#/`**. Cualquier otro hash
 * (`#equipo`, `#archivo`) es un ancla dentro de la página actual y NO debe
 * cambiar de página; por eso `parse` devuelve null en ese caso.
 */
export type Route =
  | { name: 'landing' }
  | { name: 'arcade' }
  | { name: 'play'; gameId: GameId; levelId: LevelId }
  | { name: 'teacher' }
  | { name: 'join'; code: string | null }
  | { name: 'panel'; token: string }

/** Páginas de fondo (todo menos la partida, que se superpone). */
export type PageRoute = Exclude<Route, { name: 'play' }>

function parse(hash: string): Route | null {
  if (hash === '' || hash === '#' || hash === '#/') return { name: 'landing' }

  // Ancla suelta: no es una ruta.
  if (!hash.startsWith('#/')) return null

  const parts = hash.slice(2).split('/').filter(Boolean)

  if (parts[0] === 'arcade') return { name: 'arcade' }
  if (parts[0] === 'profesor') return { name: 'teacher' }
  if (parts[0] === 'clase') return { name: 'join', code: parts[1] ? decodeURIComponent(parts[1]) : null }
  if (parts[0] === 'panel' && parts[1]) return { name: 'panel', token: parts[1] }

  if (parts[0] === 'jugar') {
    const gameId = parts[1] as GameId
    const level = Number(parts[2] ?? 1)
    if (GAME_IDS.includes(gameId) && [1, 2, 3].includes(level)) {
      return { name: 'play', gameId, levelId: level as LevelId }
    }
  }

  return { name: 'landing' }
}

export function navigate(to: string): void {
  if (window.location.hash === to) return
  window.location.hash = to
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(
    () => parse(window.location.hash) ?? { name: 'landing' },
  )

  useEffect(() => {
    const onChange = () => {
      const next = parse(window.location.hash)
      // null = ancla dentro de la página: se queda donde está.
      if (next) setRoute(next)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

/**
 * Al cambiar de página hay que volver arriba — salvo que la URL traiga un
 * ancla, en cuyo caso se va a esa sección. Moverse entre anclas de la misma
 * página no dispara esto: lo resuelve el navegador.
 */
export function useScrollReset(key: string): void {
  useEffect(() => {
    // Sirve tanto para un ancla suelta (#pasaporte) como para una ruta que
    // apunta a una sección de otra página (#/pasaporte): tras quitar el
    // prefijo, ambas dejan el mismo id.
    const target = window.location.hash.replace(/^#\/?/, '')
    const el = target ? document.getElementById(decodeURIComponent(target)) : null

    if (el) {
      // Un frame de margen: la sección acaba de montarse.
      requestAnimationFrame(() => el.scrollIntoView())
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [key])
}
