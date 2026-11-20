'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  CircleAlert,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks'
import type { TaskEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const taskId = params?.id
  const { user } = useAuth()

  const [task, setTask] = useState<TaskEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const fetchTask = useCallback(async () => {
    if (!taskId) return
    setLoading(true)
    setError('')
    try {
      const res = await tasksApi.getById(taskId)
      setTask(res.data.task)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load task details.')
      }
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  const handleDelete = async () => {
    if (!taskId || deleting) return
    if (!window.confirm('Are you sure you want to delete this task?')) return
    setDeleting(true)
    try {
      await tasksApi.delete(taskId)
      router.push('/tasks')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task.')
      setDeleting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!task) return
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed'
    try {
      const res = await tasksApi.update(task._id, { status: nextStatus })
      setTask(res.data.task)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task.')
    }
  }

  const isOverdue = (dueDate?: string, taskStatus?: string) => {
    if (!dueDate || taskStatus === 'completed') return false
    const due = new Date(dueDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return due < now
  }

  const overdue = task ? isOverdue(task.dueDate, task.status) : false
  const projectObj = task?.project && typeof task.project === 'object' ? task.project : null

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
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
        <nav className="app-nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/tasks" className="active">Tasks</Link>
          <Link href="/notes">Notes</Link>
          <Link href="/finances">Finances</Link>
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">TASKS / DETAILS</p>
            <h1>{task?.title || 'Task details'}</h1>
            <p>One focused view for your next step.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
          </div>
        </header>

        <div className="app-content task-detail-content">
          <nav className="detail-breadcrumbs">
            <Link href="/tasks">Tasks</Link>
            <span>/</span>
            <span>{task?.title || 'Task details'}</span>
          </nav>

          {loading ? (
            <div className="app-section task-detail-card" style={{ textAlign: 'center', padding: '40px' }}>
              <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
              <strong>Loading task…</strong>
            </div>
          ) : error || !task ? (
            <section className="app-section task-detail-card">
              <div className="detail-overview-empty">
                <div className="detail-placeholder-icon">
                  <CircleAlert size={19} />
                </div>
                <div>
                  <strong>Task not found</strong>
                  <p>{error || 'This task does not exist or does not belong to your account.'}</p>
                  <Link className="app-inline-action" href="/tasks">
                    Back to tasks
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="detail-hero">
                <div>
                  <p className="app-eyebrow">TASK OVERVIEW</p>
                  <h2>{task.title}</h2>
                  <p className="detail-lede">
                    {task.description || 'No description provided for this task.'}
                  </p>
                </div>

                <div className="detail-actions">
                  <Link className="app-primary-action" href="/tasks">
                    <ArrowLeft size={15} />Back to tasks
                  </Link>
                  <div className="detail-action-wrap">
                    <button
                      className="detail-more"
                      type="button"
                      aria-label="Task actions"
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuOpen && (
                      <div className="detail-action-menu">
                        <Link className="app-inline-action" href={`/tasks/${task._id}/edit`}>
                          <Pencil size={14} />Edit task
                        </Link>
                        <button
                          type="button"
                          className="app-inline-action"
                          onClick={handleDelete}
                          disabled={deleting}
                          style={{ color: '#c9472d', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 12px', textAlign: 'left' }}
                        >
                          <Trash2 size={14} />Delete task
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="app-section task-detail-card">
                <div className="app-section-head">
                  <div>
                    <p className="app-eyebrow">TASK STATUS & DETAILS</p>
                    <h2>Properties</h2>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className={`status-badge status-${task.status.toLowerCase()}`}>
                      {task.status === 'in_progress' ? 'In progress' : task.status === 'completed' ? 'Completed' : 'To do'}
                    </span>
                    <span className="status-badge status-neutral">
                      {task.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>

                <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>STATUS</small>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      className="app-secondary-action"
                      style={{ marginTop: '6px', height: '32px', fontSize: '11px' }}
                    >
                      <CheckSquare size={13} />
                      {task.status === 'completed' ? 'Mark as to do' : 'Mark as completed'}
                    </button>
                  </div>

                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>DUE DATE</small>
                    {task.dueDate ? (
                      <strong
                        style={{
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: overdue ? '#c9472d' : 'inherit',
                          marginTop: '6px',
                        }}
                      >
                        <Calendar size={14} />
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {overdue && ' (Overdue)'}
                      </strong>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#858981', marginTop: '6px', display: 'inline-block' }}>
                        No due date
                      </span>
                    )}
                  </div>

                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>PROJECT</small>
                    {projectObj ? (
                      <Link
                        href={`/projects/${projectObj._id}`}
                        style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginTop: '6px', display: 'inline-block' }}
                      >
                        {projectObj.title}
                      </Link>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#858981', marginTop: '6px', display: 'inline-block' }}>
                        Standalone task
                      </span>
                    )}
                  </div>

                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>CREATED</small>
                    <strong style={{ fontSize: '13px', marginTop: '6px', display: 'inline-block' }}>
                      {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
