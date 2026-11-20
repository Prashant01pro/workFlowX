'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { CircleAlert, Save, LoaderCircle } from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks'
import { projectsApi } from '@/lib/api/projects'
import type { ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function EditTaskPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const taskId = params?.id
  const { user } = useAuth()

  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'completed'>('todo')
  const [due, setDue] = useState('')
  const [project, setProject] = useState('no-project')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    Promise.all([
      tasksApi.getById(taskId),
      projectsApi.getAll().catch(() => ({ status: 'success' as const, projects: [], pagination: { totalPages: 0, currentPage: 1, limit: 10 } })),
    ])
      .then(([taskRes, projsRes]) => {
        const t = taskRes.data.task
        setTitle(t.title)
        setDescription(t.description || '')
        setPriority(t.priority)
        setStatus(t.status)
        if (t.dueDate) {
          setDue(new Date(t.dueDate).toISOString().split('T')[0])
        }
        if (t.project) {
          const pId = typeof t.project === 'object' ? t.project._id : t.project
          setProject(pId)
        } else {
          setProject('no-project')
        }
        setProjects(projsRes.projects || [])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load task details.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [taskId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!taskId || saving) return

    if (!title.trim()) {
      setError('Task title is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await tasksApi.update(taskId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: due ? new Date(due).toISOString() : null,
        project: project && project !== 'no-project' ? project : null,
      })
      router.push(`/tasks/${taskId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update task.')
      }
    } finally {
      setSaving(false)
    }
  }

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
            <p className="app-eyebrow">TASKS / EDIT</p>
            <h1>Edit task</h1>
            <p>Update the details and keep your work on track.</p>
          </div>
        </header>

        <div className="app-content task-form-content">
          <nav className="detail-breadcrumbs">
            <Link href="/tasks">Tasks</Link>
            <span>/</span>
            <Link href={`/tasks/${taskId}`}>{title || 'Task details'}</Link>
            <span>/</span>
            <span>Edit</span>
          </nav>

          <div className="task-form-layout">
            <section className="app-section">
              <div className="app-section-head">
                <div>
                  <p className="app-eyebrow">TASK DETAILS</p>
                  <h2>Edit task</h2>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
                  <strong>Loading task…</strong>
                </div>
              ) : (
                <form className="form-fields task-form" onSubmit={submit} noValidate>
                  <div className="field-group">
                    <label htmlFor="title">
                      Task title <span className="required">REQUIRED</span>
                    </label>
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a little context..."
                      rows={4}
                      disabled={saving}
                    />
                  </div>

                  <div className="form-two-col">
                    <div className="field-group">
                      <label htmlFor="priority">Priority</label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                        disabled={saving}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor="due">Due date</label>
                      <input
                        id="due"
                        type="date"
                        value={due}
                        onChange={(e) => setDue(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="form-two-col">
                    <div className="field-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'completed')}
                        disabled={saving}
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="field-group">
                      <label htmlFor="project">Project</label>
                      <select
                        id="project"
                        value={project}
                        onChange={(e) => setProject(e.target.value)}
                        disabled={saving}
                      >
                        <option value="no-project">No project (Standalone)</option>
                        {projects.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {error && (
                    <p className="form-error" role="alert">
                      <CircleAlert size={14} />
                      {error}
                    </p>
                  )}

                  <div className="form-actions">
                    <Link href={`/tasks/${taskId}`} className="app-secondary-action">
                      Cancel
                    </Link>
                    <button className="app-primary-action" type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <LoaderCircle className="spin" size={14} /> Saving…
                        </>
                      ) : (
                        <>
                          <Save size={15} />Save changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </section>

            <aside className="form-tip">
              <p className="app-eyebrow">TASK DATA</p>
              <h2>Nothing gets overwritten.</h2>
              <p>Keep your next concrete action up to date so your team or workflow knows what comes next.</p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
