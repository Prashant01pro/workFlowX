'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { adminApi } from '@/lib/api/admin'
import type { UserEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth()
  const [users, setUsers] = useState<UserEntity[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setActionError(null)
    try {
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page,
        limit: 10,
      })
      setUsers(res.users || [])
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1)
        setTotalUsers(res.pagination.totalUsers || 0)
      }
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, page])

  useEffect(() => {
    void load()
  }, [load])

  async function removeUser(targetUser: UserEntity) {
    const id = targetUser.id || targetUser._id
    if (!id) return

    if (id === currentAdmin?.id) {
      setActionError('Safety enforcement: You cannot delete your own admin account.')
      return
    }

    if (
      !window.confirm(
        `Permanently delete user "${targetUser.name || targetUser.email}"?\n\nThis will cascade delete all their projects, tasks, notes, and transactions.`
      )
    ) {
      return
    }

    setDeletingId(id)
    setActionError(null)
    try {
      await adminApi.deleteUser(id)
      setUsers((prev) => prev.filter((u) => (u.id || u._id) !== id))
      setTotalUsers((prev) => Math.max(0, prev - 1))
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message)
      } else {
        setActionError('Failed to delete user.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminLayout
      title="User management"
      description="Review workspace accounts, manage access roles, and audit platform membership."
    >
      <div className="admin-breadcrumb">
        <Link href="/admin">
          <ArrowLeft size={13} /> Admin overview
        </Link>
      </div>

      {actionError && (
        <div className="admin-error" style={{ marginBottom: '18px' }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Action failed</strong>
            <p>{actionError}</p>
          </div>
        </div>
      )}

      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <label className="admin-search">
          <Search size={15} />
          <span className="sr-only">Search users</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email…"
          />
        </label>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value as 'all' | 'user' | 'admin')
            setPage(1)
          }}
          style={{
            height: '40px',
            border: '1px solid #bfc0b9',
            background: '#f0eee8',
            padding: '0 12px',
            fontSize: '11px',
            color: '#30352f',
          }}
          aria-label="Filter by role"
        >
          <option value="all">All roles</option>
          <option value="user">Users only</option>
          <option value="admin">Admins only</option>
        </select>

        <span className="admin-count" style={{ marginLeft: 'auto' }}>
          {users.length} visible on page {page} / {totalUsers} total registered
        </span>
      </div>

      {loading ? (
        <div className="admin-state">
          <RefreshCw className="spin" size={18} /> Loading users…
        </div>
      ) : error ? (
        <div className="admin-error">
          <AlertTriangle size={18} />
          <div>
            <strong>
              {error.status === 401
                ? 'Sign in required.'
                : error.status === 403
                ? 'Admin access required.'
                : 'Users unavailable.'}
            </strong>
            <p>{error.message}</p>
            <button className="app-secondary-action" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <Users size={20} />
          <div>
            <strong>{search || roleFilter !== 'all' ? 'No users match your filter.' : 'No users registered.'}</strong>
            <p>
              {search || roleFilter !== 'all'
                ? 'Try adjusting your search query or role filter.'
                : 'The admin users collection is empty.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const id = item.id || item._id || ''
                  const isCurrentAdmin = id === currentAdmin?.id
                  return (
                    <tr key={id || item.email}>
                      <td>
                        <strong>{item.name || 'Unnamed user'}</strong>
                        <small>{item.email || 'Email unavailable'}</small>
                      </td>
                      <td>
                        <span
                          className="admin-role"
                          style={{
                            background: item.role === 'admin' ? '#e54d2e15' : 'transparent',
                            borderColor: item.role === 'admin' ? 'var(--accent)' : '#c7c8c0',
                            color: item.role === 'admin' ? 'var(--accent)' : '#555b54',
                            fontWeight: item.role === 'admin' ? 700 : 400,
                          }}
                        >
                          {item.role || 'user'}
                          {isCurrentAdmin && ' (You)'}
                        </span>
                      </td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <div className="admin-actions">
                          <Link
                            href={`/admin/users/${encodeURIComponent(id)}`}
                            aria-label={`View details for ${item.name || item.email}`}
                          >
                            <Eye size={15} />
                          </Link>
                          <button
                            onClick={() => void removeUser(item)}
                            disabled={!id || deletingId === id || isCurrentAdmin}
                            title={isCurrentAdmin ? 'Cannot delete your own account' : 'Delete user'}
                            aria-label={`Delete ${item.name || item.email}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
                padding: '8px 0',
              }}
            >
              <button
                className="app-secondary-action"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: '11px', color: '#777b74' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="app-secondary-action"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
