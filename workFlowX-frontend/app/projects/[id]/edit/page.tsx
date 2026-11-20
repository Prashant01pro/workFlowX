'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { ArrowLeft, LoaderCircle, AlertCircle, Plus, X } from 'lucide-react'
import { projectsApi } from '@/lib/api/projects'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

const statuses = ['Active', 'Paused', 'Completed', 'Archived']

function StackField({ label, value, setValue }: { label: string; value: string[]; setValue: (value: string[]) => void }) {
  const [draft, setDraft] = useState('')
  function add() {
    const item = draft.trim()
    if (item && !value.includes(item)) setValue([...value, item])
    setDraft('')
  }
  return (
    <div className="field-group">
      <label>{label}</label>
      <div className="stack-editor">
        <div className="stack-tags">
          {value.map((item) => (
            <span key={item}>
              {item}
              <button type="button" aria-label={`Remove ${item}`} onClick={() => setValue(value.filter((entry) => entry !== item))}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="stack-input">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                add()
              }
            }}
            placeholder="Add tag"
          />
          <button type="button" onClick={add}>
            <Plus size={14} />Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EditProjectPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params?.id

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Active')
  const [deadline, setDeadline] = useState('')
  const [technical, setTechnical] = useState<string[]>([])
  const [nontechnical, setNontechnical] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    projectsApi
      .getById(projectId)
      .then((res) => {
        const p = res.data.project
        setTitle(p.title)
        setDescription(p.description || '')
        setStatus(p.status.charAt(0).toUpperCase() + p.status.slice(1))
        if (p.deadline) {
          setDeadline(new Date(p.deadline).toISOString().split('T')[0])
        }
        setTechnical(p.techStack || [])
        setNontechnical(p.nonTechStack || [])
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load project.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [projectId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!projectId || saving) return

    if (!title.trim()) {
      setError('Project title is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.update(projectId, {
        title: title.trim(),
        description: description.trim(),
        status: status.toLowerCase() as 'active' | 'paused' | 'completed' | 'archived',
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        techStack: technical,
        nonTechStack: nontechnical,
      })
      router.push(`/projects/${projectId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update project.')
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
          <Link href="/projects" className="active">Projects</Link>
          <Link href="/tasks">Tasks</Link>
          <Link href="/notes">Notes</Link>
          <Link href="/finances">Finances</Link>
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">PROJECTS / EDIT</p>
            <h1>Edit project</h1>
            <p>Update your project details and keep everything organized.</p>
          </div>
        </header>

        <div className="app-content project-form-content">
          <nav className="detail-breadcrumbs">
            <Link href="/projects">Projects</Link>
            <span>/</span>
            <Link href={`/projects/${projectId}`}>{title || 'Project'}</Link>
            <span>/</span>
            <span>Edit project</span>
          </nav>

          {loading ? (
            <div className="app-section project-empty" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)' }} />
              <strong>Loading project…</strong>
            </div>
          ) : (
            <form className="app-section project-form" onSubmit={submit}>
              <div className="app-section-head">
                <div>
                  <p className="app-eyebrow">PROJECT DETAILS</p>
                  <h2>Refine the work.</h2>
                </div>
                <Link href={`/projects/${projectId}`} className="app-view-link">
                  <ArrowLeft size={13} />Cancel
                </Link>
              </div>

              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="edit-title">Project title</label>
                  <input
                    id="edit-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="field-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    rows={5}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="form-two-col">
                  <div className="field-group">
                    <label htmlFor="edit-status">Status</label>
                    <select
                      id="edit-status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value)}
                      disabled={saving}
                    >
                      {statuses.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field-group">
                    <label htmlFor="edit-deadline">Project deadline</label>
                    <input
                      id="edit-deadline"
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <StackField label="Technical stack" value={technical} setValue={setTechnical} />
                <StackField label="Nontechnical stack" value={nontechnical} setValue={setNontechnical} />

                {error && <p className="form-error" role="alert">{error}</p>}

                <div className="form-actions">
                  <Link href={`/projects/${projectId}`} className="app-secondary-action">Cancel</Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoaderCircle className="spin" size={14} /> Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
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
