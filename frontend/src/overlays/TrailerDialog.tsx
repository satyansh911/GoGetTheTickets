import { useEffect, useState } from 'react'
import { Portal } from '../layout/shell'
import { BackdropArt, Icon } from '../components/Svg'
import { IconButton } from '../components/ui'
import type { Movie } from '../lib/types'

/** Plays the trailer when the movie has one; otherwise the design's preview player. */
export function TrailerDialog({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <Portal to="overlay">
      <div className="g-layer g-layer--media">
        <div className="g-scrim" onClick={onClose} />
        <div className="g-dialog g-dialog--media" role="dialog" aria-modal="true" aria-label={`${movie.title} trailer`}>
          <div className={`g-video${playing ? ' is-playing' : ''}`}>
            <div className="g-video__art">
              {movie.trailerUrl && playing
                ? <video src={movie.trailerUrl} autoPlay controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <BackdropArt movie={movie} />}
            </div>
            <div className="g-video__top"><span><b>{movie.title}</b> · Official trailer</span><IconButton icon="x" label="Close trailer" variant="hero" onClick={onClose} /></div>
            {playing ? null : <button type="button" className="g-video__play" aria-label="Play trailer" onClick={() => setPlaying(true)}><Icon name="play" size={34} /></button>}
            <div className="g-video__bar">
              <button type="button" className="g-video__btn" aria-label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(p => !p)}><Icon name={playing ? 'pause' : 'play'} size={20} /></button>
              <span className="g-video__time g-num">{playing ? '0:12' : '0:00'} / 2:34</span>
              <span className="g-video__track"><i /></span>
              <Icon name="volume" size={20} />
              <Icon name="maximize" size={20} />
            </div>
            {movie.trailerUrl ? null : <span className="g-video__demo">Trailer preview · demo</span>}
          </div>
        </div>
      </div>
    </Portal>
  )
}
