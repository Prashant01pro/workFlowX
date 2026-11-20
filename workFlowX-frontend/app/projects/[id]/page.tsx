'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Plus,
  CircleDollarSign,
  Settings,
  Pencil,
  Trash2,
  LoaderCircle,
  AlertCircle,
} from 'lucide-react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { projectsApi } from '@/lib/api/projects'
import { tasksApi } from '@/lib/api/tasks'
import { notesApi } from '@/lib/api/notes'
import type { ProjectEntity, TaskEntity, NoteEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params?.id

  const [project, setProject] = useState<ProjectEntity | null>(null)
  const [tasks, setTasks] = useState<TaskEntity[]>([])
  const [notes, setNotes] = useState<NoteEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const loadProjectData = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      const [projRes, tasksRes, notesRes] = await Promise.all([
        projectsApi.getById(projectId),
        tasksApi.getAll({ project: projectId }).catch(() => ({ status: 'success' as const, tasks: [], pagination: { totalPages: 0, currentPage: 1, limit: 10 } })),
        notesApi.getAll({ project: projectId }).catch(() => ({ status: 'success' as const, notes: [], pagination: { totalPages: 0, currentPage: 1, limit: 10 } })),
      ])
      setProject(projRes.data.project)
      setTasks(tasksRes.tasks || [])
      setNotes(notesRes.notes || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load project.')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadProjectData()
  }, [loadProjectData])

  const handleDelete = async () => {
    if (!projectId) return
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) return
    setDeleting(true)
    try {
      await projectsApi.delete(projectId)
      router.push('/projects')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project.')
      setDeleting(false)
    }
  }

  const stack = [
    ...(project?.techStack || []),
    ...(project?.nonTechStack || []),
  ].join(', ')

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${menuOpen ? 'app-sidebar-open' : ''}`}>
        <div className="app-sidebar-top">
          <Link href="/" className="app-wordmark">WorkFlow<span>X</span></Link>
          <button type="button" className="app-close" onClick={() => setMenuOpen(false)} aria-label="Close navigation">
            ×
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
              className={label === 'Projects' ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={16} strokeWidth={1.7} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="app-nav-label app-nav-label-personal">Personal</p>
        <nav className="app-nav" aria-label="Personal navigation">
          <Link href="/settings/profile" onClick={() => setMenuOpen(false)}>
            <Settings size={16} strokeWidth={1.7} />Settings
          </Link>
        </nav>
        <div className="app-sidebar-bottom">
          <SignOutButton onClick={() => setMenuOpen(false)} />
          <span>PRIVATE BY DESIGN.</span>
        </div>
      </aside>

      <button
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
            <p className="app-eyebrow">PROJECTS / DETAILS</p>
            <h1>{project?.title || 'Project details'}</h1>
            <p>One focused view for the work that matters.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
            <div>
              <strong>{name}</strong>
              <small>Personal workspace</small>
            </div>
          </div>
        </header>

        <div className="app-content project-detail-content">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/projects">Projects</Link>
            <span>/</span>
            <span>{project?.title || 'Project details'}</span>
          </nav>

          {loading ? (
            <div className="app-section project-empty" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)' }} />
              <strong>Loading project details…</strong>
            </div>
          ) : error || !project ? (
            <div className="app-section project-empty" style={{ textAlign: 'center' }}>
              <AlertCircle size={24} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
              <strong>We could not load this project.</strong>
              <p>{error || 'Project not found.'}</p>
              <Link className="app-secondary-action" href="/projects" style={{ marginTop: '12px' }}>
                Back to projects
              </Link>
            </div>
          ) : (
            <>
              <section className="detail-hero">
                <div>
                  <p className="app-eyebrow">PROJECT OVERVIEW</p>
                  <h2>{project.title}</h2>
                  <p className="detail-lede">{project.description}</p>
                </div>
                <div className="detail-actions">
                  <Link className="app-primary-action" href="/projects">
                    <ArrowLeft size={15} />Back to projects
                  </Link>
                  <Link className="app-inline-action" href={`/projects/${project._id}/edit`}>
                    <Pencil size={14} />Edit project
                  </Link>
                  <button
                    type="button"
                    className="app-secondary-action"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ color: '#c9472d', borderColor: '#c9472d' }}
                  >
                    <Trash2 size={14} />
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </section>

              <section className="detail-overview app-section">
                <div className="app-section-head">
                  <div>
                    <p className="app-eyebrow">PROJECT</p>
                    <h2>Project information</h2>
                  </div>
                  <span className={`status-badge status-${project.status.toLowerCase()}`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
                <div style={{ padding: '24px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>DEADLINE</small>
                    <strong style={{ fontSize: '14px' }}>
                      {new Date(project.deadline).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                  </div>
                  {stack && (
                    <div>
                      <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>STACK & SKILLS</small>
                      <strong style={{ fontSize: '13px' }}>{stack}</strong>
                    </div>
                  )}
                  <div>
                    <small style={{ color: '#858981', display: 'block', fontSize: '10px' }}>CREATED</small>
                    <strong style={{ fontSize: '13px' }}>
                      {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </strong>
                  </div>
                </div>
              </section>

              <div className="detail-related-grid">
                <section className="app-section">
                  <div className="app-section-head">
                    <div>
                      <p className="app-eyebrow">RELATED WORK</p>
                      <h2>Project tasks ({tasks.length})</h2>
                    </div>
                    <div className="app-section-actions">
                      <Link href="/tasks" className="app-view-link">View all<ArrowUpRight size={13} /></Link>
                      <Link href={`/tasks/new?projectId=${project._id}`} className="app-small-action">
                        <Plus size={14} />Create
                      </Link>
                    </div>
                  </div>
                  {tasks.length > 0 ? (
                    <div style={{ padding: '15px' }}>
                      {tasks.map((task) => (
                        <div key={task._id} className="task-row">
                          <span className={`task-check ${task.status === 'completed' ? 'task-check-filled' : ''}`}>
                            {task.status === 'completed' ? '✓' : ''}
                          </span>
                          <Link href={`/tasks/${task._id}`} style={{ color: 'inherit', fontWeight: 600 }}>
                            {task.title}
                          </Link>
                          <span className="task-date">{task.priority.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-empty">
                      <span className="empty-rule" />
                      <strong>No project tasks yet.</strong>
                      <p>Tasks connected to this project will appear here.</p>
                      <Link className="app-inline-action" href={`/tasks/new?projectId=${project._id}`}>
                        <Plus size={14} />Create task
                      </Link>
                    </div>
                  )}
                </section>

                <section className="app-section">
                  <div className="app-section-head">
                    <div>
                      <p className="app-eyebrow">PROJECT MEMORY</p>
                      <h2>Project notes ({notes.length})</h2>
                    </div>
                    <div className="app-section-actions">
                      <Link href="/notes" className="app-view-link">View all<ArrowUpRight size={13} /></Link>
                      <Link href={`/notes/new?projectId=${project._id}`} className="app-small-action">
                        <Plus size={14} />Create
                      </Link>
                    </div>
                  </div>
                  {notes.length > 0 ? (
                    <div style={{ padding: '15px' }}>
                      {notes.map((note) => (
                        <div key={note._id} style={{ padding: '10px 0', borderTop: '1px solid #d1d2cd' }}>
                          <Link href={`/notes/${note._id}`} style={{ fontWeight: 600, color: 'inherit' }}>
                            {note.title}
                          </Link>
                          <p style={{ fontSize: '11px', color: '#777b74', margin: '4px 0 0' }}>
                            {note.content.slice(0, 90)}…
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-empty">
                      <span className="empty-rule" />
                      <strong>No project notes yet.</strong>
                      <p>Notes connected to this project will appear here.</p>
                      <Link className="app-inline-action" href={`/notes/new?projectId=${project._id}`}>
                        <Plus size={14} />Create note
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
