'use client'

import Link from 'next/link'
import {
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
  X,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { SignOutButton } from '@/components/signout-button'
import { useAuth } from '@/lib/auth-context'
import { transactionsApi } from '@/lib/api/transactions'
import type { FinancialSummaryData, TransactionEntity } from '@/lib/types'
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

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="finance-empty-panel">
      <CircleDollarSign size={22} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  )
}

export default function FinancesPage() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const [summary, setSummary] = useState<FinancialSummaryData | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<TransactionEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const loadFinanceData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summaryRes, transRes] = await Promise.all([
        transactionsApi.getSummary(),
        transactionsApi.getAll({ limit: 5 }),
      ])
      setSummary(summaryRes.data)
      setRecentTransactions(transRes.transactions || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load financial records.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFinanceData()
  }, [loadFinanceData])

  const hasActivity = summary && (summary.totalIncome > 0 || summary.totalExpense > 0)
  const expenseCategories = summary?.categoryBreakdown || []

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
            <p className="app-eyebrow">WORKSPACE / FINANCES</p>
            <h1>Finances</h1>
            <p>Understand your financial activity and keep track of where your money goes.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content finances-content">
          <div className="finance-page-head">
            <div>
              <p className="app-eyebrow">OVERVIEW</p>
              <h2>
                Your money, <em>in focus.</em>
              </h2>
              <p>Real-time financial summary calculated directly from your transactions.</p>
            </div>
            <Link href="/finances/transactions/new" className="app-primary-action">
              <Plus size={15} />
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
                <strong>Could not load financial data:</strong> {error}
              </span>
              <button
                onClick={loadFinanceData}
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

          {loading ? (
            <div className="finance-empty-panel" style={{ minHeight: '180px' }}>
              <LoaderCircle size={22} className="animate-spin text-accent" />
              <p>Calculating financial overview...</p>
            </div>
          ) : (
            <>
              <section className="metric-grid finance-metrics" aria-label="Financial summary">
                <div className="metric-card">
                  <span>TOTAL INCOME</span>
                  <strong>
                    $
                    {(summary?.totalIncome || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <small>All-time recorded income</small>
                </div>
                <div className="metric-card">
                  <span>TOTAL EXPENSES</span>
                  <strong>
                    $
                    {(summary?.totalExpense || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <small>All-time recorded expenses</small>
                </div>
                <div className="metric-card metric-card-accent">
                  <span>NET BALANCE</span>
                  <strong style={{ color: (summary?.netBalance || 0) < 0 ? '#c2410c' : undefined }}>
                    $
                    {(summary?.netBalance || 0).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <small>
                    {(summary?.netBalance || 0) >= 0 ? 'Surplus across accounts' : 'Deficit across accounts'}
                  </small>
                </div>
              </section>

              <div className="finance-category-link" style={{ marginBottom: '18px' }}>
                <Link className="app-view-link" href="/finances/categories">
                  View spending categories <ArrowUpRight size={13} />
                </Link>
              </div>

              <div className="finance-grid">
                <section className="app-section">
                  <div className="app-section-head">
                    <div>
                      <p className="app-eyebrow">ACTIVITY</p>
                      <h2>Income vs expenses</h2>
                    </div>
                  </div>

                  {hasActivity ? (
                    <div style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' }}>
                        <span>Income (${(summary?.totalIncome || 0).toFixed(2)})</span>
                        <span>Expenses (${(summary?.totalExpense || 0).toFixed(2)})</span>
                      </div>
                      <div
                        style={{
                          height: '12px',
                          display: 'flex',
                          width: '100%',
                          background: '#e0ded8',
                          overflow: 'hidden',
                          border: '1px solid #c9c8c1',
                        }}
                      >
                        <div
                          style={{
                            width: `${
                              ((summary?.totalIncome || 0) + (summary?.totalExpense || 0)) > 0
                                ? ((summary?.totalIncome || 0) /
                                    ((summary?.totalIncome || 0) + (summary?.totalExpense || 0))) *
                                  100
                                : 50
                            }%`,
                            background: '#16a34a',
                          }}
                          title="Income share"
                        />
                        <div
                          style={{
                            width: `${
                              ((summary?.totalIncome || 0) + (summary?.totalExpense || 0)) > 0
                                ? ((summary?.totalExpense || 0) /
                                    ((summary?.totalIncome || 0) + (summary?.totalExpense || 0))) *
                                  100
                                : 50
                            }%`,
                            background: 'var(--accent)',
                          }}
                          title="Expense share"
                        />
                      </div>
                      <p style={{ color: '#777b74', fontSize: '10px', marginTop: '14px', lineHeight: '1.4' }}>
                        {(summary?.totalIncome || 0) >= (summary?.totalExpense || 0)
                          ? 'Net positive flow: Your total income exceeds your recorded expenditures.'
                          : 'Net negative flow: Your expenditures exceed your recorded income.'}
                      </p>
                    </div>
                  ) : (
                    <EmptyPanel
                      title="No historical data yet."
                      text="A comparison will appear once your first transactions are recorded."
                    />
                  )}
                </section>

                <section className="app-section">
                  <div className="app-section-head">
                    <div>
                      <p className="app-eyebrow">CATEGORIES</p>
                      <h2>Spending breakdown</h2>
                    </div>
                    {expenseCategories.length > 0 && (
                      <Link href="/finances/categories" className="app-view-link">
                        All categories <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>

                  {expenseCategories.length > 0 ? (
                    <div style={{ padding: '20px' }}>
                      {expenseCategories.slice(0, 4).map((cat) => {
                        const pct =
                          (summary?.totalExpense || 0) > 0
                            ? Math.round((cat.totalSpent / (summary?.totalExpense || 1)) * 100)
                            : 0
                        return (
                          <div
                            key={cat._id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 0',
                              borderBottom: '1px solid #d0cfc8',
                              fontSize: '11px',
                            }}
                          >
                            <div>
                              <strong style={{ textTransform: 'capitalize', color: '#202321' }}>
                                {cat._id}
                              </strong>
                              <small style={{ display: 'block', color: '#777b74', fontSize: '10px' }}>
                                {cat.count} {cat.count === 1 ? 'transaction' : 'transactions'} ({pct}%)
                              </small>
                            </div>
                            <strong style={{ color: 'var(--accent)', fontSize: '12px' }}>
                              ${cat.totalSpent.toFixed(2)}
                            </strong>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyPanel
                      title="No spending categories to show."
                      text="Categorized spending totals will automatically populate from your expense transactions."
                    />
                  )}
                </section>
              </div>

              <section className="app-section finance-recent">
                <div className="app-section-head">
                  <div>
                    <p className="app-eyebrow">RECENT ACTIVITY</p>
                    <h2>Transactions</h2>
                  </div>
                  <Link href="/finances/transactions" className="app-view-link">
                    View all <ArrowUpRight size={13} />
                  </Link>
                </div>

                {recentTransactions.length > 0 ? (
                  <div style={{ padding: '16px 22px' }}>
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 0',
                          borderBottom: '1px solid #d0cfc8',
                          fontSize: '11px',
                        }}
                      >
                        <div>
                          <Link
                            href={`/finances/transactions/${tx._id}`}
                            style={{ fontWeight: 600, color: '#202321' }}
                          >
                            {tx.description || tx.category}
                          </Link>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                            <span
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                border: '1px solid #c7c8c0',
                                padding: '1px 5px',
                                color: '#777b74',
                              }}
                            >
                              {tx.category}
                            </span>
                            <small style={{ color: '#858981', fontSize: '10px' }}>
                              {new Date(tx.date).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong
                            style={{
                              fontSize: '13px',
                              color: tx.type === 'income' ? '#16a34a' : '#c2410c',
                            }}
                          >
                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel
                    title="No financial activity."
                    text="Recent transactions will appear here as you log income and expenses."
                  />
                )}
              </section>
            </>
          )}
        </div>

        <footer className="app-footer">
          <span>© 2026 WorkFlowX</span>
          <span>Financial clarity without the noise.</span>
        </footer>
      </main>
    </div>
  )
}
