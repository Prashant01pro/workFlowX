'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState, Suspense } from 'react'
import { ArrowUpRight, ChevronRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api-client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, isAuthenticated, isLoading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [emailError, setEmailError] = useState('')

  // If already authenticated, redirect to returnTo destination or /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const returnTo = searchParams.get('returnTo')
      const target = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard'
      router.replace(target)
    }
  }, [isLoading, isAuthenticated, user, router, searchParams])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    setEmailError(!email ? 'Enter your email address.' : !validEmail ? 'Enter a valid email address.' : '')
    setFormError('')
    if (!email || !validEmail || !password) {
      if (!password) setFormError('Enter your password to continue.')
      return
    }

    setLoading(true)
    try {
      await login({ email, password })
      const returnTo = searchParams.get('returnTo')
      const destination = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard'
      router.push(destination)
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('Invalid email or password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand" aria-labelledby="brand-heading">
        <header className="auth-header">
          <Link className="wordmark" href="/">WorkFlow<span>X</span></Link>
          <Link className="auth-back" href="/"><ChevronRight size={13} /> Back to site</Link>
        </header>
        <div className="auth-brand-content">
          <p className="eyebrow">YOUR WORKSPACE, RECONSIDERED</p>
          <h1 id="brand-heading">Your work,<br /><em>right where</em><br />you left it.</h1>
          <p>Sign in to return to your projects, tasks, notes, and personal workspace.</p>
          <div className="auth-grid-preview" aria-hidden="true">
            <div className="auth-grid-sidebar"><span>WX</span><i /><i /><i /><i /></div>
            <div className="auth-grid-main"><span className="grid-kicker">MONDAY, OCTOBER 24</span><strong>Good morning, Alex.</strong><div className="grid-cards"><i /><i /><i /></div><div className="grid-lines"><i /><i /><i /><i /></div></div>
          </div>
        </div>
        <div className="auth-brand-foot"><span>01</span><span>Everything in focus.</span></div>
      </section>

      <section className="auth-form-panel" aria-labelledby="login-heading">
        <div className="auth-form-wrap">
          <div className="mobile-auth-mark"><Link className="wordmark" href="/">WorkFlow<span>X</span></Link></div>
          <p className="eyebrow">ACCOUNT ACCESS</p>
          <h2 id="login-heading">Welcome back.</h2>
          <p className="auth-intro">Sign in to your WorkFlowX account.</p>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                onChange={() => emailError && setEmailError('')}
                disabled={loading}
              />
              {emailError && <p className="field-error" id="email-error" role="alert">{emailError}</p>}
            </div>
            <div className="field-group">
              <div className="field-label-row">
                <label htmlFor="password">Password</label>
                <Link href="/forgot-password">Forgot password?</Link>
              </div>
              <div className="password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-describedby={formError ? 'form-error' : undefined}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {formError && <p className="form-error" id="form-error" role="alert"><LockKeyhole size={15} />{formError}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowUpRight size={16} />}
            </button>
          </form>
          <p className="auth-register">
            New to WorkFlowX? <Link href="/register">Create an account <ArrowUpRight size={13} /></Link>
          </p>
        </div>
        <footer className="auth-footer"><span>© 2026 WorkFlowX</span><span>Private by design.</span></footer>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>}>
      <LoginContent />
    </Suspense>
  )
}
