'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { Plus, X, LoaderCircle } from 'lucide-react'
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
            placeholder={value.length ? 'Add another' : label === 'Technical stack' ? 'e.g. React, Node.js, MongoDB' : 'e.g. Planning, Research'}
          />
          <button type="button" onClick={add}>
            <Plus size={14} />Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewProjectPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Active')
  const [deadline, setDeadline] = useState('')
  const [technical, setTechnical] = useState<string[]>([])
  const [nontechnical, setNontechnical] = useState<string[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return

    if (!title.trim()) {
      setError('Project title is required.')
      return
    }
    if (title.trim().length < 2) {
      setError('Project title must be at least 2 characters.')
      return
    }
    if (!description.trim()) {
      setError('Project description is required.')
      return
    }
    if (!deadline) {
      setError('Please provide a project deadline.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await projectsApi.create({
        title: title.trim(),
        description: description.trim(),
        status: status.toLowerCase() as 'active' | 'paused' | 'completed' | 'archived',
        deadline: new Date(deadline).toISOString(),
        techStack: technical,
        nonTechStack: nontechnical,
      })
      router.push('/projects')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to create project. Please verify the fields.')
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
            <p className="app-eyebrow">PROJECTS / NEW PROJECT</p>
            <h1>Create a project</h1>
            <p>Bring your work together in one organized space.</p>
          </div>
        </header>

        <div className="app-content project-form-content">
          <nav className="detail-breadcrumbs">
            <Link href="/projects">Projects</Link>
            <span>/</span>
            <span>New project</span>
          </nav>

          <div className="project-form-layout">
            <form className="app-section project-form" onSubmit={submit}>
              <div className="app-section-head">
                <div>
                  <p className="app-eyebrow">PROJECT DETAILS</p>
                  <h2>Set the direction.</h2>
                </div>
              </div>
              <div className="form-fields">
                <div className="field-group">
                  <label htmlFor="title">Project title <span className="required">Required</span></label>
                  <input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Personal Finance Dashboard"
                    aria-invalid={Boolean(error && !title.trim())}
                    disabled={saving}
                  />
                  <small>Use a clear name you will recognize later.</small>
                </div>
                <div className="field-group">
                  <label htmlFor="description">Description <span className="required">Required</span></label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What is this project about?"
                    rows={5}
                    disabled={saving}
                  />
                </div>
                <div className="form-two-col">
                  <div className="field-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
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
                    <label htmlFor="deadline">Project deadline <span className="required">Required</span></label>
                    <input
                      id="deadline"
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
                  <Link href="/projects" className="app-secondary-action">Cancel</Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <LoaderCircle className="spin" size={14} /> Creating…
                      </>
                    ) : (
                      'Create project'
                    )}
                  </button>
                </div>
              </div>
            </form>

            <aside className="form-tip">
              <p className="app-eyebrow">A SMALL START</p>
              <h2>Keep the first version focused.</h2>
              <p>Add the context that will help you recognize the project and move it forward. You can always refine the details later.</p>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
