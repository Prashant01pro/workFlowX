'use client'

import Link from 'next/link'
import { FolderKanban, Plus, Search, ArrowUpRight, SlidersHorizontal, LoaderCircle, AlertCircle, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { projectsApi } from '@/lib/api/projects'
import type { ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const statuses = ['All projects', 'Active', 'Paused', 'Completed', 'Archived']

export default function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All projects')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const name = user?.name || 'Alex Morgan'
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'AM'

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await projectsApi.getAll()
      setProjects(res.projects || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load projects.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project?')) return
    setDeletingId(id)
    try {
      await projectsApi.delete(id)
      setProjects((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus =
        status === 'All projects' || project.status.toLowerCase() === status.toLowerCase()
      const stackStr = [
        ...(project.techStack || []),
        ...(project.nonTechStack || []),
      ].join(' ')
      const matchesQuery =
        !query ||
        `${project.title} ${project.description} ${stackStr}`
          .toLowerCase()
          .includes(query.toLowerCase())
      return matchesStatus && matchesQuery
    })
  }, [projects, status, query])

  const counts = useMemo(() => {
    return {
      total: projects.length,
      Active: projects.filter((p) => p.status.toLowerCase() === 'active').length,
      Paused: projects.filter((p) => p.status.toLowerCase() === 'paused').length,
      Completed: projects.filter((p) => p.status.toLowerCase() === 'completed').length,
    }
  }, [projects])

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
        <nav className="app-nav" aria-label="Workspace navigation">
          {[
            ['Dashboard', '/dashboard'],
            ['Projects', '/projects'],
            ['Tasks', '/tasks'],
            ['Notes', '/notes'],
            ['Finances', '/finances'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={label === 'Projects' ? 'active' : ''}
            >
              <FolderKanban size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <p className="app-nav-label app-nav-label-personal">Personal</p>
        <nav className="app-nav">
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
            <p className="app-eyebrow">WORKSPACE / PROJECTS</p>
            <h1>Projects</h1>
            <p>Plan your work, track progress, and keep every project organized.</p>
          </div>
          <div className="app-header-user">
            <span className="app-avatar app-avatar-light">{initials}</span>
          </div>
        </header>

        <div className="app-content project-list-content">
          <section className="welcome-block">
            <div>
              <p className="app-eyebrow">YOUR WORK</p>
              <h2>Make space for <em>momentum.</em></h2>
            </div>
            <Link className="app-primary-action" href="/projects/new">
              <Plus size={15} />New project
            </Link>
          </section>

          <div className="metric-grid project-metrics">
            <div className="metric-card">
              <span>TOTAL PROJECTS</span>
              <strong>{counts.total}</strong>
              <small>Across your workspace</small>
            </div>
            <div className="metric-card">
              <span>ACTIVE</span>
              <strong>{counts.Active}</strong>
              <small>Currently moving</small>
            </div>
            <div className="metric-card">
              <span>PAUSED</span>
              <strong>{counts.Paused}</strong>
              <small>Waiting for attention</small>
            </div>
            <div className="metric-card metric-card-accent">
              <span>COMPLETED</span>
              <strong>{counts.Completed}</strong>
              <small>Finished projects</small>
            </div>
          </div>

          <section className="project-toolbar">
            <label className="project-search">
              <Search size={16} />
              <span className="sr-only">Search projects</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
              />
            </label>
            <div className="project-filters">
              <SlidersHorizontal size={15} />
              {statuses.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={status === item ? 'selected' : ''}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {loading ? (
            <div className="app-section project-empty" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <LoaderCircle className="spin" size={24} style={{ color: 'var(--accent)' }} />
              <strong>Loading your projects…</strong>
            </div>
          ) : error ? (
            <div className="app-section project-empty" style={{ textAlign: 'center' }}>
              <AlertCircle size={24} style={{ color: 'var(--accent)', margin: '0 auto 10px' }} />
              <strong>We could not load your projects.</strong>
              <p>{error}</p>
              <button className="app-secondary-action" type="button" onClick={fetchProjects} style={{ marginTop: '12px' }}>
                Retry
              </button>
            </div>
          ) : filtered.length ? (
            <section className="project-list" aria-label="Projects">
              {filtered.map((project) => {
                const stack = [
                  ...(project.techStack || []),
                  ...(project.nonTechStack || []),
                ].join(', ')
                return (
                  <article className="project-row-card" key={project._id}>
                    <div className="project-row-main">
                      <span className="empty-rule" />
                      <div>
                        <div className="project-row-title">
                          <Link href={`/projects/${project._id}`}>{project.title}</Link>
                          <span className={`status-badge status-${project.status.toLowerCase()}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </div>
                        <p>{project.description}</p>
                        {stack && <small>{stack}</small>}
                      </div>
                    </div>
                    <div className="project-row-meta">
                      <span>
                        DEADLINE<br />
                        <strong>
                          {new Date(project.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </strong>
                      </span>
                      <Link href={`/projects/${project._id}`} aria-label={`View ${project.title}`}>
                        View <ArrowUpRight size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(project._id, e)}
                        disabled={deletingId === project._id}
                        aria-label={`Delete ${project.title}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#858981',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </article>
                )
              })}
            </section>
          ) : (
            <div className="app-section project-empty">
              <span className="empty-rule" />
              <strong>{projects.length ? 'No projects match your search.' : 'Your next project starts here.'}</strong>
              <p>
                {projects.length
                  ? 'Try another search or clear the filters.'
                  : 'Create a project to bring related tasks, notes, and deadlines together.'}
              </p>
              <Link
                className="app-inline-action"
                href={projects.length ? '/projects' : '/projects/new'}
                onClick={() => {
                  if (projects.length) {
                    setQuery('')
                    setStatus('All projects')
                  }
                }}
              >
                {projects.length ? 'Clear filters' : 'Create your first project'}
                <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
