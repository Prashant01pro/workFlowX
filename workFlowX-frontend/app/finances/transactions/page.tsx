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
  LoaderCircle,
  Menu,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { transactionsApi } from '@/lib/api/transactions'
import type { FinancialSummaryData, TransactionEntity, PaginationMeta } from '@/lib/types'
import { ApiError } from '@/lib/api-client'

const nav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Notes', href: '/notes', icon: NotebookPen },
  { label: 'Finances', href: '/finances', icon: CircleDollarSign },
]

function Sidebar({ open, close }: { open: boolean; close: () => void }) {
  const { user } = useAuth()
  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  return (
    <aside className={`app-sidebar ${open ? 'app-sidebar-open' : ''}`}>
      <div className="app-sidebar-top">
        <Link href="/" className="app-wordmark">
          WorkFlow<span>X</span>
        </Link>
        <button className="app-close" onClick={close} aria-label="Close navigation">
          <X size={18} />
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
        {nav.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={item.href === '/finances' ? 'active' : ''}
              onClick={close}
            >
              <Icon size={16} strokeWidth={1.7} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="app-sidebar-bottom">
        <SignOutButton onClick={close} />
        <span>PRIVATE BY DESIGN.</span>
      </div>
    </aside>
  )
}

export default function TransactionsPage() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const [transactions, setTransactions] = useState<TransactionEntity[]>([])
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  // Actions state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [listRes, summaryRes] = await Promise.all([
        transactionsApi.getAll({
          page,
          limit: 10,
          search: search.trim() || undefined,
          type: typeFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        transactionsApi.getSummary({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      ])
      setTransactions(listRes.transactions || [])
      setPagination(listRes.pagination || null)
      setSummary(summaryRes.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load transactions.')
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, startDate, endDate])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this transaction?')) return

    setDeletingId(id)
    try {
      await transactionsApi.delete(id)
      await fetchTransactions()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <div className="app-shell">
      <Sidebar open={open} close={() => setOpen(false)} />
      <button
        className={`app-overlay ${open ? 'visible' : ''}`}
        onClick={() => setOpen(false)}
        aria-label="Close navigation"
      />

      <main className="app-main">
        <header className="app-header">
          <button
            className="app-menu-toggle"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="app-eyebrow">FINANCES / ACTIVITY</p>
            <h1>Transactions</h1>
            <p>Review and manage your financial activity.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content transactions-content">
          <div className="detail-breadcrumbs">
            <Link href="/finances">
              <ArrowLeft size={13} />
              Finances
            </Link>
            <span>/</span>
            <span>Transactions</span>
          </div>

          <div className="transactions-head">
            <div>
              <p className="app-eyebrow">ALL ACTIVITY</p>
              <h2>
                Every movement, <em>accounted for.</em>
              </h2>
            </div>
            <Link className="app-primary-action" href="/finances/transactions/new">
              <Plus size={14} />
              Add transaction
            </Link>
          </div>

          {error && (
            <div
              className="data-notice"
              style={{ borderColor: '#c9472d', background: '#f7e7e1', color: '#6e3024', marginBottom: '20px' }}
            >
              <CircleAlert size={16} />
              <span>
                <strong>Unable to retrieve transactions:</strong> {error}
              </span>
              <button
                onClick={fetchTransactions}
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

          <section className="metric-grid transaction-metrics" aria-label="Transaction summary">
            <div className="metric-card">
              <span>INCOME</span>
              <strong>
                $
                {(summary?.totalIncome || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              <small>Calculated global total</small>
            </div>
            <div className="metric-card">
              <span>EXPENSES</span>
              <strong>
                $
                {(summary?.totalExpense || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              <small>Calculated global total</small>
            </div>
            <div className="metric-card metric-card-accent">
              <span>NET</span>
              <strong style={{ color: (summary?.netBalance || 0) < 0 ? '#c2410c' : undefined }}>
                $
                {(summary?.netBalance || 0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
              <small>{(summary?.netBalance || 0) >= 0 ? 'Surplus' : 'Deficit'}</small>
            </div>
          </section>

          <section className="app-section transaction-table-section">
            <div className="transaction-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <label className="transaction-search">
                <Search size={15} />
                <span className="sr-only">Search transactions</span>
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  placeholder="Search description or category"
                />
              </label>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('all')
                    setPage(1)
                  }}
                  className={`app-secondary-action ${typeFilter === 'all' ? 'app-primary-action' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('income')
                    setPage(1)
                  }}
                  className={`app-secondary-action ${typeFilter === 'income' ? 'app-primary-action' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('expense')
                    setPage(1)
                  }}
                  className={`app-secondary-action ${typeFilter === 'expense' ? 'app-primary-action' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '10px' }}
                >
                  Expense
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', color: '#777b74' }}>
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setPage(1)
                  }}
                  style={{
                    background: '#f5f3ed',
                    border: '1px solid #bfc0b9',
                    padding: '4px 8px',
                    fontSize: '11px',
                  }}
                />
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setPage(1)
                  }}
                  style={{
                    background: '#f5f3ed',
                    border: '1px solid #bfc0b9',
                    padding: '4px 8px',
                    fontSize: '11px',
                  }}
                />
              </div>

              {(search || typeFilter !== 'all' || startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontSize: '10px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="transaction-empty">
                <LoaderCircle size={20} className="animate-spin text-accent" />
                <div>
                  <strong>Loading transactions...</strong>
                  <p>Fetching your recorded financial activity.</p>
                </div>
              </div>
            ) : transactions.length > 0 ? (
              <div className="categories-table-wrap">
                <table className="categories-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.date).toLocaleDateString()}</td>
                        <td>
                          <Link
                            href={`/finances/transactions/${tx._id}`}
                            style={{ fontWeight: 600, color: '#202321' }}
                          >
                            {tx.description || '—'}
                          </Link>
                          {tx.project && (
                            <small style={{ display: 'block', color: '#777b74', fontSize: '10px' }}>
                              Project: {typeof tx.project === 'object' ? tx.project.title : 'Linked project'}
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className="category-kind"
                            style={{ textTransform: 'capitalize' }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              textTransform: 'uppercase',
                              fontSize: '9px',
                              fontWeight: 700,
                              color: tx.type === 'income' ? '#16a34a' : '#c2410c',
                            }}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong
                            style={{
                              fontSize: '12px',
                              color: tx.type === 'income' ? '#16a34a' : '#202321',
                            }}
                          >
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                            <Link
                              href={`/finances/transactions/${tx._id}`}
                              style={{ color: '#202321', fontSize: '11px', textDecoration: 'underline' }}
                            >
                              View
                            </Link>
                            <Link
                              href={`/finances/transactions/${tx._id}/edit`}
                              style={{ color: '#202321', fontSize: '11px', textDecoration: 'underline' }}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={(e) => handleDelete(tx._id, e)}
                              disabled={deletingId === tx._id}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#c2410c',
                                cursor: 'pointer',
                                padding: '2px',
                              }}
                              title="Delete transaction"
                            >
                              {deletingId === tx._id ? (
                                <LoaderCircle size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="transaction-empty">
                <CircleDollarSign size={20} />
                <div>
                  <strong>No transactions found.</strong>
                  <p>
                    {search || typeFilter !== 'all' || startDate || endDate
                      ? 'No transactions matched your active filters. Try adjusting your criteria.'
                      : 'You have not recorded any transactions yet. Record your first movement to start tracking.'}
                  </p>
                  <Link href="/finances/transactions/new" className="app-inline-action">
                    <Plus size={13} />
                    Add transaction
                  </Link>
                </div>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderTop: '1px solid #d0cfc8',
                  fontSize: '11px',
                  color: '#777b74',
                }}
              >
                <span>
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalTransactions} total)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrevPage}
                    className="app-secondary-action"
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="app-secondary-action"
                    style={{ padding: '5px 10px', fontSize: '10px' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="app-footer">
          <span>© 2026 WorkFlowX</span>
          <span>Accurate by design.</span>
        </footer>
      </main>
    </div>
  )
}
