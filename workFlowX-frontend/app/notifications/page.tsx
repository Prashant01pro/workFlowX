'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BellRing,
  Calendar,
  Check,
  CheckCheck,
  CheckSquare,
  CircleDollarSign,
  Clock,
  FolderKanban,
  Info,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  NotebookPen,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingDown,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { SignOutButton } from '@/components/signout-button'
import { notificationsApi } from '@/lib/api/notifications'
import type { NotificationEntity, NotificationPriority, NotificationType } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 45) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getNotificationVisuals(type: NotificationType, priority: NotificationPriority) {
  switch (type) {
    case 'PROJECT_DEADLINE_APPROACHING':
    case 'PROJECT_OVERDUE':
      return {
        icon: FolderKanban,
        category: 'Project deadline',
        iconBoxClass: priority === 'critical' ? 'critical' : 'warning',
      }
    case 'TASK_DUE_SOON':
    case 'TASK_OVERDUE':
      return {
        icon: CheckSquare,
        category: 'Task alert',
        iconBoxClass: priority === 'critical' ? 'critical' : 'warning',
      }
    case 'NOTE_REMINDER':
      return {
        icon: NotebookPen,
        category: 'Note reminder',
        iconBoxClass: 'info',
      }
    case 'FINANCE_LARGE_EXPENSE':
    case 'FINANCE_LIMIT_REACHED':
      return {
        icon: CircleDollarSign,
        category: 'Financial alert',
        iconBoxClass: priority === 'critical' ? 'critical' : 'warning',
      }
    case 'SYSTEM':
    default:
      return {
        icon: Bell,
        category: 'System notice',
        iconBoxClass: priority === 'critical' ? 'critical' : priority === 'warning' ? 'warning' : 'info',
      }
  }
}

function resolveEntityLink(notification: NotificationEntity) {
  const data = notification.data || {}
  if (data.projectId) {
    return {
      href: `/projects/${data.projectId}`,
      label: 'View project',
    }
  }
  if (data.taskId) {
    return {
      href: `/tasks/${data.taskId}`,
      label: 'View task',
    }
  }
  if (data.noteId) {
    return {
      href: `/notes/${data.noteId}`,
      label: 'Open note',
    }
  }
  if (data.transactionId || notification.type.startsWith('FINANCE_')) {
    return {
      href: '/finances/transactions',
      label: 'Review finances',
    }
  }
  return null
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'deadlines' | 'finances'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [streamConnected, setStreamConnected] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null)

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  // Fetch notifications from the backend
  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true)
    setError('')
    try {
      const response = await notificationsApi.getAll({ limit: 50 })
      setNotifications(response.notifications || [])
      setUnreadCount(response.unreadCount ?? 0)
    } catch (err) {
      if (err instanceof ApiError && err.isNetworkError) {
        setError('Cannot reach notification service. Please ensure the backend server is running.')
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load notifications'
        setError(message)
      }
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications(true)
  }, [fetchNotifications])

  // Real-time Server-Sent Events (SSE) listener
  useEffect(() => {
    let eventSource: EventSource | null = null

    try {
      const streamUrl = notificationsApi.getStreamUrl()
      eventSource = new EventSource(streamUrl, { withCredentials: true })

      eventSource.onopen = () => {
        setStreamConnected(true)
      }

      eventSource.addEventListener('notification', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as NotificationEntity
          if (payload && payload._id) {
            setNotifications((prev) => {
              if (prev.some((n) => n._id === payload._id)) return prev
              return [payload, ...prev]
            })
            if (!payload.readAt) {
              setUnreadCount((prev) => prev + 1)
            }
          }
        } catch (e) {
          console.error('Failed to parse incoming SSE notification payload', e)
        }
      })

      eventSource.onerror = () => {
        setStreamConnected(false)
      }
    } catch (e) {
      console.warn('Unable to initialize SSE notification stream', e)
      setStreamConnected(false)
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [])

  // Trigger on-demand workspace alert evaluation
  const handleEvaluate = async () => {
    setEvaluating(true)
    setError('')
    try {
      await notificationsApi.evaluate()
      await fetchNotifications(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate alerts'
      setError(message)
    } finally {
      setEvaluating(false)
    }
  }

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    setActionInProgressId(id)
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((item) => (item._id === id ? { ...item, readAt: new Date().toISOString() } : item))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await notificationsApi.markAsRead(id)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
      // Rollback on failure
      fetchNotifications(false)
    } finally {
      setActionInProgressId(null)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return
    const nowIso = new Date().toISOString()

    // Optimistic update
    setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || nowIso })))
    setUnreadCount(0)

    try {
      await notificationsApi.markAllAsRead()
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      fetchNotifications(false)
    }
  }

  // Delete notification
  const handleDelete = async (id: string) => {
    const target = notifications.find((n) => n._id === id)
    const wasUnread = target && !target.readAt

    // Optimistic removal
    setNotifications((prev) => prev.filter((item) => item._id !== id))
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    try {
      await notificationsApi.delete(id)
    } catch (err) {
      console.error('Failed to delete notification:', err)
      fetchNotifications(false)
    }
  }

  // Metrics calculations
  const metrics = useMemo(() => {
    const total = notifications.length
    const unread = unreadCount
    const deadlines = notifications.filter(
      (n) => n.type.includes('DEADLINE') || n.type.includes('OVERDUE') || n.type.includes('DUE_SOON')
    ).length
    const finances = notifications.filter((n) => n.type.startsWith('FINANCE_')).length
    return { total, unread, deadlines, finances }
  }, [notifications, unreadCount])

  // Filter and search
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'unread' && item.readAt !== null) return false
      if (
        activeTab === 'deadlines' &&
        !(item.type.includes('DEADLINE') || item.type.includes('OVERDUE') || item.type.includes('DUE_SOON'))
      ) {
        return false
      }
      if (activeTab === 'finances' && !item.type.startsWith('FINANCE_')) return false

      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = item.title.toLowerCase().includes(query)
        const messageMatch = item.message.toLowerCase().includes(query)
        return titleMatch || messageMatch
      }

      return true
    })
  }, [notifications, activeTab, priorityFilter, searchQuery])

  return (
    <div className="app-shell">
      {/* Mobile Drawer Overlay */}
      <button
        type="button"
        className={`app-overlay ${menuOpen ? 'visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-label="Close navigation overlay"
      />

      {/* Sidebar Navigation */}
      <aside className={`app-sidebar ${menuOpen ? 'app-sidebar-open' : ''}`}>
        <div className="app-sidebar-top">
          <Link href="/" className="app-wordmark">
            WorkFlow<span>X</span>
          </Link>
          <button
            type="button"
            className="app-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="app-workspace">
          <span className="app-avatar">{initials}</span>
          <div>
            <strong>{name}</strong>
            <small>Personal workspace</small>
          </div>
        </div>

        <p className="app-nav-label">Workspace</p>
        <nav className="app-nav" aria-label="Workspace navigation">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = label === 'Notifications'
            return (
              <Link
                key={href}
                href={href}
                className={isActive ? 'active' : ''}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} strokeWidth={1.7} />
                {label}
                {label === 'Notifications' && unreadCount > 0 && (
                  <span className="count" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <p className="app-nav-label app-nav-label-personal">Personal</p>
        <nav className="app-nav" aria-label="Personal navigation">
          <Link href="/settings/profile" onClick={() => setMenuOpen(false)}>
            <Settings size={16} strokeWidth={1.7} />
            Settings
          </Link>
          <Link href="/settings/security" onClick={() => setMenuOpen(false)}>
            <ShieldCheck size={16} strokeWidth={1.7} />
            Security
          </Link>
        </nav>

        <div className="app-sidebar-bottom">
          <SignOutButton onClick={() => setMenuOpen(false)} />
          <span>ALERT SYSTEM ACTIVE</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              type="button"
              className="app-menu-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="app-eyebrow">WORKSPACE / NOTIFICATIONS</p>
              <h1>Notifications & Alerts</h1>
              <p>Real-time workspace signals, deadline alerts, and activity logs.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live SSE Stream Status Indicator */}
            <div
              className={`live-stream-badge ${streamConnected ? 'connected' : 'disconnected'}`}
              title={streamConnected ? 'Real-time SSE updates connected' : 'Connecting to live event stream...'}
            >
              <span className={`live-stream-dot ${streamConnected ? 'online' : 'offline'}`} />
              <span>{streamConnected ? 'Live stream' : 'Syncing'}</span>
            </div>

            <div className="app-header-user">
              <span className="app-avatar app-avatar-light">{initials}</span>
            </div>
          </div>
        </header>

        <div className="app-content notifications-content">
          {/* Welcome Action Block */}
          <section className="welcome-block notifications-welcome">
            <div>
              <p className="app-eyebrow">WORKSPACE ACTIVITY</p>
              <h2>
                Stay informed. <em>Stay focused.</em>
              </h2>
              <p>Automated deadline monitoring and threshold evaluations keep your workspace healthy.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="app-secondary-action"
                onClick={handleEvaluate}
                disabled={evaluating}
                title="Trigger automated background check for project and task deadlines"
              >
                <RefreshCw size={14} className={evaluating ? 'animate-spin' : ''} />
                {evaluating ? 'Evaluating...' : 'Evaluate workspace'}
              </button>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="app-primary-action"
                  onClick={handleMarkAllAsRead}
                  style={{ border: 0, cursor: 'pointer' }}
                >
                  <CheckCheck size={15} />
                  Mark all as read
                </button>
              )}
            </div>
          </section>

          {/* Metrics Grid */}
          <section className="metric-grid notifications-metrics" aria-label="Notification counts">
            <div className="metric-card">
              <span>ALL ALERTS</span>
              <strong>{metrics.total}</strong>
              <small>Workspace history</small>
            </div>
            <div className={`metric-card ${metrics.unread > 0 ? 'metric-card-accent' : ''}`}>
              <span>UNREAD</span>
              <strong>{metrics.unread}</strong>
              <small>{metrics.unread === 0 ? 'All caught up' : 'Needs your attention'}</small>
            </div>
            <div className="metric-card">
              <span>DEADLINES & OVERDUE</span>
              <strong>{metrics.deadlines}</strong>
              <small>Projects & task schedules</small>
            </div>
            <div className="metric-card">
              <span>FINANCE NOTICES</span>
              <strong>{metrics.finances}</strong>
              <small>Thresholds & limits</small>
            </div>
          </section>

          {/* Filter and Search Toolbar */}
          <section className="notification-toolbar" aria-label="Notification filters">
            <div className="notification-tabs">
              <button
                type="button"
                className={activeTab === 'all' ? 'selected' : ''}
                onClick={() => setActiveTab('all')}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={activeTab === 'unread' ? 'selected' : ''}
                onClick={() => setActiveTab('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                className={activeTab === 'deadlines' ? 'selected' : ''}
                onClick={() => setActiveTab('deadlines')}
              >
                Deadlines ({metrics.deadlines})
              </button>
              <button
                type="button"
                className={activeTab === 'finances' ? 'selected' : ''}
                onClick={() => setActiveTab('finances')}
              >
                Finances ({metrics.finances})
              </button>
            </div>

            <div className="notification-tools">
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid #bfc0b9',
                  background: '#f0eee8',
                  height: '36px',
                  padding: '0 10px',
                  color: '#777b74',
                }}
              >
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Filter alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 0,
                    outline: 0,
                    background: 'transparent',
                    fontSize: '11px',
                    color: '#30352f',
                    width: '140px',
                  }}
                />
              </div>

              {/* Priority Select */}
              <select
                className="notification-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                aria-label="Filter by priority"
              >
                <option value="all">All priorities</option>
                <option value="critical">Critical only</option>
                <option value="warning">Warning only</option>
                <option value="info">Info only</option>
              </select>
            </div>
          </section>

          {/* Error notice if API fails */}
          {error && (
            <div className="workflow-inline-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <div>
                <strong>Notification service alert</strong>
                <p>{error}</p>
                <button type="button" onClick={() => fetchNotifications(false)}>
                  Retry connecting
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="app-section" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <LoaderCircle size={28} className="animate-spin" style={{ margin: '0 auto 14px', color: 'var(--accent)' }} />
              <p style={{ fontSize: '12px', color: '#777b74', margin: 0 }}>
                Evaluating deadlines and syncing notifications...
              </p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            /* Empty State */
            <div className="app-empty">
              <span className="empty-rule" />
              <strong>No notifications to display</strong>
              <p>
                {activeTab === 'unread'
                  ? "You're completely up to date! There are no unread notifications in your workspace."
                  : searchQuery
                  ? 'No notifications matched your search query.'
                  : 'Your workspace is calm. Deadlines and budget limits are healthy and in order.'}
              </p>
              <button
                type="button"
                className="app-inline-action"
                onClick={handleEvaluate}
                style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0 }}
              >
                Run fresh workspace evaluation
                <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            /* Notifications List */
            <div className="notifications-list" role="feed" aria-busy={loading}>
              {filteredNotifications.map((notification) => {
                const isUnread = !notification.readAt
                const visuals = getNotificationVisuals(notification.type, notification.priority)
                const IconComponent = visuals.icon
                const entityLink = resolveEntityLink(notification)
                const isPending = actionInProgressId === notification._id

                return (
                  <article
                    key={notification._id}
                    className={`notification-card ${isUnread ? 'unread' : ''} priority-${notification.priority}`}
                  >
                    {/* Visual Icon Box */}
                    <div className={`notification-icon-box ${visuals.iconBoxClass}`}>
                      <IconComponent size={18} strokeWidth={1.8} />
                    </div>

                    {/* Notification Body */}
                    <div className="notification-body">
                      <div className="notification-head">
                        <div className="notification-title-group">
                          <h3 className="notification-title">{notification.title}</h3>
                          <div className="notification-badges">
                            <span className={`notification-badge ${notification.priority}`}>
                              {notification.priority}
                            </span>
                            {isUnread && (
                              <span className="notification-badge unread-indicator">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="notification-time">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="notification-message">{notification.message}</p>

                      {/* Meta & Interactive Controls */}
                      <div className="notification-meta-row">
                        <div className="notification-meta-left">
                          <span>
                            <Clock size={11} />
                            {visuals.category}
                          </span>
                          {entityLink && (
                            <Link href={entityLink.href} className="notification-entity-link">
                              {entityLink.label}
                              <ArrowUpRight size={12} />
                            </Link>
                          )}
                        </div>

                        <div className="notification-controls">
                          {isUnread && (
                            <button
                              type="button"
                              className="notification-btn"
                              onClick={() => handleMarkAsRead(notification._id)}
                              disabled={isPending}
                              title="Mark this alert as read"
                            >
                              <Check size={12} />
                              Mark read
                            </button>
                          )}
                          <button
                            type="button"
                            className="notification-btn delete-btn"
                            onClick={() => handleDelete(notification._id)}
                            disabled={isPending}
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <span>WORKFLOWX WORKSPACE NOTIFICATIONS</span>
          <span>DISPATCHED VIA EVENTBUS & SSE</span>
        </footer>
      </main>
    </div>
  )
}
