'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  ArrowLeft,
  Calendar,
  CheckSquare,
  CircleAlert,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  LoaderCircle,
  NotebookPen,
  Pencil,
  Pin,
  Trash2,
} from 'lucide-react'
import { notesApi } from '@/lib/api/notes'
import type { NoteEntity } from '@/lib/types'
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

export default function NoteDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const noteId = params?.id
  const { user } = useAuth()

  const [note, setNote] = useState<NoteEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [togglingPin, setTogglingPin] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const fetchNote = useCallback(async () => {
    if (!noteId) return
    setLoading(true)
    setError('')
    try {
      const res = await notesApi.getById(noteId)
      setNote(res.data.note)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load note details.')
      }
    } finally {
      setLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  const handleDelete = async () => {
    if (!noteId || deleting) return
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) return
    setDeleting(true)
    try {
      await notesApi.delete(noteId)
      router.push('/notes')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete note.')
      setDeleting(false)
    }
  }

  const handleTogglePin = async () => {
    if (!note || togglingPin) return
    setTogglingPin(true)
    try {
      const res = await notesApi.update(note._id, { isPinned: !note.isPinned })
      setNote(res.data.note)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update note.')
    } finally {
      setTogglingPin(false)
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
            <p className="app-eyebrow">WORKSPACE / NOTES / DETAILS</p>
            <h1>{note?.title || 'Note Details'}</h1>
            <p>Read your saved thinking in a calm, focused space.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content note-detail-content">
          <div className="detail-breadcrumbs">
            <Link href="/notes">Notes</Link>
            <span>/</span>
            <span>{note ? note.title : `Note ${noteId}`}</span>
          </div>

          {loading ? (
            <div className="detail-overview-empty app-section" role="status">
              <LoaderCircle size={24} className="animate-spin text-accent" />
              <p>Loading note details...</p>
            </div>
          ) : error || !note ? (
            <section className="note-unavailable app-section" role="status">
              <div className="note-empty-icon">
                <CircleAlert size={20} />
              </div>
              <div>
                <p className="app-eyebrow">ERROR</p>
                <h2>Unable to load note</h2>
                <p>{error || 'The requested note could not be found.'}</p>
                <div className="note-detail-actions">
                  <Link href="/notes" className="app-secondary-action">
                    <ArrowLeft size={14} /> Back to notes
                  </Link>
                  <button onClick={fetchNote} className="app-primary-action">
                    Retry
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <div className="detail-hero">
                <div>
                  <p className="app-eyebrow">
                    {note.isPinned ? '📌 PINNED NOTE' : 'NOTE'}
                    {note.updatedAt && ` · UPDATED ${new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                  <h2>{note.title}</h2>
                  {note.createdAt && (
                    <p className="detail-lede">
                      Created on {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="detail-actions">
                  <Link href="/notes" className="app-secondary-action">
                    <ArrowLeft size={14} /> Back
                  </Link>

                  <button
                    onClick={handleTogglePin}
                    disabled={togglingPin}
                    className="app-secondary-action"
                    title={note.isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin size={14} className={note.isPinned ? 'text-accent fill-current' : ''} />
                    {note.isPinned ? 'Pinned' : 'Pin'}
                  </button>

                  <Link href={`/notes/${note._id}/edit`} className="app-secondary-action">
                    <Pencil size={14} /> Edit
                  </Link>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="app-secondary-action"
                    style={{ color: '#c2410c' }}
                    title="Delete note"
                  >
                    {deleting ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete
                  </button>
                </div>
              </div>

              <section className="app-section" style={{ padding: '28px', maxWidth: '900px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    color: '#202321',
                    minHeight: '120px',
                  }}
                >
                  {note.content}
                </div>

                {(note.tags && note.tags.length > 0) || note.project ? (
                  <div
                    style={{
                      borderTop: '1px solid #dcdcd4',
                      marginTop: '28px',
                      paddingTop: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {note.project && (
                      <span className="note-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <FolderKanban size={11} />
                        Project Note
                      </span>
                    )}
                    {note.tags && note.tags.map((tag, idx) => (
                      <span key={idx} className="note-tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
