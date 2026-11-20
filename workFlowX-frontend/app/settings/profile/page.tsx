'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState, useCallback } from 'react'
import { ArrowUpRight, Check, CircleAlert, LoaderCircle, RefreshCw, UserRound } from 'lucide-react'
import { SettingsLayout } from '@/components/settings-layout'
import { profileApi } from '@/lib/api/profile'
import type { UserEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function ProfileSettingsPage() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState<UserEntity | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await profileApi.getProfile()
      const u = res.user
      setProfile(u)
      setName(u.name || '')
      setEmail(u.email || '')
      setBio(u.bio || '')
      setRole(u.role || 'user')
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.status === 401 ? 'Your session has expired. Please sign in again.' : cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('We could not load your profile.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please provide a display name.')
      return
    }
    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters.')
      return
    }
    if (trimmedName.length > 50) {
      setError('Display name cannot exceed 50 characters.')
      return
    }
    if (bio.length > 500) {
      setError('Bio must be 500 characters or fewer.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await profileApi.updateProfile({
        name: trimmedName,
        bio: bio.trim(),
      })
      const updated = res.user
      setProfile(updated)
      setName(updated.name || trimmedName)
      setBio(updated.bio || '')
      updateUser({
        name: updated.name || trimmedName,
        bio: updated.bio || '',
      })
      setSuccess('Your profile was updated successfully.')
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.status === 401 ? 'Your session has expired. Please sign in again.' : cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('We could not save your profile.')
      }
    } finally {
      setSaving(false)
    }
  }

  const initials = (name || email || 'AM')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <SettingsLayout
      title="Profile settings"
      eyebrow="Manage the details and public identity connected to your account."
    >
      <div className="settings-grid">
        <section className="settings-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <UserRound size={18} />
            </span>
            <div>
              <p className="app-eyebrow">PROFILE INFORMATION</p>
              <h2>Your account, in focus.</h2>
            </div>
          </div>

          {loading ? (
            <div className="settings-state">
              <LoaderCircle className="spin text-accent" size={18} />
              Loading your profile…
            </div>
          ) : (
            <form className="settings-form" onSubmit={submit} noValidate>
              <div className="settings-avatar">
                <span>{initials}</span>
                <div>
                  <strong>{name || 'Your profile'}</strong>
                  <small style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Role: {role} · Private workspace
                  </small>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="profile-name">
                  Display name <span className="required">REQUIRED</span>
                </label>
                <input
                  id="profile-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setSuccess('')
                  }}
                  disabled={!profile || saving}
                  placeholder="Your full name"
                  required
                />
                <small className="field-help">Between 2 and 50 characters.</small>
              </div>

              <div className="field-group">
                <label htmlFor="profile-email">Email address</label>
                <input id="profile-email" type="email" value={email} readOnly disabled />
                <small className="field-help">
                  Email addresses identify your account and cannot be modified here.
                </small>
              </div>

              <div className="field-group">
                <label htmlFor="profile-bio">Bio (optional)</label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(event) => {
                    setBio(event.target.value)
                    setSuccess('')
                  }}
                  maxLength={500}
                  disabled={!profile || saving}
                  placeholder="Tell your workspace a little about you."
                />
                <small className="field-help">{bio.length}/500 characters</small>
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

              <div className="settings-actions">
                <button
                  className="app-primary-action"
                  type="submit"
                  disabled={!profile || saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="spin" size={14} /> Saving…
                    </>
                  ) : (
                    <>
                      Save changes <ArrowUpRight size={14} />
                    </>
                  )}
                </button>
                <button
                  className="app-secondary-action"
                  type="button"
                  onClick={() => {
                    setName(profile?.name || '')
                    setBio(profile?.bio || '')
                    setError('')
                    setSuccess('')
                  }}
                  disabled={!profile || saving}
                >
                  Reset
                </button>
              </div>
            </form>
          )}

          {!loading && error && !profile && (
            <button
              className="app-secondary-action retry-action"
              type="button"
              onClick={() => void loadProfile()}
            >
              <RefreshCw size={14} /> Try again
            </button>
          )}
        </section>

        <aside className="settings-aside">
          <p className="app-eyebrow">ACCOUNT ACCESS</p>
          <h2>Keep your details current.</h2>
          <p>
            Your email identifies your account. Password and active-device controls live in Security.
          </p>
          <Link href="/settings/security" className="app-view-link">
            Security settings <ArrowUpRight size={13} />
          </Link>
          <div className="settings-aside-divider" />
          <p className="app-eyebrow">DEVICE SESSIONS</p>
          <p>Manage and audit all devices currently authorized to access your account.</p>
          <Link href="/settings/sessions" className="app-view-link">
            Active sessions <ArrowUpRight size={13} />
          </Link>
        </aside>
      </div>
    </SettingsLayout>
  )
}
