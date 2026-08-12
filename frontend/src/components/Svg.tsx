import G from '../lib/design/ggt-core.js'
import type { ArtMovie } from '../lib/design/ggt-core.js'
import type { Movie } from '../lib/types'

// The design's builders return SVG markup generated from our own data (titles are escaped by
// the builders), so injecting it is safe.

type RawProps = { html: string; className?: string; as?: 'span' | 'div' }

/** Renders a design-system SVG string. `display: contents` keeps the wrapper out of layout. */
export function Raw({ html, className, as = 'span' }: RawProps) {
  const Tag = as
  return <Tag className={className} style={className ? undefined : { display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A real <svg> element (not wrapped), so the design's `.parent > .g-ic` selectors apply. */
export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const html = G.icon(name, size)
  const inner = html.slice(html.indexOf('>') + 1, html.lastIndexOf('</svg>'))
  return (
    <svg className={`g-ic${className ? ' ' + className : ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: inner }} />
  )
}

function artMovie(m: Movie): ArtMovie {
  return { id: m.id, title: m.title, palette: m.art.palette, motif: m.art.motif, kicker: m.art.kicker, posterLines: m.art.posterLines }
}

/** Poster image if the movie has one, otherwise the design's generated poster art. */
export function PosterArt({ movie, noText }: { movie: Movie; noText?: boolean }) {
  if (movie.posterUrl) return <img className="g-art" src={movie.posterUrl} alt={`${movie.title} poster`} style={{ objectFit: 'cover' }} />
  return <Raw html={G.posterSvg(artMovie(movie), { noText })} />
}

export function BackdropArt({ movie }: { movie: Movie }) {
  if (movie.backdropUrl) return <img className="g-art" src={movie.backdropUrl} alt="" style={{ objectFit: 'cover' }} />
  return <Raw html={G.backdropSvg(artMovie(movie))} />
}

export function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) return <img className="g-art" src={photoUrl} alt="" style={{ objectFit: 'cover' }} />
  return <Raw html={G.avatarSvg(name)} />
}

export const Logo = ({ size }: { size?: number }) => <Raw html={G.logo({ size })} />
export const Mark = ({ size }: { size?: number }) => <Raw html={G.mark(size)} />
export const FoodArt = ({ kind }: { kind: string }) => <Raw html={G.foodSvg(kind)} />
export const CityGlyph = ({ kind, size }: { kind: string; size?: number }) => <Raw html={G.cityIcon(kind, size)} />
export const CountArt = ({ n }: { n: number }) => <Raw html={G.countSvg(n)} />
export const Qr = ({ text, size }: { text: string; size?: number }) => <Raw html={G.qrSvg(text, size)} />
export const ScreenCurve = () => <Raw html={G.screenSvg()} />
export const countLabel = (n: number) => G.countLabel(n)
