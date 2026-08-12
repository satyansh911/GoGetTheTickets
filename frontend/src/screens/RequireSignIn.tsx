import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState } from '../components/ui'
import { BackBar } from '../layout/shell'
import { useAuth } from '../state/auth'
import { useUi } from '../state/ui'

/** Pages about a specific booking need the owner signed in. */
export function RequireSignIn({ title, children }: { title: string; children: ReactNode }) {
  const { user, checking } = useAuth()
  const ui = useUi()
  const navigate = useNavigate()
  if (checking) return null
  if (user) return <>{children}</>
  return (
    <>
      <BackBar title={title} onBack={() => navigate('/')} />
      <div className="g-wrap g-narrow">
        <EmptyState icon="user" tone="accent" title="Sign in to continue" text="This page belongs to your account. Sign in to see it."
          actions={<Button label="Sign in" onClick={() => ui.openAuth()} />} />
      </div>
    </>
  )
}
