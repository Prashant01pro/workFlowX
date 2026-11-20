'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowUpRight,
  Bell,
  CheckSquare,
  CircleAlert,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  NotebookPen,
  Pin,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { SignOutButton } from '@/components/signout-button'
import { dashboardApi } from '@/lib/api/dashboard'
import type { DashboardStatsData } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

type SectionProps = {
  title: string
  eyebrow: string
  href: string
  action?: string
  children: React.ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
  { label: 'Notifications', href: '/notifications', icon: Bell },
]

function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string
  text: string
  href: string
  action: string
}) {
  return (
    <div className="app-empty">
      <span className="empty-rule" />
      <strong>{title}</strong>
      <p>{text}</p>
      <Link href={href} className="app-inline-action">
        {action}
        <ArrowUpRight size={14} />
      </Link>
    </div>
  )
}

function DashboardSection({ title, eyebrow, href, action, children }: SectionProps) {
  return (
    <section className="app-section">
      <div className="app-section-head">
        <div>
          <p className="app-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="app-section-actions">
          {action && (
            <Link href={href} className="app-small-action">
              <Plus size={14} />
              {action}
            </Link>
          )}
          <Link href={href} className="app-view-link">
            View all
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
      {children}
    </section>
  )
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  return (
    <aside
      className={`app-sidebar ${open ? 'app-sidebar-open' : ''}`}
      aria-label="Workspace sidebar"
    >
      <div className="app-sidebar-top">
        <Link href="/" className="app-wordmark">
          WorkFlow<span>X</span>
        </Link>
        <button
          type="button"
          className="app-close"
          onClick={onClose}
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
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={label === 'Dashboard' ? 'active' : ''}
            onClick={onClose}
          >
            <Icon size={16} strokeWidth={1.7} />
            {label}
          </Link>
        ))}
      </nav>
      <p className="app-nav-label app-nav-label-personal">Personal</p>
      <nav className="app-nav" aria-label="Personal navigation">
        <Link href="/settings/profile" onClick={onClose}>
          <Settings size={16} strokeWidth={1.7} />
          Settings
        </Link>
        <Link href="/settings/security" onClick={onClose}>
          <ShieldCheck size={16} strokeWidth={1.7} />
          Security
        </Link>
        {user?.role === 'admin' && (
          <Link href="/admin" onClick={onClose}>
            <ShieldCheck size={16} strokeWidth={1.7} />
            Admin
          </Link>
        )}
      </nav>
      <div className="app-sidebar-bottom">
        <SignOutButton onClick={onClose} />
        <span>PRIVATE BY DESIGN.</span>
      </div>
    </aside>
  )
}

export default function DashboardPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const { user } = useAuth()
  const name = user?.name || 'Alex Morgan'
  const firstName = name.split(' ')[0]
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await dashboardApi.getStats()
      setStats(res.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load dashboard data.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase()

  const openTasksCount = (stats?.tasks.todo || 0) + (stats?.tasks.in_progress || 0)
  const pinnedNotes = (stats?.recentNotes || []).filter((n) => n.isPinned)
  const upcomingDeadlines = (stats?.upcomingTasks || []).filter((t) => t.dueDate)

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <button
        type="button"
        className={`app-overlay ${menuOpen ? 'visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setMenuOpen(false)}
      />

      <main className="app-main">
        <header className="app-header">
          <button
            type="button"
            className="app-menu-toggle"
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="app-eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
            <p>An overview of your workspace.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
            <div>
              <strong>{name}</strong>
              <small>Personal workspace</small>
            </div>
          </div>
        </header>

        <div className="app-content">
          <section className="welcome-block">
            <div>
              <p className="app-eyebrow">{todayFormatted}</p>
              <h2>
                Good morning, <em>{firstName}.</em>
              </h2>
              <p>Here&apos;s what&apos;s happening across your workspace.</p>
            </div>
            <Link href="/projects/new" className="app-primary-action">
              <Plus size={15} />
              New project
            </Link>
          </section>

          {error && (
            <div
              className="data-notice"
              style={{ borderColor: '#c9472d', background: '#f7e7e1', color: '#6e3024' }}
            >
              <CircleAlert size={16} />
              <span>
                <strong>Unable to load dashboard data:</strong> {error}
              </span>
              <button
                onClick={fetchStats}
                style={{
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#6e3024',
                }}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="app-empty" style={{ minHeight: '200px' }}>
              <LoaderCircle size={24} className="animate-spin text-accent" />
              <p>Loading your workspace overview...</p>
            </div>
          ) : (
            <>
              <section className="metric-grid" aria-label="Workspace metrics">
                <Link href="/projects" className="metric-card">
                  <span>PROJECTS</span>
                  <strong>{stats ? stats.projects.total : '—'}</strong>
                  <small>
                    {stats && stats.projects.total > 0
                      ? `${stats.projects.active} active · ${stats.projects.completed} completed`
                      : 'No projects yet'}
                  </small>
                </Link>

                <Link href="/tasks" className="metric-card">
                  <span>OPEN TASKS</span>
                  <strong>{stats ? openTasksCount : '—'}</strong>
                  <small>
                    {stats && stats.tasks.overdue > 0
                      ? `${stats.tasks.overdue} overdue tasks`
                      : stats && stats.tasks.total > 0
                        ? `${stats.tasks.completed} completed`
                        : 'No tasks yet'}
                  </small>
                </Link>

                <Link href="/notes" className="metric-card">
                  <span>NOTES</span>
                  <strong>{stats ? stats.notes.total : '—'}</strong>
                  <small>
                    {stats && stats.notes.total > 0
                      ? `${stats.notes.pinned} pinned to top`
                      : 'No notes yet'}
                  </small>
                </Link>

                <Link href="/finances" className="metric-card metric-card-accent">
                  <span>MONTHLY BALANCE</span>
                  <strong>
                    {stats
                      ? `$${stats.finances.netBalance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : '—'}
                  </strong>
                  <small>
                    {stats && (stats.finances.totalIncome > 0 || stats.finances.totalExpense > 0)
                      ? `In: $${stats.finances.totalIncome.toFixed(0)} · Out: $${stats.finances.totalExpense.toFixed(0)}`
                      : 'No transactions yet'}
                  </small>
                </Link>
              </section>

              <div className="app-grid-main">
                <DashboardSection
                  title="Your projects"
                  eyebrow="PROJECTS"
                  href="/projects"
                  action="New project"
                >
                  {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {stats.recentProjects.map((proj) => (
                        <div
                          key={proj._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 0',
                            borderBottom: '1px solid #d0d1cc',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <Link
                              href={`/projects/${proj._id}`}
                              style={{ fontWeight: 700, color: '#202321' }}
                            >
                              {proj.title}
                            </Link>
                            <small
                              style={{
                                display: 'block',
                                color: '#777b74',
                                fontSize: '10px',
                                marginTop: '3px',
                              }}
                            >
                              Deadline: {new Date(proj.deadline).toLocaleDateString()}
                            </small>
                          </div>
                          <span
                            className="status-badge"
                            style={{
                              textTransform: 'uppercase',
                              fontSize: '9px',
                              border: '1px solid #c7c8c0',
                              padding: '3px 6px',
                            }}
                          >
                            {proj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Your workspace starts with a project."
                      text="Create your first project to organize related tasks and work."
                      href="/projects/new"
                      action="Create project"
                    />
                  )}
                </DashboardSection>

                <DashboardSection
                  title="Tasks"
                  eyebrow="NEXT UP"
                  href="/tasks"
                  action="New task"
                >
                  {stats?.upcomingTasks && stats.upcomingTasks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {stats.upcomingTasks.map((t) => (
                        <div
                          key={t._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            borderBottom: '1px solid #d0d1cc',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <Link
                              href={`/tasks/${t._id}`}
                              style={{ fontWeight: 600, color: '#202321' }}
                            >
                              {t.title}
                            </Link>
                            {t.project && (
                              <small
                                style={{
                                  display: 'block',
                                  color: '#777b74',
                                  fontSize: '10px',
                                  marginTop: '2px',
                                }}
                              >
                                {typeof t.project === 'object' ? t.project.title : 'Project Task'}
                              </small>
                            )}
                          </div>
                          <span
                            style={{
                              fontSize: '9px',
                              textTransform: 'uppercase',
                              color: t.priority === 'high' ? 'var(--accent)' : '#777b74',
                              fontWeight: t.priority === 'high' ? 700 : 400,
                            }}
                          >
                            {t.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="A clear list starts here."
                      text="Add a task when there is something you want to move forward."
                      href="/tasks/new"
                      action="Create task"
                    />
                  )}
                </DashboardSection>
              </div>

              <div className="app-grid-secondary">
                <DashboardSection
                  title="Upcoming deadlines"
                  eyebrow="KEEP MOVING"
                  href="/tasks"
                >
                  {upcomingDeadlines.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {upcomingDeadlines.map((t) => (
                        <div
                          key={t._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            borderBottom: '1px solid #d0d1cc',
                            fontSize: '11px',
                          }}
                        >
                          <div>
                            <Link
                              href={`/tasks/${t._id}`}
                              style={{ fontWeight: 600, color: '#202321' }}
                            >
                              {t.title}
                            </Link>
                          </div>
                          <span style={{ fontSize: '10px', color: '#777b74' }}>
                            {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No deadlines to show."
                      text="Deadlines from your projects and tasks will appear here."
                      href="/tasks"
                      action="View tasks"
                    />
                  )}
                </DashboardSection>

                <DashboardSection
                  title="Pinned notes"
                  eyebrow="THOUGHTS, KEPT CLOSE"
                  href="/notes"
                  action="New note"
                >
                  {pinnedNotes.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {pinnedNotes.map((n) => (
                        <div
                          key={n._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 0',
                            borderBottom: '1px solid #d0d1cc',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Pin size={11} className="text-accent fill-current" />
                            <Link
                              href={`/notes/${n._id}`}
                              style={{ fontWeight: 600, color: '#202321' }}
                            >
                              {n.title}
                            </Link>
                          </div>
                          <span style={{ fontSize: '10px', color: '#858981' }}>
                            {new Date(n.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Nothing pinned yet."
                      text="Pin a note to keep an idea close to the work it supports."
                      href="/notes/new"
                      action="Create note"
                    />
                  )}
                </DashboardSection>
              </div>

              <DashboardSection
                title="Financial overview"
                eyebrow="THIS MONTH"
                href="/finances"
              >
                <div className="finance-empty">
                  <div className="finance-placeholder">
                    <span>Total income</span>
                    <strong>
                      $
                      {(stats?.finances.totalIncome || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <div className="finance-placeholder">
                    <span>Total expenses</span>
                    <strong>
                      $
                      {(stats?.finances.totalExpense || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>
                  <div className="finance-placeholder finance-net">
                    <span>Net balance</span>
                    <strong>
                      $
                      {(stats?.finances.netBalance || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </strong>
                  </div>

                  {stats &&
                  stats.finances.totalIncome === 0 &&
                  stats.finances.totalExpense === 0 ? (
                    <div className="finance-empty-copy">
                      <CircleDollarSign size={18} />
                      <div>
                        <strong>Your financial overview will live here.</strong>
                        <p>Add transactions to see income, expenses, and monthly balance.</p>
                      </div>
                      <Link href="/finances/transactions/new">
                        Add transaction
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  ) : (
                    <div className="finance-empty-copy">
                      <CircleDollarSign size={18} />
                      <div>
                        <strong>Detailed financial analytics are active.</strong>
                        <p>View categorized spending breakdown and all transaction activity.</p>
                      </div>
                      <Link href="/finances">
                        View finances
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              </DashboardSection>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 WorkFlowX</span>
          <span>A considered workspace for everyday work.</span>
        </footer>
      </main>
    </div>
  )
}
