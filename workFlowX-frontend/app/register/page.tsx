'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { ArrowUpRight, Check, ChevronRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { ApiError } from '@/lib/api-client'

export default function RegisterPage() {
  const router = useRouter()
  const { register, user, isAuthenticated, isLoading } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace('/dashboard')
    }
  }, [isLoading, isAuthenticated, user, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const confirmPassword = String(form.get('confirmPassword') || '')
    const accepted = form.get('terms') === 'on'
    const nextErrors: Record<string, string> = {}
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    if (!name) nextErrors.name = 'Enter your full name.'
    if (!email) nextErrors.email = 'Enter your email address.'
    else if (!validEmail) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Create a password.'
    else if (password.length < 10) nextErrors.password = 'Use at least 10 characters.'
    if (!confirmPassword) nextErrors.confirmPassword = 'Confirm your password.'
    else if (password !== confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (!accepted) nextErrors.terms = 'Accept the terms to create your account.'

    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await register({ name, email, password })
      router.push('/dashboard')
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('Account registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-brand" aria-labelledby="register-brand-heading">
        <header className="auth-header">
          <Link className="wordmark" href="/">WorkFlow<span>X</span></Link>
          <Link className="auth-back" href="/"><ChevronRight size={13} /> Back to site</Link>
        </header>
        <div className="auth-brand-content">
          <p className="eyebrow">A CLEARER PLACE TO BEGIN</p>
          <h1 id="register-brand-heading">Make space<br />for <em>focused work.</em></h1>
          <p>Bring your projects, tasks, notes, and finances together in one organized workspace.</p>
          <div className="register-principles" aria-label="WorkFlowX principles">
            <div><span>01</span><strong>One considered workspace</strong><small>Everything connected, never crowded.</small></div>
            <div><span>02</span><strong>A calmer daily rhythm</strong><small>Know what matters next.</small></div>
            <div><span>03</span><strong>Your work, in focus</strong><small>Built around your attention.</small></div>
          </div>
        </div>
        <div className="auth-brand-foot"><span>02</span><span>Begin with clarity.</span></div>
      </section>

      <section className="auth-form-panel" aria-labelledby="register-heading">
        <div className="auth-form-wrap register-form-wrap">
          <div className="mobile-auth-mark"><Link className="wordmark" href="/">WorkFlow<span>X</span></Link></div>
          <p className="eyebrow">CREATE YOUR WORKSPACE</p>
          <h2 id="register-heading">Create your account.</h2>
          <p className="auth-intro">Start organizing your work with WorkFlowX.</p>
          <form className="login-form register-form" onSubmit={handleSubmit} noValidate>
            <div className="field-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
                disabled={loading}
              />
              {errors.name && <p className="field-error" id="name-error" role="alert">{errors.name}</p>}
            </div>
            <div className="field-group">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
                disabled={loading}
              />
              {errors.email && <p className="field-error" id="register-email-error" role="alert">{errors.email}</p>}
            </div>
            <div className="field-group">
              <label htmlFor="register-password">Password</label>
              <div className="password-wrap">
                <input
                  id="register-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 10 characters"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="password-guidance"
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
              <p className="field-guidance" id="password-guidance">Use at least 10 characters.</p>
              {errors.password && <p className="field-error" role="alert">{errors.password}</p>}
            </div>
            <div className="field-group">
              <label htmlFor="confirm-password">Confirm password</label>
              <div className="password-wrap">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="field-error" role="alert">{errors.confirmPassword}</p>}
            </div>
            <label className="terms-check">
              <input type="checkbox" name="terms" aria-invalid={Boolean(errors.terms)} disabled={loading} />
              <span className="check-box"><Check size={12} /></span>
              <span>I agree to the Terms of Service and Privacy Policy.</span>
            </label>
            {errors.terms && <p className="field-error terms-error" role="alert">{errors.terms}</p>}
            {formError && <p className="form-error" role="alert"><LockKeyhole size={15} />{formError}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && <ArrowUpRight size={16} />}
            </button>
          </form>
          <p className="auth-register">
            Already have an account? <Link href="/login">Sign in <ArrowUpRight size={13} /></Link>
          </p>
        </div>
        <footer className="auth-footer"><span>© 2026 WorkFlowX</span><span>Private by design.</span></footer>
      </section>
    </main>
  )
}
