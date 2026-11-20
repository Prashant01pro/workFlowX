'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  CircleAlert,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  NotebookPen,
  Save,
  CheckSquare,
} from 'lucide-react'
import { notesApi } from '@/lib/api/notes'
import { projectsApi } from '@/lib/api/projects'
import type { NoteEntity, ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { SignOutButton } from '@/components/signout-button'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

export default function EditNotePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const noteId = params?.id
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [projectId, setProjectId] = useState<string>('')
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const loadData = useCallback(async () => {
    if (!noteId) return
    setLoading(true)
    setError('')
    try {
      const [noteRes, projectsRes] = await Promise.all([
        notesApi.getById(noteId),
        projectsApi.getAll({ limit: 100 }).catch(() => ({ projects: [] as ProjectEntity[] })),
      ])
      const note = noteRes.data.note
      setTitle(note.title || '')
      setContent(note.content || '')
      setIsPinned(Boolean(note.isPinned))
      if (note.project) {
        const pId = typeof note.project === 'object' ? (note.project as any)._id : note.project
        setProjectId(pId || '')
      }
      setProjects(projectsRes.projects || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load note.')
      }
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving || !noteId) return

    if (!title.trim()) {
      setError('Add a title before saving your note.')
      return
    }
    if (title.trim().length < 2) {
      setError('Note title must be at least 2 characters.')
      return
    }
    if (title.trim().length > 100) {
      setError('Note title cannot exceed 100 characters.')
      return
    }
    if (!content.trim()) {
      setError('Note content cannot be empty.')
      return
    }
    if (content.trim().length > 5000) {
      setError('Note content cannot exceed 5000 characters.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await notesApi.update(noteId, {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        project: projectId || null,
      })
      router.push(`/notes/${noteId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update note.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-top">
          <Link href="/" className="app-wordmark">
            WorkFlow<span>X</span>
          </Link>
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
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/notes'
            return (
              <Link key={item.href} href={item.href} className={active ? 'active' : ''}>
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="app-sidebar-bottom">
          <SignOutButton />
          <span>PRIVATE BY DESIGN.</span>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">WORKSPACE / NOTES / EDIT</p>
            <h1>Edit note</h1>
            <p>Refine an existing note without losing your place.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content note-form-content">
          <div className="detail-breadcrumbs">
            <Link href="/notes">Notes</Link>
            <span>/</span>
            <Link href={`/notes/${noteId}`}>Note {noteId}</Link>
            <span>/</span>
            <span>Edit</span>
          </div>

          {loading ? (
            <div className="detail-overview-empty app-section" role="status">
              <LoaderCircle size={24} className="animate-spin text-accent" />
              <p>Loading note...</p>
            </div>
          ) : (
            <form className="app-section note-form" onSubmit={submit} noValidate>
              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="edit-note-title">Title</label>
                  <input
                    id="edit-note-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Enter note title"
                    required
                  />
                </div>

                <div className="field-group">
                  <label htmlFor="edit-note-project">Associated Project (optional)</label>
                  <select
                    id="edit-note-project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    style={{
                      height: '40px',
                      background: '#f0eee8',
                      border: '1px solid #bfc0b9',
                      padding: '0 12px',
                      fontSize: '11px',
                      color: '#202321',
                      width: '100%',
                    }}
                  >
                    <option value="">None (Standalone note)</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11px', color: '#202321' }}>Pin this note to the top of your workspace</span>
                  </label>
                </div>

                <div className="field-group note-content-field">
                  <label htmlFor="edit-note-content">Content</label>
                  <textarea
                    id="edit-note-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Write your note here..."
                    required
                  />
                  <small style={{ color: '#858981', fontSize: '10px' }}>
                    {content.length}/5000 characters
                  </small>
                </div>

                {error && (
                  <p className="form-error" role="alert" style={{ color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CircleAlert size={14} />
                    {error}
                  </p>
                )}

                <div className="form-actions">
                  <Link href={`/notes/${noteId}`} className="app-secondary-action">
                    <ArrowLeft size={14} />
                    Cancel
                  </Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
