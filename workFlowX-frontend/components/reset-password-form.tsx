'use client'

import Link from 'next/link'
import { ArrowUpRight, ChevronRight, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { api, ApiError } from '@/lib/api-client'

const passwordGuidance = 'Use at least 10 characters.'

export function ResetPasswordForm({ token }: { token?: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password') || '')
    const confirmation = String(form.get('confirmation') || '')
    setError('')

    const activeToken = token?.trim()
    if (!activeToken) {
      return setError('This reset link is missing or incomplete. Request a new link to continue.')
    }
    if (password.length < 10) {
      return setError('Use at least 10 characters.')
    }
    if (password !== confirmation) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    try {
      await api.post(`/api/v1/auth/reset-password/${encodeURIComponent(activeToken)}`, {
        newPassword: password,
      })
      setSuccess(true)
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message || 'Invalid or expired reset link. Please request a new link.')
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('Failed to reset password. Please try again or request a new link.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page recovery-page reset-page">
      <section className="auth-brand" aria-labelledby="reset-brand-heading">
        <header className="auth-header">
          <Link className="wordmark" href="/">WorkFlow<span>X</span></Link>
          <Link className="auth-back" href="/login"><ChevronRight size={13} /> Back to sign in</Link>
        </header>
        <div className="auth-brand-content">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="reset-brand-heading">A fresh<br /><em>start</em> for your<br />workspace.</h1>
          <p>Choose a new password and return to the work that matters.</p>
          <div className="recovery-mark" aria-hidden="true">
            <LockKeyhole size={27} />
            <span>SECURE ACCOUNT ACCESS</span>
          </div>
        </div>
        <div className="auth-brand-foot"><span>03</span><span>Everything in focus.</span></div>
      </section>

      <section className="auth-form-panel" aria-labelledby="reset-heading">
        <div className="auth-form-wrap recovery-form-wrap">
          <div className="mobile-auth-mark"><Link className="wordmark" href="/">WorkFlow<span>X</span></Link></div>
          {success ? (
            <div className="reset-success">
              <p className="eyebrow">ACCESS RESTORED</p>
              <h2 id="reset-heading">Password<br />updated.</h2>
              <p className="auth-intro">Your password has been changed successfully. You can now sign in using your new password.</p>
              <Link className="auth-submit" href="/login">Continue to sign in <ArrowUpRight size={15} /></Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">NEW PASSWORD</p>
              <h2 id="reset-heading">Reset your<br />password.</h2>
              <p className="auth-intro">Choose a new password to get back to your workspace.</p>
              <form className="login-form recovery-form reset-form" onSubmit={handleSubmit} noValidate>
                <div className="field-group">
                  <label htmlFor="new-password">New password</label>
                  <div className="password-wrap">
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="At least 10 characters"
                      aria-describedby="password-guidance"
                      disabled={loading}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <p className="field-guidance" id="password-guidance">{passwordGuidance}</p>
                </div>
                <div className="field-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <div className="password-wrap">
                    <input
                      id="confirm-password"
                      name="confirmation"
                      type={showConfirmation ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      disabled={loading}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      aria-label={showConfirmation ? 'Hide confirmation' : 'Show confirmation'}
                      onClick={() => setShowConfirmation(!showConfirmation)}
                      disabled={loading}
                    >
                      {showConfirmation ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
                {error && <p className="form-error" role="alert"><LockKeyhole size={15} />{error}</p>}
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Resetting…' : 'Reset password'}
                  {!loading && <ArrowUpRight size={15} />}
                </button>
              </form>
              <p className="auth-register">
                <Link href="/forgot-password"><ArrowUpRight size={13} /> Request another link</Link>
              </p>
            </>
          )}
        </div>
        <footer className="auth-footer"><span>© 2026 WorkFlowX</span><span>Private by design.</span></footer>
      </section>
    </main>
  )
}

