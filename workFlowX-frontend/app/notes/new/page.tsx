'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState, Suspense } from 'react'
import { CircleAlert, Save, LoaderCircle } from 'lucide-react'
import { notesApi } from '@/lib/api/notes'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

function NewNoteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || null
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return

    if (!title.trim()) {
      setError('Add a title before creating your note.')
      return
    }
    if (title.trim().length < 2) {
      setError('Note title must be at least 2 characters.')
      return
    }
    if (!content.trim()) {
      setError('Note content cannot be empty.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await notesApi.create({
        title: title.trim(),
        content: content.trim(),
        project: projectId || null,
      })
      router.push('/notes')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create note.')
      }
    } finally {
      setSaving(false)
    }
  }

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
        <nav className="app-nav">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/tasks">Tasks</Link>
          <Link href="/notes" className="active">Notes</Link>
          <Link href="/finances">Finances</Link>
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">WORKSPACE / NOTES / NEW</p>
            <h1>Create a note</h1>
            <p>Capture an idea before it slips away.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
          </div>
        </header>

        <div className="app-content note-form-content">
          <div className="detail-breadcrumbs">
            <Link href="/notes">Notes</Link>
            <span>/</span>
            <span>New note</span>
          </div>

          <div className="note-form-layout">
            <form className="app-section note-form" onSubmit={submit} noValidate>
              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="note-title">Title <span className="required">REQUIRED</span></label>
                  <input
                    id="note-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give your note a title..."
                    maxLength={100}
                    disabled={saving}
                  />
                </div>

                <div className="field-group note-content-field">
                  <label htmlFor="note-content">Content <span className="required">REQUIRED</span></label>
                  <textarea
                    id="note-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Start writing..."
                    aria-describedby="note-guidance"
                    disabled={saving}
                  />
                  <small id="note-guidance">Your note will be saved when you select Create note.</small>
                </div>

                {error && (
                  <p className="form-error" role="alert">
                    <CircleAlert size={14} />
                    {error}
                  </p>
                )}

                <div className="form-actions">
                  <Link href="/notes" className="app-secondary-action">
                    Cancel
                  </Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoaderCircle className="spin" size={14} /> Creating…
                      </>
                    ) : (
                      <>
                        <Save size={15} />Create note
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <aside className="form-tip">
              <p className="app-eyebrow">A SMALL PROMPT</p>
              <h2>Write it down while it&apos;s clear.</h2>
              <p>Keep this space simple. A title and a few honest lines are enough to make an idea useful later.</p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewNotePage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>}>
      <NewNoteContent />
    </Suspense>
  )
}
