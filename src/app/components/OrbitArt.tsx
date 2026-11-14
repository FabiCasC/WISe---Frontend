/**
 * Ilustración de la portada: un planeta con dos órbitas, un rover y un
 * satélite girando. Decorativa (aria-hidden). Con movimiento reducido las
 * animaciones se detienen gracias a --motion y a las reglas de tokens.css.
 */
export default function OrbitArt() {
  return (
    <div className="orbit" aria-hidden="true">
      <span className="orbit__glow" />
      <span className="orbit__ring orbit__ring--a">
        <span className="orbit__sat orbit__sat--a" />
      </span>
      <span className="orbit__ring orbit__ring--b">
        <span className="orbit__sat orbit__sat--b" />
      </span>
      <span className="orbit__planet">
        <span className="orbit__crater orbit__crater--1" />
        <span className="orbit__crater orbit__crater--2" />
        <span className="orbit__crater orbit__crater--3" />
      </span>
      <span className="orbit__moon" />
      <span className="orbit__spark orbit__spark--1" />
      <span className="orbit__spark orbit__spark--2" />
      <span className="orbit__spark orbit__spark--3" />
      <span className="orbit__spark orbit__spark--4" />
    </div>
  )
}
