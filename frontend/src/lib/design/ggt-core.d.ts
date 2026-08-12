/** Types for the vendored design-system core. Every builder returns an SVG/HTML string. */
export interface ArtMovie {
  id: string
  title: string
  palette: { a: string; b: string; c: string }
  motif: string
  kicker?: string
  posterLines?: string[]
}

declare const G: {
  esc(s: unknown): string
  icon(name: string, size?: number, cls?: string): string
  iconNames: string[]
  mark(size?: number): string
  logo(opts?: { size?: number; compact?: boolean }): string
  posterSvg(m: ArtMovie, opts?: { noText?: boolean; titleSize?: number }): string
  backdropSvg(m: ArtMovie): string
  avatarSvg(name: string, tint?: string): string
  foodSvg(kind: string): string
  cityIcon(kind: string, size?: number): string
  countLabel(n: number): string
  countSvg(n: number): string
  qrSvg(text: string, size?: number): string
  screenSvg(): string
}

export default G
