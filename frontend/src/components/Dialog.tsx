import { useEffect, type ReactNode } from 'react'
import { Portal } from '../layout/shell'
import { IconButton } from './ui'

type DialogProps = {
  title: string | null
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  /** full: whole-screen (search); media: centred video; center: small centred card */
  variant?: 'full' | 'media'
  className?: string
  noClose?: boolean
  /** Can't be dismissed by the scrim or Escape (e.g. hold expired, payment processing). */
  locked?: boolean
}

/** Bottom sheet under 768px of app width, centred modal above (the design's container query decides). */
export function Dialog({ title, subtitle, children, footer, onClose, variant, className, noClose, locked }: DialogProps) {
  useEffect(() => {
    if (locked) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, locked])

  return (
    <Portal to="overlay">
      <div className={`g-layer${variant ? ' g-layer--' + variant : ''}`}>
        <div className="g-scrim" onClick={locked ? undefined : onClose} />
        <div className={`g-dialog${variant ? ' g-dialog--' + variant : ''}${className ? ' ' + className : ''}`} role="dialog" aria-modal="true" aria-label={title ?? undefined}>
          {variant ? null : <span className="g-dialog__grab" aria-hidden="true" />}
          {title !== null ? (
            <div className="g-dialog__head">
              <div>
                <h2 className="g-dialog__title">{title}</h2>
                {subtitle ? <p className="g-dialog__sub">{subtitle}</p> : null}
              </div>
              {noClose || locked ? null : <IconButton icon="x" label="Close" variant="soft" onClick={onClose} />}
            </div>
          ) : null}
          <div className="g-dialog__body">{children}</div>
          {footer ? <div className="g-dialog__foot">{footer}</div> : null}
        </div>
      </div>
    </Portal>
  )
}
