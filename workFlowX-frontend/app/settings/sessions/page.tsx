'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Laptop,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { SettingsLayout } from '@/components/settings-layout'
import { sessionsApi } from '@/lib/api/sessions'
import type { DeviceSession } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function SessionsPage() {
  const { logout } = useAuth()
  const [sessions, setSessions] = useState<DeviceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedForRevoke, setSelectedForRevoke] = useState<DeviceSession | null>(null)
  const [confirmingAll, setConfirmingAll] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const loadSessions = useCallback(async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const data = await sessionsApi.getSessions()
      setSessions(data.sessions || [])
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.status === 401 ? 'Your session has expired. Please sign in again.' : cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('We could not load your active sessions.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function handleRevokeSingle() {
    if (!selectedForRevoke || revoking) return
    const id = selectedForRevoke.sessionId
    if (!id) {
      setError('This session does not include a revocable identifier.')
      setSelectedForRevoke(null)
      return
    }

    setRevoking(true)
    setError('')
    setSuccess('')

    try {
      await sessionsApi.revokeSession(id)
      if (selectedForRevoke.isCurrentDevice) {
        await logout()
        return
      }
      setSessions((current) => current.filter((s) => s.sessionId !== id))
      setSelectedForRevoke(null)
      setSuccess('Device session revoked successfully.')
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('We could not revoke that session.')
      }
    } finally {
      setRevoking(false)
    }
  }

  async function handleRevokeAll() {
    if (revoking) return
    setRevoking(true)
    setError('')
    setSuccess('')

    try {
      await sessionsApi.revokeAllSessions()
      await logout()
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(cause.message)
      } else if (cause instanceof Error) {
        setError(cause.message)
      } else {
        setError('Failed to log out from all devices.')
      }
      setRevoking(false)
      setConfirmingAll(false)
    }
  }

  const currentSession = useMemo(() => sessions.find((s) => s.isCurrentDevice), [sessions])
  const otherSessionsCount = useMemo(() => sessions.filter((s) => !s.isCurrentDevice).length, [sessions])
  const mostRecentActivity = useMemo(() => {
    const dates = sessions.map((s) => s.lastActive || s.createdAt).filter(Boolean) as string[]
    if (!dates.length) return null
    return new Date(dates[0]).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [sessions])

  return (
    <SettingsLayout
      title="Active sessions"
      eyebrow="Manage the devices and browsers where your account is currently signed in."
    >
      <div className="sessions-page">
        <div className="settings-breadcrumb">
          <Link href="/settings/security">
            <ArrowLeft size={13} /> Security settings
          </Link>
          <span>/</span>
          <strong>Active sessions</strong>
        </div>

        <div className="sessions-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={() => setConfirmingAll(true)}
                className="app-secondary-action"
                style={{ color: '#c2410c' }}
                disabled={loading || revoking}
              >
                <Trash2 size={13} /> Log out all devices
              </button>
            )}
          </div>
          <button
            className="app-secondary-action"
            type="button"
            onClick={() => void loadSessions()}
            disabled={loading || revoking}
          >
            <RefreshCw className={loading ? 'spin' : ''} size={14} /> Refresh
          </button>
        </div>

        <div className="sessions-info">
          <ShieldCheck size={18} />
          <p>
            Review your active sessions regularly. Persistent Redis sessions securely back your devices. If you see a device you don&apos;t recognize, revoke its session to immediately terminate access.
          </p>
        </div>

        <div className="session-summary" aria-label="Session summary">
          <div>
            <span>ACTIVE SESSIONS</span>
            <strong>{loading ? '—' : sessions.length}</strong>
          </div>
          <div>
            <span>CURRENT DEVICE</span>
            <strong>{loading ? '—' : currentSession ? 'Identified' : 'Active'}</strong>
          </div>
          <div>
            <span>MOST RECENT ACTIVITY</span>
            <strong>{loading ? '—' : mostRecentActivity || 'Recent'}</strong>
          </div>
        </div>

        <div className="settings-card sessions-card">
          <div className="settings-card-heading">
            <span className="settings-icon">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="app-eyebrow">SESSION MANAGEMENT</p>
              <h2>Your active devices.</h2>
            </div>
          </div>

          {loading ? (
            <div className="session-skeleton-list" aria-label="Loading sessions">
              <div />
              <div />
              <div />
            </div>
          ) : error && !sessions.length ? (
            <div className="sessions-state-error">
              <AlertTriangle size={18} />
              <div>
                <strong>Sessions are unavailable.</strong>
                <p>{error}</p>
                <button
                  className="app-secondary-action"
                  type="button"
                  onClick={() => void loadSessions()}
                >
                  <RefreshCw size={14} /> Try again
                </button>
              </div>
            </div>
          ) : !sessions.length ? (
            <div className="sessions-empty">
              <ShieldCheck size={20} />
              <div>
                <strong>No active sessions found</strong>
                <p>There are no sessions recorded in the session store.</p>
              </div>
            </div>
          ) : (
            <div className="session-list">
              {sessions.map((session, index) => {
                const id = session.sessionId || `session-${index}`
                const browser = session.deviceInfo?.browser || 'Browser'
                const os = session.deviceInfo?.os || 'System'
                const ip = session.deviceInfo?.ip || ''
                const isMobile = /mobile|phone|ios|android/i.test(os)
                const isCurrent = session.isCurrentDevice

                return (
                  <article className="session-row" key={id}>
                    <div className="session-symbol">
                      {isMobile ? <Smartphone size={17} /> : <Laptop size={17} />}
                    </div>

                    <div className="session-details">
                      <strong>
                        {browser} on {os}
                        {isCurrent && <span className="current-session">Current</span>}
                      </strong>
                      <span>
                        {os} · {browser}
                      </span>
                      <small>
                        {ip && <span>IP: {ip}</span>}
                        {session.lastActive && (
                          <span>
                            Last active: {new Date(session.lastActive).toLocaleDateString()}{' '}
                            {new Date(session.lastActive).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                        {session.createdAt && (
                          <span>
                            Created: {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </small>
                    </div>

                    {!isCurrent ? (
                      <button
                        className="session-revoke"
                        type="button"
                        onClick={() => setSelectedForRevoke(session)}
                        disabled={revoking}
                      >
                        Revoke session
                      </button>
                    ) : (
                      <span className="session-current-note">Current device</span>
                    )}
                  </article>
                )
              })}
            </div>
          )}

          {error && sessions.length > 0 && (
            <div className="settings-error" style={{ marginTop: '16px' }}>
              <AlertTriangle size={15} />
              {error}
            </div>
          )}

          {success && (
            <div className="settings-success" style={{ marginTop: '16px' }}>
              <Check size={15} />
              {success}
            </div>
          )}
        </div>

        <p className="sessions-back-note" style={{ marginTop: '20px' }}>
          <Link href="/settings/security">
            <ArrowLeft size={13} /> Back to Security settings
          </Link>
        </p>
      </div>

      {selectedForRevoke && (
        <div
          className="confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !revoking) setSelectedForRevoke(null)
          }}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            aria-describedby="revoke-description"
          >
            <AlertTriangle size={20} />
            <h2 id="revoke-title">Revoke this session?</h2>
            <p id="revoke-description">
              This device (
              {selectedForRevoke.deviceInfo?.browser || 'Browser'} on{' '}
              {selectedForRevoke.deviceInfo?.os || 'Device'}) will lose access immediately.
              Its refresh token will be invalidated in Redis and the user will need to sign in again.
            </p>
            <div className="settings-actions">
              <button
                className="app-secondary-action"
                type="button"
                onClick={() => setSelectedForRevoke(null)}
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                className="app-primary-action"
                type="button"
                onClick={() => void handleRevokeSingle()}
                disabled={revoking}
                style={{ background: '#c9472d', borderColor: '#c9472d' }}
              >
                {revoking ? (
                  <>
                    <LoaderCircle className="spin" size={14} /> Revoking…
                  </>
                ) : (
                  'Revoke session'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmingAll && (
        <div
          className="confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !revoking) setConfirmingAll(false)
          }}
        >
          <div
            className="confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="revoke-all-title"
            aria-describedby="revoke-all-description"
          >
            <AlertTriangle size={20} />
            <h2 id="revoke-all-title">Log out from all devices?</h2>
            <p id="revoke-all-description">
              This will revoke all active Redis sessions for your account across all computers and mobile devices, including this one. You will be redirected to the sign-in page.
            </p>
            <div className="settings-actions">
              <button
                className="app-secondary-action"
                type="button"
                onClick={() => setConfirmingAll(false)}
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                className="app-primary-action"
                type="button"
                onClick={() => void handleRevokeAll()}
                disabled={revoking}
                style={{ background: '#c9472d', borderColor: '#c9472d' }}
              >
                {revoking ? (
                  <>
                    <LoaderCircle className="spin" size={14} /> Logging out…
                  </>
                ) : (
                  'Yes, log out everywhere'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  )
}
