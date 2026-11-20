'use client'

import Link from 'next/link'
import {
  CheckSquare,
  CircleAlert,
  FolderKanban,
  LayoutDashboard,
  NotebookPen,
  CircleDollarSign,
  Search,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Trash2,
  Calendar,
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { tasksApi } from '@/lib/api/tasks'
import { projectsApi } from '@/lib/api/projects'
import type { TaskEntity, ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskEntity[]>([])
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [priority, setPriority] = useState('All priorities')
  const [selectedProject, setSelectedProject] = useState('All projects')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const fetchTasksAndProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [tasksRes, projsRes] = await Promise.all([
        tasksApi.getAll(),
        projectsApi.getAll().catch(() => ({ status: 'success' as const, projects: [], pagination: { totalPages: 0, currentPage: 1, limit: 10 } })),
      ])
      setTasks(tasksRes.tasks || [])
      setProjects(projsRes.projects || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load tasks.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasksAndProjects()
  }, [fetchTasksAndProjects])

  const toggleTaskStatus = async (task: TaskEntity, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    setUpdatingTaskId(task._id)
    try {
      const res = await tasksApi.update(task._id, { status: newStatus })
      setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data.task : t)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task status.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Delete this task?')) return
    setDeletingId(id)
    try {
      await tasksApi.delete(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task.')
    } finally {
      setDeletingId(null)
    }
  }

  const hasFilters =
    query.length > 0 ||
    status !== 'All statuses' ||
    priority !== 'All priorities' ||
    selectedProject !== 'All projects'

  const clearFilters = () => {
    setQuery('')
    setStatus('All statuses')
    setPriority('All priorities')
    setSelectedProject('All projects')
  }

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (status !== 'All statuses') {
        const mappedStatus = status === 'To do' ? 'todo' : status === 'In progress' ? 'in_progress' : 'completed'
        if (task.status !== mappedStatus) return false
      }
      // Priority filter
      if (priority !== 'All priorities') {
        if (task.priority.toLowerCase() !== priority.toLowerCase()) return false
      }
      // Project filter
      if (selectedProject !== 'All projects') {
        const taskProjId = task.project && typeof task.project === 'object' ? task.project._id : task.project
        if (taskProjId !== selectedProject) return false
      }
      // Search query
      if (query.trim()) {
        const q = query.toLowerCase()
        const matchTitle = task.title.toLowerCase().includes(q)
        const matchDesc = task.description ? task.description.toLowerCase().includes(q) : false
        if (!matchTitle && !matchDesc) return false
      }
      return true
    })
  }, [tasks, status, priority, selectedProject, query])

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
    }
  }, [tasks])

  const isOverdue = (dueDate?: string, taskStatus?: string) => {
    if (!dueDate || taskStatus === 'completed') return false
    const due = new Date(dueDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return due < now
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar tasks-sidebar">
        <div className="app-sidebar-top">
          <Link href="/" className="app-wordmark">WorkFlow<span>X</span></Link>
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
              className={label === 'Tasks' ? 'active' : ''}
            >
              <Icon size={16} strokeWidth={1.7} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="app-nav-label app-nav-label-personal">Personal</p>
        <nav className="app-nav" aria-label="Personal navigation">
          <Link href="/settings/profile">Settings</Link>
          <Link href="/settings/security">Security</Link>
        </nav>
        <div className="app-sidebar-bottom">
          <SignOutButton />
          <span>PRIVATE BY DESIGN.</span>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">WORKSPACE / TASKS</p>
            <h1>Tasks</h1>
            <p>Keep your work moving, one task at a time.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
          </div>
        </header>

        <div className="app-content tasks-content">
          <section className="welcome-block tasks-welcome">
            <div>
              <p className="app-eyebrow">YOUR WORK</p>
              <h2>Move work <em>forward.</em></h2>
              <p>One clear next step is often enough.</p>
            </div>
            <Link className="app-primary-action" href="/tasks/new">
              <Plus size={15} />New task
            </Link>
          </section>

          <section className="metric-grid task-metrics" aria-label="Task summary">
            <div className="metric-card">
              <span>ALL TASKS</span>
              <strong>{counts.total}</strong>
              <small>Across your workspace</small>
            </div>
            <div className="metric-card">
              <span>TO DO</span>
              <strong>{counts.todo}</strong>
              <small>Awaiting attention</small>
            </div>
            <div className="metric-card">
              <span>IN PROGRESS</span>
              <strong>{counts.in_progress}</strong>
              <small>Currently moving</small>
            </div>
            <div className="metric-card metric-card-accent">
              <span>COMPLETED</span>
              <strong>{counts.completed}</strong>
              <small>Done</small>
            </div>
          </section>

          <section className="task-toolbar" aria-label="Task filters">
            <label className="task-search">
              <Search size={15} />
              <span className="sr-only">Search tasks</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks..."
                aria-label="Search tasks"
              />
            </label>

            <div className="task-selects">
              <label>
                Status
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option>All statuses</option>
                  <option>To do</option>
                  <option>In progress</option>
                  <option>Completed</option>
                </select>
              </label>

              <label>
                Priority
                <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option>All priorities</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              {projects.length > 0 && (
                <label>
                  Project
                  <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                    <option>All projects</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {hasFilters && (
              <button className="task-clear" type="button" onClick={clearFilters}>
                <RefreshCw size={13} />Clear filters
              </button>
            )}
          </section>

          <section className="app-section task-list-section">
            <div className="app-section-head">
              <div>
                <p className="app-eyebrow">WORK QUEUE</p>
                <h2>All tasks</h2>
              </div>
              <div className="app-section-actions">
                <span className="task-result-count">{filtered.length} tasks</span>
                <SlidersHorizontal size={15} />
              </div>
            </div>

            {loading ? (
              <div className="task-empty" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)' }} />
                <strong>Loading tasks…</strong>
              </div>
            ) : error ? (
              <div className="task-empty" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <AlertCircle size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <strong>Failed to load tasks</strong>
                  <p>{error}</p>
                  <button className="app-secondary-action" onClick={fetchTasksAndProjects} style={{ marginTop: '10px' }}>
                    Retry
                  </button>
                </div>
              </div>
            ) : filtered.length ? (
              <div style={{ padding: '8px 16px' }}>
                {filtered.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status)
                  const projectName =
                    task.project && typeof task.project === 'object'
                      ? task.project.title
                      : null

                  return (
                    <article
                      key={task._id}
                      className="task-row"
                      style={{
                        padding: '14px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderTop: '1px solid #d1d2cd',
                      }}
                    >
                      <button
                        type="button"
                        className={`task-check ${task.status === 'completed' ? 'task-check-filled' : ''}`}
                        onClick={(e) => toggleTaskStatus(task, e)}
                        disabled={updatingTaskId === task._id}
                        aria-label={`Mark task ${task.title} as ${task.status === 'completed' ? 'to do' : 'completed'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {task.status === 'completed' ? '✓' : ''}
                      </button>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <Link
                            href={`/tasks/${task._id}`}
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#30352f',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              opacity: task.status === 'completed' ? 0.65 : 1,
                            }}
                          >
                            {task.title}
                          </Link>

                          <span className={`status-badge status-${task.status.toLowerCase()}`}>
                            {task.status === 'in_progress' ? 'In progress' : task.status === 'completed' ? 'Completed' : 'To do'}
                          </span>

                          <span className="status-badge status-neutral">
                            {task.priority.toUpperCase()}
                          </span>

                          {projectName && (
                            <span style={{ fontSize: '10px', color: 'var(--accent)' }}>
                              • {projectName}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p style={{ fontSize: '11px', color: '#777b74', margin: '4px 0 0' }}>
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {task.dueDate && (
                          <span
                            className="task-date"
                            style={{
                              color: overdue ? '#c9472d' : '#8c918d',
                              fontWeight: overdue ? 700 : 400,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Calendar size={12} />
                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {overdue && ' (Overdue)'}
                          </span>
                        )}

                        <Link href={`/tasks/${task._id}`} style={{ color: '#30352f', fontSize: '11px', fontWeight: 600 }}>
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(task._id, e)}
                          disabled={deletingId === task._id}
                          aria-label={`Delete task ${task.title}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#8c918d',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="task-empty">
                <div className="task-empty-icon">
                  <CircleAlert size={19} />
                </div>
                <div>
                  <strong>{tasks.length ? 'No tasks match your filters.' : 'No tasks yet'}</strong>
                  <p>
                    {tasks.length
                      ? 'Adjust your search or clear the filters to see more tasks.'
                      : 'Create your first task to start organizing your work.'}
                  </p>
                  {tasks.length ? (
                    <button className="app-inline-action" type="button" onClick={clearFilters}>
                      Clear filters
                    </button>
                  ) : (
                    <Link className="app-inline-action" href="/tasks/new">
                      Create task
                    </Link>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
