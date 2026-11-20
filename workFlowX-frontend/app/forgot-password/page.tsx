'use client'

import Link from 'next/link'
import { ArrowUpRight, ChevronRight, Mail, Send } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { api, ApiError } from '@/lib/api-client'

export default function ForgotPasswordPage() {
  const [emailError, setEmailError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    const email = String(new FormData(event.currentTarget).get('email') || '').trim()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    setEmailError(!email ? 'Enter your email address.' : !valid ? 'Enter a valid email address.' : '')
    setFormError('')
    if (!email || !valid) return

    setLoading(true)
    try {
      await api.post('/api/v1/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      // Backend returns uniform message even if account does not exist to prevent enumeration
      if (err instanceof ApiError && err.message?.toLowerCase().includes('password reset link has been sent')) {
        setSuccess(true)
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('Unable to send password reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page recovery-page">
      <section className="auth-brand" aria-labelledby="recovery-brand-heading">
        <header className="auth-header">
          <Link className="wordmark" href="/">WorkFlow<span>X</span></Link>
          <Link className="auth-back" href="/login"><ChevronRight size={13} /> Back to sign in</Link>
        </header>
        <div className="auth-brand-content">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1 id="recovery-brand-heading">Find your<br /><em>way back</em><br />to focus.</h1>
          <p>We&apos;ll help you get back to the workspace where your work already makes sense.</p>
          <div className="recovery-mark" aria-hidden="true">
            <Mail size={27} />
            <span>SECURE ACCOUNT ACCESS</span>
          </div>
        </div>
        <div className="auth-brand-foot"><span>02</span><span>Everything in focus.</span></div>
      </section>

      <section className="auth-form-panel" aria-labelledby="forgot-heading">
        <div className="auth-form-wrap recovery-form-wrap">
          <div className="mobile-auth-mark"><Link className="wordmark" href="/">WorkFlow<span>X</span></Link></div>
          {success ? (
            <div className="reset-success">
              <p className="eyebrow">LINK SENT</p>
              <h2 id="forgot-heading">Check your<br />inbox.</h2>
              <p className="auth-intro">
                If an account exists with this email, a password reset link has been sent. The link expires in 15 minutes.
              </p>
              <Link className="auth-submit" href="/login">
                Return to sign in <ArrowUpRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <p className="eyebrow">RESET ACCESS</p>
              <h2 id="forgot-heading">Forgot your<br />password?</h2>
              <p className="auth-intro">
                It happens. Enter the email address associated with your account, and we&apos;ll help you reset your password.
              </p>
              <form className="login-form recovery-form" onSubmit={handleSubmit} noValidate>
                <div className="field-group">
                  <label htmlFor="recovery-email">Email address</label>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'recovery-email-error' : undefined}
                    onChange={() => {
                      setEmailError('')
                      setFormError('')
                    }}
                    disabled={loading}
                  />
                  {emailError && <p className="field-error" id="recovery-email-error" role="alert">{emailError}</p>}
                </div>
                {formError && <p className="form-error" role="alert"><Mail size={15} />{formError}</p>}
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                  {!loading && <Send size={15} />}
                </button>
              </form>
              <p className="auth-register">
                <Link href="/login"><ArrowUpRight size={13} /> Back to sign in</Link>
              </p>
            </>
          )}
        </div>
        <footer className="auth-footer"><span>© 2026 WorkFlowX</span><span>Private by design.</span></footer>
      </section>
    </main>
  )
}
