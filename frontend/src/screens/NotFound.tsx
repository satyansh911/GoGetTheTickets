import { useNavigate } from 'react-router'
import { Mark } from '../components/Svg'
import { Button, EmptyState } from '../components/ui'
import { BackBar, useTitle } from '../layout/shell'

export function NotFound() {
  useTitle('Page not found')
  const navigate = useNavigate()
  return (
    <>
      <BackBar title="Page not found" onBack={() => navigate('/')} />
      <div className="g-wrap g-narrow g-404">
        <div className="g-404__num" aria-hidden="true">4<span><Mark size={96} /></span>4</div>
        <EmptyState icon="film" title="This screen doesn't exist" text="The page you were looking for has left the building — like a show after the credits roll."
          actions={<><Button label="Back to home" icon="home" onClick={() => navigate('/')} /><Button label="Browse movies" variant="outline" onClick={() => navigate('/movies')} /></>} />
      </div>
    </>
  )
}
