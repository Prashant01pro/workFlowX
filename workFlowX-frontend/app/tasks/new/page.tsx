'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState, Suspense } from 'react'
import { Plus, CircleAlert, LoaderCircle } from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks'
import { projectsApi } from '@/lib/api/projects'
import type { ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

function NewTaskContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialProjectId = searchParams.get('projectId') || ''

  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [due, setDue] = useState('')
  const [project, setProject] = useState(initialProjectId)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  useEffect(() => {
    projectsApi
      .getAll()
      .then((res) => {
        setProjects(res.projects || [])
      })
      .catch(() => {
        // standalone tasks remain available even without projects
      })
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    if (!title.trim()) {
      setError('Add a task title before creating the task.')
      return
    }
    if (title.trim().length < 2) {
      setError('Task title must be at least 2 characters.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await tasksApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: due ? new Date(due).toISOString() : undefined,
        project: project && project !== 'no-project' ? project : null,
      })
      router.push('/tasks')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create task.')
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
            <p className="app-eyebrow">TASKS / CREATE</p>
            <h1>Create task</h1>
            <p>Turn your next step into something actionable.</p>
          </div>
        </header>

        <div className="app-content task-form-content">
          <nav className="detail-breadcrumbs">
            <Link href="/tasks">Tasks</Link>
            <span>/</span>
            <span>Create task</span>
          </nav>

          <div className="task-form-layout">
            <section className="app-section">
              <div className="app-section-head">
                <div>
                  <p className="app-eyebrow">NEW WORK</p>
                  <h2>Create a new task</h2>
                </div>
              </div>

              <form className="form-fields task-form" onSubmit={submit} noValidate>
                <div className="field-group">
                  <label htmlFor="title">
                    Task title <span className="required">REQUIRED</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to get done?"
                    disabled={saving}
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="description">
                    Description <small>Optional</small>
                  </label>
                  <textarea
                    id="description"
                    name="description"
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
                      name="priority"
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
                      name="due"
                      type="date"
                      value={due}
                      onChange={(e) => setDue(e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="project">Project</label>
                  <select
                    id="project"
                    name="project"
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

                {error && (
                  <p id="task-error" className="form-error" role="alert">
                    <CircleAlert size={14} />
                    {error}
                  </p>
                )}

                <div className="form-actions">
                  <Link href="/tasks" className="app-secondary-action">
                    Cancel
                  </Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoaderCircle className="spin" size={14} /> Creating…
                      </>
                    ) : (
                      <>
                        <Plus size={15} />Create task
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <aside className="form-tip">
              <p className="app-eyebrow">ONE CLEAR STEP</p>
              <h2>Make progress visible.</h2>
              <p>Tasks work best when they describe the next concrete action, not the whole project.</p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>}>
      <NewTaskContent />
    </Suspense>
  )
}
