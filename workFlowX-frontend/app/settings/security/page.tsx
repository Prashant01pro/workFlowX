'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react'
import { SettingsLayout } from '@/components/settings-layout'
import { securityApi } from '@/lib/api/security'
import { ApiError } from '@/lib/api-client'

export default function SecuritySettingsPage() {
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    setError('')
    setSuccess('')

    if (!currentPassword) {
      setError('Please provide your current password.')
      return
    }
    if (!newPassword) {
      setError('Please choose a new password.')
      return
    }
    if (newPassword.length < 10) {
      setError('New password must be at least 10 characters long.')
      return
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current password.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('The confirmed password does not match your new password.')
      return
    }

    setSaving(true)

    try {
      const res = await securityApi.changePassword({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess(res.message || 'Your password was changed successfully.')
    } catch (cause) {
      if (cause instanceof ApiError) {
        if (cause.status === 400 || cause.status === 401) {
          setError(cause.message || 'Your current password was incorrect or your session has expired.')
        } else {
          setError(cause.message)
        }
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('We could not change your password.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsLayout
      title="Security settings"
      eyebrow="Protect access to your WorkFlowX account and manage authentication credentials."
    >
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="app-eyebrow">PASSWORD MANAGEMENT</p>
              <h2>Change your password.</h2>
            </div>
          </div>

          <form className="settings-form" onSubmit={submit} noValidate>
            <div className="field-group">
              <label htmlFor="currentPassword">
                Current password <span className="required">REQUIRED</span>
              </label>
              <div className="password-wrap">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type={show.current ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    setSuccess('')
                  }}
                  disabled={saving}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={show.current ? 'Hide current password' : 'Show current password'}
                  onClick={() => setShow((v) => ({ ...v, current: !v.current }))}
                >
                  {show.current ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="newPassword">
                New password <span className="required">REQUIRED</span>
              </label>
              <div className="password-wrap">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={show.next ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setSuccess('')
                  }}
                  disabled={saving}
                  placeholder="Enter at least 10 characters"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={show.next ? 'Hide new password' : 'Show new password'}
                  onClick={() => setShow((v) => ({ ...v, next: !v.next }))}
                >
                  {show.next ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <small className="field-help password-guidance">
                Use at least 10 characters. A longer, unique password is easier to keep secure.
              </small>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword">
                Confirm new password <span className="required">REQUIRED</span>
              </label>
              <div className="password-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={show.confirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setSuccess('')
                  }}
                  disabled={saving}
                  placeholder="Re-enter your new password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={show.confirm ? 'Hide confirmed password' : 'Show confirmed password'}
                  onClick={() => setShow((v) => ({ ...v, confirm: !v.confirm }))}
                >
                  {show.confirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="settings-error" role="alert">
                <CircleAlert size={15} />
                {error}
              </p>
            )}

            {success && (
              <p className="settings-success" role="status">
                <Check size={15} />
                {success}
              </p>
            )}

            <button className="app-primary-action" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoaderCircle className="spin" size={15} />
                  Changing password…
                </>
              ) : (
                <>
                  Change password <ArrowUpRight size={14} />
                </>
              )}
            </button>
          </form>
        </section>

        <aside className="settings-aside">
          <p className="app-eyebrow">ACTIVE DEVICES</p>
          <h2>Know where you&apos;re signed in.</h2>
          <p>Review active sessions and revoke access from devices you no longer use.</p>
          <Link href="/settings/sessions" className="app-view-link">
            Manage sessions <ArrowUpRight size={13} />
          </Link>
          <div className="settings-aside-divider" />
          <p className="app-eyebrow">ACCOUNT RECOVERY</p>
          <p>If you lose access or forget your password, you can reset it via email.</p>
          <Link href="/forgot-password" className="app-view-link">
            Reset password <ArrowUpRight size={13} />
          </Link>
        </aside>
      </div>
    </SettingsLayout>
  )
}
