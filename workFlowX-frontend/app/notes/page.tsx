'use client'

import Link from 'next/link'
import {
  CircleAlert,
  FolderKanban,
  LayoutDashboard,
  NotebookPen,
  Plus,
  Search,
  CheckSquare,
  CircleDollarSign,
  Pin,
  Trash2,
  LoaderCircle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { notesApi } from '@/lib/api/notes'
import type { NoteEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<NoteEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'archived'>('all')
  const [togglingPinId, setTogglingPinId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await notesApi.getAll()
      setNotes(res.notes || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load notes.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const togglePin = async (note: NoteEntity, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setTogglingPinId(note._id)
    try {
      const res = await notesApi.update(note._id, { isPinned: !note.isPinned })
      setNotes((prev) => prev.map((n) => (n._id === note._id ? res.data.note : n)))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update note pin.')
    } finally {
      setTogglingPinId(null)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this note?')) return
    setDeletingId(id)
    try {
      await notesApi.delete(id)
      setNotes((prev) => prev.filter((n) => n._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      if (activeTab === 'pinned' && !note.isPinned) return false
      if (activeTab === 'archived') {
        // Backend note schema does not have an archived field
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchTitle = note.title.toLowerCase().includes(q)
        const matchContent = note.content.toLowerCase().includes(q)
        const matchTags = note.tags ? note.tags.some((t) => t.toLowerCase().includes(q)) : false
        if (!matchTitle && !matchContent && !matchTags) return false
      }
      return true
    })
  }, [notes, activeTab, search])

  return (
    <div className="app-shell">
      <aside className="app-sidebar notes-sidebar">
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
              className={label === 'Notes' ? 'active' : ''}
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
            <p className="app-eyebrow">WORKSPACE / NOTES</p>
            <h1>Notes</h1>
            <p>Capture ideas, organize your thinking, and keep important information close.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
          </div>
        </header>

        <div className="app-content notes-content">
          <section className="welcome-block notes-welcome">
            <div>
              <p className="app-eyebrow">YOUR THOUGHTS</p>
              <h2>Keep the good <em>ideas close.</em></h2>
              <p>A quiet place for everything worth remembering.</p>
            </div>
            <Link className="app-primary-action" href="/notes/new">
              <Plus size={15} />New note
            </Link>
          </section>

          <section className="notes-toolbar" aria-label="Note organization">
            <label className="notes-search">
              <Search size={15} />
              <span className="sr-only">Search your notes</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search your notes..."
              />
            </label>

            <div className="notes-tabs" role="tablist" aria-label="Note views">
              <button
                className={activeTab === 'all' ? 'selected' : ''}
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
              >
                All notes ({notes.length})
              </button>
              <button
                className={activeTab === 'pinned' ? 'selected' : ''}
                type="button"
                role="tab"
                aria-selected={activeTab === 'pinned'}
                onClick={() => setActiveTab('pinned')}
              >
                Pinned ({notes.filter((n) => n.isPinned).length})
              </button>
              <button
                className={activeTab === 'archived' ? 'selected' : ''}
                type="button"
                role="tab"
                aria-selected={activeTab === 'archived'}
                onClick={() => setActiveTab('archived')}
              >
                Archived
              </button>
            </div>

            {search && (
              <button className="task-clear" type="button" onClick={() => setSearch('')}>
                Clear search
              </button>
            )}
          </section>

          <section className="app-section notes-list-section">
            <div className="app-section-head">
              <div>
                <p className="app-eyebrow">YOUR LIBRARY</p>
                <h2>
                  {activeTab === 'pinned'
                    ? 'Pinned notes'
                    : activeTab === 'archived'
                    ? 'Archived notes'
                    : 'All notes'}
                </h2>
              </div>
              <span className="task-result-count">{filtered.length} notes</span>
            </div>

            {loading ? (
              <div className="notes-empty" style={{ justifyContent: 'center' }}>
                <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)' }} />
                <strong>Loading notes…</strong>
              </div>
            ) : error ? (
              <div className="notes-empty" style={{ justifyContent: 'center' }}>
                <AlertCircle size={24} style={{ color: 'var(--accent)' }} />
                <div>
                  <strong>Failed to load notes</strong>
                  <p>{error}</p>
                  <button className="app-secondary-action" onClick={fetchNotes} style={{ marginTop: '10px' }}>
                    Retry
                  </button>
                </div>
              </div>
            ) : activeTab === 'archived' ? (
              <div className="notes-empty">
                <div className="notes-empty-icon">
                  <CircleAlert size={19} />
                </div>
                <div>
                  <strong>Archive not configured</strong>
                  <p>
                    Note archiving is not currently supported in the backend schema. Notes can be marked as pinned or deleted.
                  </p>
                </div>
              </div>
            ) : filtered.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                  gap: '16px',
                  padding: '18px 20px',
                }}
              >
                {filtered.map((note) => (
                  <article
                    key={note._id}
                    className="project-row-card"
                    style={{
                      flexDirection: 'column',
                      margin: 0,
                      gap: '12px',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link
                        href={`/notes/${note._id}`}
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#30352f',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {note.title}
                      </Link>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => togglePin(note, e)}
                          disabled={togglingPinId === note._id}
                          aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: note.isPinned ? 'var(--accent)' : '#a6aaa5',
                            padding: '4px',
                          }}
                        >
                          <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(note._id, e)}
                          disabled={deletingId === note._id}
                          aria-label={`Delete note ${note.title}`}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#a6aaa5',
                            padding: '4px',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '11px',
                        color: '#777b74',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}
                    >
                      {note.content}
                    </p>

                    <div
                      className="project-row-meta"
                      style={{
                        marginTop: 'auto',
                        paddingTop: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <span>
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Link href={`/notes/${note._id}`}>
                        Read <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="notes-empty">
                <div className="notes-empty-icon">
                  <CircleAlert size={19} />
                </div>
                <div>
                  <strong>{notes.length ? 'No notes match your search.' : 'Your ideas start here'}</strong>
                  <p>
                    {notes.length
                      ? 'Try another search or adjust your view.'
                      : 'Create your first note to capture an idea, save an insight, or keep track of something important.'}
                  </p>
                  {notes.length ? (
                    <button className="app-inline-action" type="button" onClick={() => setSearch('')}>
                      Clear search
                    </button>
                  ) : (
                    <Link className="app-inline-action" href="/notes/new">
                      Create note
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
