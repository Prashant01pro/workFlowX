'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { adminApi } from '@/lib/api/admin'
import type { AdminSystemStatsData } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminSystemStatsData | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getStats()
      setStats(res.data)
    } catch (err) {
      setError(err as ApiError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const metricCards = stats
    ? [
        { label: 'TOTAL USERS', value: stats.totalUsers },
        { label: 'TOTAL PROJECTS', value: stats.totalProjects },
        { label: 'TOTAL TASKS', value: stats.totalTasks },
        { label: 'TOTAL NOTES', value: stats.totalNotes },
        { label: 'TOTAL TRANSACTIONS', value: stats.totalTransactions },
        {
          label: 'PLATFORM VOLUME',
          value: `$${(stats.totalPlatformVolume || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        },
      ]
    : []

  return (
    <AdminLayout
      title="Admin overview"
      description="A controlled view of the metrics and people that keep the workspace running."
    >
      <section className="admin-intro">
        <div>
          <p className="app-eyebrow">CONTROL ROOM</p>
          <h2>
            Keep the workspace <em>accountable.</em>
          </h2>
        </div>
        <ShieldCheck size={32} aria-hidden="true" />
      </section>

      <div className="admin-notice">
        <ShieldCheck size={16} /> Administrative actions are strictly enforced by the backend RBAC
        engine. Current session: {user?.email || 'admin'} ({user?.role || 'admin'}).
      </div>

      {loading ? (
        <div className="admin-state">
          <RefreshCw className="spin" size={18} /> Loading verified metrics…
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
                : 'Metrics unavailable.'}
            </strong>
            <p>{error.message}</p>
            <button className="app-secondary-action" onClick={() => void load()}>
              Retry
            </button>
          </div>
        </div>
      ) : metricCards.length === 0 ? (
        <div className="admin-empty">
          <Users size={20} />
          <div>
            <strong>No administrative metrics returned.</strong>
            <p>The stats endpoint responded without supported metric fields.</p>
          </div>
        </div>
      ) : (
        <div className="admin-metrics">
          {metricCards.map(({ label, value }) => (
            <article className="admin-metric" key={label}>
              <span>{label}</span>
              <strong>{String(value)}</strong>
            </article>
          ))}
        </div>
      )}

      <section className="admin-link-card">
        <div>
          <p className="app-eyebrow">PEOPLE</p>
          <h2>User management</h2>
          <p>Review users and manage administrative roles authorized by the backend.</p>
        </div>
        <Link className="app-primary-action" href="/admin/users">
          Open users <ArrowUpRight size={14} />
        </Link>
      </section>
    </AdminLayout>
  )
}
