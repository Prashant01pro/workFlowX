'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  NotebookPen,
  CircleDollarSign,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/admin-layout'
import { adminApi } from '@/lib/api/admin'
import type { AdminUserDetailsData } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function AdminUserDetails() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user: currentAdmin } = useAuth()

  const [details, setDetails] = useState<AdminUserDetailsData | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const userId = params?.id

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    setActionError(null)
    try {
      const res = await adminApi.getUserDetails(userId)
      setDetails(res.data)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const targetUser = details?.user
  const resources = details?.resourceSummary
  const isCurrentAdmin = Boolean(targetUser && currentAdmin?.id && (targetUser.id === currentAdmin.id || targetUser._id === currentAdmin.id))

  async function handleRoleChange(newRole: 'user' | 'admin') {
    if (!userId) return
    if (isCurrentAdmin) {
      setActionError('Safety enforcement: You cannot change your own role.')
      return
    }

    setUpdatingRole(true)
    setActionError(null)
    setActionSuccess(null)
    try {
      const res = await adminApi.updateUserRole(userId, newRole)
      setActionSuccess(res.message || `User role updated to ${newRole}`)
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                role: newRole,
              },
            }
          : prev
      )
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message)
      } else {
        setActionError('Failed to update user role.')
      }
    } finally {
      setUpdatingRole(false)
    }
  }

  async function handleRemove() {
    if (!userId) return
    if (isCurrentAdmin) {
      setActionError('Safety enforcement: You cannot delete your own admin account.')
      return
    }

    if (
      !window.confirm(
        `Permanently delete "${targetUser?.name || targetUser?.email}"?\n\nThis will cascade delete all ${resources?.projectsCount || 0} projects, ${resources?.tasksCount || 0} tasks, ${resources?.notesCount || 0} notes, and ${resources?.transactionsCount || 0} transactions.`
      )
    ) {
      return
    }

    setDeleting(true)
    setActionError(null)
    try {
      await adminApi.deleteUser(userId)
      router.push('/admin/users')
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message)
      } else {
        setActionError('Failed to delete user.')
      }
      setDeleting(false)
    }
  }

  return (
    <AdminLayout
      title="User details"
      description="Audited administrative inspection and RBAC privilege management."
    >
      <div className="admin-breadcrumb">
        <Link href="/admin">
          <ArrowLeft size={13} /> Admin
        </Link>
        <span>/</span>
        <Link href="/admin/users">Users</Link>
        <span>/</span>
        <span>{targetUser?.name || userId}</span>
      </div>

      {actionSuccess && (
        <div
          className="admin-notice"
          style={{ background: '#e1f5e8', borderColor: '#b2dfdb', color: '#1b5e20', marginBottom: '18px' }}
        >
          <CheckCircle2 size={16} style={{ color: '#2e7d32' }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="admin-error" style={{ marginBottom: '18px' }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Action blocked</strong>
            <p>{actionError}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="admin-state">
          <RefreshCw className="spin" size={18} /> Loading user…
        </div>
      ) : error ? (
        <div className="admin-error">
          <AlertTriangle size={18} />
          <div>
            <strong>
              {error.status === 404
                ? 'User not found.'
                : error.status === 403
                ? 'Admin access required.'
                : 'User unavailable.'}
            </strong>
            <p>{error.message}</p>
            <button className="app-secondary-action" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      ) : !targetUser ? (
        <div className="admin-empty">
          <UserRound size={20} /> No user data returned.
        </div>
      ) : (
        <>
          <section className="admin-user-card">
            <div className="admin-user-avatar">
              <UserRound size={24} />
            </div>
            <div>
              <p className="app-eyebrow">ACCOUNT</p>
              <h2>{targetUser.name || 'Unnamed user'}</h2>
              <p>{targetUser.email || 'Email unavailable'}</p>
            </div>
            <span
              className="admin-role"
              style={{
                background: targetUser.role === 'admin' ? '#e54d2e15' : 'transparent',
                borderColor: targetUser.role === 'admin' ? 'var(--accent)' : '#c7c8c0',
                color: targetUser.role === 'admin' ? 'var(--accent)' : '#555b54',
                fontWeight: targetUser.role === 'admin' ? 700 : 400,
              }}
            >
              {targetUser.role || 'user'}
              {isCurrentAdmin && ' (You)'}
            </span>
          </section>

          {/* Resource Summary Counters */}
          <div className="admin-metrics" style={{ margin: '0 0 24px' }}>
            <article className="admin-metric">
              <span>PROJECTS</span>
              <strong>{resources?.projectsCount ?? 0}</strong>
            </article>
            <article className="admin-metric">
              <span>TASKS</span>
              <strong>{resources?.tasksCount ?? 0}</strong>
            </article>
            <article className="admin-metric">
              <span>NOTES</span>
              <strong>{resources?.notesCount ?? 0}</strong>
            </article>
            <article className="admin-metric">
              <span>TRANSACTIONS</span>
              <strong>{resources?.transactionsCount ?? 0}</strong>
            </article>
          </div>

          <section className="admin-detail-grid">
            <article className="admin-detail-card">
              <h3>Profile metadata</h3>
              <dl>
                <div>
                  <dt>User ID</dt>
                  <dd style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                    {targetUser.id || targetUser._id}
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{targetUser.email || 'Unavailable'}</dd>
                </div>
                {targetUser.bio !== undefined && (
                  <div>
                    <dt>Bio</dt>
                    <dd>{targetUser.bio || 'Not provided'}</dd>
                  </div>
                )}
                {targetUser.createdAt && (
                  <div>
                    <dt>Created</dt>
                    <dd>{new Date(targetUser.createdAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </article>

            <article className="admin-detail-card">
              <h3>Role assignment</h3>
              <p style={{ fontSize: '11px', color: '#777b74', marginBottom: '16px', lineHeight: 1.5 }}>
                Admins have full workspace privileges including stats oversight, user management, and content moderation.
              </p>

              {isCurrentAdmin ? (
                <div className="admin-notice" style={{ margin: '0 0 16px' }}>
                  <ShieldCheck size={14} /> You cannot change your own role.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    className="app-secondary-action"
                    disabled={updatingRole || targetUser.role === 'admin'}
                    onClick={() => void handleRoleChange('admin')}
                    style={{
                      background: targetUser.role === 'admin' ? '#e54d2e' : undefined,
                      color: targetUser.role === 'admin' ? '#ffffff' : undefined,
                      borderColor: targetUser.role === 'admin' ? '#e54d2e' : undefined,
                    }}
                  >
                    <ShieldAlert size={14} /> Make Admin
                  </button>
                  <button
                    className="app-secondary-action"
                    disabled={updatingRole || targetUser.role === 'user' || !targetUser.role}
                    onClick={() => void handleRoleChange('user')}
                    style={{
                      background: targetUser.role !== 'admin' ? '#343934' : undefined,
                      color: targetUser.role !== 'admin' ? '#ffffff' : undefined,
                      borderColor: targetUser.role !== 'admin' ? '#343934' : undefined,
                    }}
                  >
                    <UserRound size={14} /> Demote to User
                  </button>
                  {updatingRole && (
                    <RefreshCw className="spin" size={14} style={{ color: '#777b74' }} />
                  )}
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #d0cfc8', margin: '24px 0' }} />

              <div className="admin-danger-card" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                <ShieldCheck size={18} />
                <h3 style={{ marginTop: '6px' }}>Administrative termination</h3>
                <p>
                  Deleting this user permanently cascades across their projects, tasks, notes, and transactions.
                </p>
                <button
                  className="app-secondary-action admin-danger-action"
                  onClick={() => void handleRemove()}
                  disabled={deleting || isCurrentAdmin}
                  title={isCurrentAdmin ? 'Cannot delete your own account' : 'Delete user'}
                >
                  <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete user'}
                </button>
              </div>
            </article>
          </section>
        </>
      )}
    </AdminLayout>
  )
}
