'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUpRight,
  CircleAlert,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  CheckSquare,
  NotebookPen,
  Info,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useMemo, useState, useEffect, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { transactionsApi } from '@/lib/api/transactions'
import type { FinancialSummaryData } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

export default function CategoriesPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await transactionsApi.getSummary()
      setSummary(res.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load category breakdown.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const categories = summary?.categoryBreakdown || []

  const filtered = useMemo(() => {
    if (!query.trim()) return categories
    const q = query.toLowerCase()
    return categories.filter((c) => c._id.toLowerCase().includes(q))
  }, [categories, query])

  const totalExpense = summary?.totalExpense || 0

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
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={item.href === '/finances' ? 'active' : ''}
              >
                <Icon size={16} strokeWidth={1.7} />
                {item.label}
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
            <p className="app-eyebrow">WORKSPACE / FINANCES / CATEGORIES</p>
            <h1>Categories</h1>
            <p>Spending breakdown and category distribution derived from your transactions.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content categories-content">
          <div className="detail-breadcrumbs">
            <Link href="/finances">
              <ArrowLeft size={13} />
              Finances
            </Link>
            <span>/</span>
            <span>Categories</span>
          </div>

          <div className="categories-head">
            <div>
              <p className="app-eyebrow">FINANCE CATEGORIES</p>
              <h2>
                Make every <em>movement</em> legible.
              </h2>
              <p>
                Categories are derived directly from your recorded transactions. As you record expenses, new categories automatically appear here.
              </p>
            </div>
            <Link href="/finances/transactions/new" className="app-primary-action">
              <Plus size={14} />
              Add transaction
            </Link>
          </div>

          <div className="data-notice categories-notice">
            <Info size={16} />
            <span>
              <strong>Category Schema Architecture:</strong> Categories are stored directly as labeled properties on transactions rather than standalone database entities. To add a new category, simply enter it when creating a transaction.
            </span>
          </div>

          {error && (
            <div
              className="data-notice"
              style={{ borderColor: '#c9472d', background: '#f7e7e1', color: '#6e3024', marginBottom: '20px' }}
            >
              <CircleAlert size={16} />
              <span>
                <strong>Unable to load categories:</strong> {error}
              </span>
              <button
                onClick={loadCategories}
                style={{
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#6e3024',
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="metric-grid">
            <div className="metric-card">
              <span>ACTIVE CATEGORIES</span>
              <strong>{categories.length}</strong>
              <small>Categories with transactions</small>
            </div>
            <div className="metric-card">
              <span>TOTAL EXPENSES</span>
              <strong>
                $
                {totalExpense.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              <small>Categorized spending</small>
            </div>
            <div className="metric-card">
              <span>HIGHEST SPENDING CATEGORY</span>
              <strong style={{ fontSize: '20px', textTransform: 'capitalize' }}>
                {categories[0]?._id || '—'}
              </strong>
              <small>
                {categories[0] ? `$${categories[0].totalSpent.toFixed(2)} spent` : 'No expenses recorded'}
              </small>
            </div>
          </div>

          <div className="categories-toolbar">
            <label className="categories-search">
              <Search size={15} />
              <span className="sr-only">Search categories</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search categories"
              />
            </label>

            {query && (
              <button
                className="categories-clear"
                onClick={() => setQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                Clear search
              </button>
            )}
          </div>

          <section className="app-section" aria-labelledby="categories-list-title">
            <div className="app-section-head">
              <div>
                <p className="app-eyebrow">DIRECTORY</p>
                <h2 id="categories-list-title">Category breakdown</h2>
              </div>
              <span className="transaction-disabled">{filtered.length} categories</span>
            </div>

            {loading ? (
              <div className="categories-empty">
                <LoaderCircle size={22} className="animate-spin text-accent" />
                <div>
                  <strong>Loading categories...</strong>
                  <p>Aggregating spending distribution from transaction records.</p>
                </div>
              </div>
            ) : filtered.length > 0 ? (
              <div className="categories-table-wrap">
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Transactions</th>
                      <th>Total Spent</th>
                      <th>Share of Expenses</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((cat) => {
                      const pct = totalExpense > 0 ? Math.round((cat.totalSpent / totalExpense) * 100) : 0
                      return (
                        <tr key={cat._id}>
                          <td>
                            <strong className="category-name" style={{ textTransform: 'capitalize' }}>
                              {cat._id}
                            </strong>
                          </td>
                          <td>
                            {cat.count} {cat.count === 1 ? 'record' : 'records'}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--accent)' }}>
                              ${cat.totalSpent.toFixed(2)}
                            </strong>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '80px',
                                  height: '6px',
                                  background: '#dcdcd4',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${pct}%`,
                                    height: '100%',
                                    background: 'var(--accent)',
                                  }}
                                />
                              </div>
                              <small style={{ color: '#777b74', fontSize: '10px' }}>{pct}%</small>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="category-actions" style={{ justifyContent: 'flex-end' }}>
                              <Link href={`/finances/transactions?search=${encodeURIComponent(cat._id)}`}>
                                View transactions <ArrowUpRight size={12} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="categories-empty">
                <CircleDollarSign size={22} />
                <div>
                  <strong>No categories to display.</strong>
                  <p>
                    {query
                      ? 'No categories match your search query.'
                      : 'You have not recorded any expense transactions yet. As you log expenses, categories will automatically appear here with their total spending.'}
                  </p>
                  <Link className="app-inline-action" href="/finances/transactions/new">
                    Add transaction <ArrowUpRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
