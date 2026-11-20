'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CircleAlert,
  CircleDollarSign,
  FolderKanban,
  LoaderCircle,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { transactionsApi } from '@/lib/api/transactions'
import type { TransactionEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function TransactionDetailsPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const transactionId = params?.id
  const { user } = useAuth()

  const [transaction, setTransaction] = useState<TransactionEntity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return
    setLoading(true)
    setError('')
    try {
      const res = await transactionsApi.getById(transactionId)
      setTransaction(res.data.transaction)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load transaction details.')
      }
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  const handleDelete = async () => {
    if (!transactionId || deleting) return
    setDeleting(true)
    try {
      await transactionsApi.delete(transactionId)
      router.push('/finances/transactions')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete transaction.')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">FINANCES / TRANSACTION</p>
            <h1>Transaction Details</h1>
            <p>Review the details and properties of this recorded financial activity.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content transaction-detail-content">
          <div className="detail-breadcrumbs">
            <Link href="/finances">
              <ArrowLeft size={13} />
              Finances
            </Link>
            <span>/</span>
            <Link href="/finances/transactions">Transactions</Link>
            <span>/</span>
            <span>{transaction ? (transaction.description || transaction.category) : `Transaction ${transactionId}`}</span>
          </div>

          {loading ? (
            <div className="transaction-empty app-section">
              <LoaderCircle size={24} className="animate-spin text-accent" />
              <div>
                <strong>Loading transaction details...</strong>
                <p>Retrieving financial record from database.</p>
              </div>
            </div>
          ) : error || !transaction ? (
            <section className="app-section transaction-unavailable">
              <div className="transaction-unavailable-icon">
                <CircleAlert size={22} />
              </div>
              <div>
                <p className="app-eyebrow">ERROR</p>
                <h2>Unable to load transaction</h2>
                <p>{error || 'The requested transaction record could not be found.'}</p>
                <div className="detail-actions">
                  <Link className="app-primary-action" href="/finances/transactions">
                    <ArrowLeft size={15} />
                    Return to transactions
                  </Link>
                  <button onClick={fetchTransaction} className="app-secondary-action">
                    Retry
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <div className="detail-hero" style={{ marginBottom: '24px' }}>
                <div>
                  <p className="app-eyebrow">
                    {transaction.type === 'income' ? '🟢 INCOME TRANSACTION' : '🔴 EXPENSE TRANSACTION'}
                    {transaction.date && ` · ${new Date(transaction.date).toLocaleDateString()}`}
                  </p>
                  <h2>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </h2>
                  <p className="detail-lede">
                    Category: <strong style={{ textTransform: 'capitalize' }}>{transaction.category}</strong>
                  </p>
                </div>

                <div className="detail-actions">
                  <Link href="/finances/transactions" className="app-secondary-action">
                    <ArrowLeft size={14} /> Back
                  </Link>
                  <Link href={`/finances/transactions/${transaction._id}/edit`} className="app-secondary-action">
                    <Pencil size={14} /> Edit
                  </Link>
                  <button
                    className="app-secondary-action"
                    type="button"
                    style={{ color: '#c2410c' }}
                    onClick={() => setConfirming(true)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>

              <section className="app-section" style={{ padding: '28px', maxWidth: '800px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '12px' }}>
                  <div>
                    <span style={{ display: 'block', color: '#858981', font: '9px var(--font-mono)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Description
                    </span>
                    <strong style={{ color: '#202321' }}>
                      {transaction.description || 'No description provided'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', color: '#858981', font: '9px var(--font-mono)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Category
                    </span>
                    <span className="category-kind" style={{ textTransform: 'capitalize' }}>
                      {transaction.category}
                    </span>
                  </div>

                  <div>
                    <span style={{ display: 'block', color: '#858981', font: '9px var(--font-mono)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Transaction Date
                    </span>
                    <strong style={{ color: '#202321' }}>
                      {new Date(transaction.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>

                  <div>
                    <span style={{ display: 'block', color: '#858981', font: '9px var(--font-mono)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Associated Project
                    </span>
                    {transaction.project ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <FolderKanban size={13} />
                        {typeof transaction.project === 'object' ? (
                          <Link href={`/projects/${transaction.project._id}`} style={{ textDecoration: 'underline' }}>
                            {transaction.project.title}
                          </Link>
                        ) : (
                          'Linked project'
                        )}
                      </span>
                    ) : (
                      <span style={{ color: '#777b74' }}>Standalone transaction</span>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #d0cfc8',
                    marginTop: '24px',
                    paddingTop: '16px',
                    display: 'flex',
                    gap: '20px',
                    color: '#858981',
                    fontSize: '10px',
                  }}
                >
                  <span>Record ID: {transaction._id}</span>
                  {transaction.createdAt && (
                    <span>Created: {new Date(transaction.createdAt).toLocaleDateString()}</span>
                  )}
                  {transaction.updatedAt && (
                    <span>Last updated: {new Date(transaction.updatedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </section>

              {confirming && (
                <div className="confirm-panel" role="alertdialog" aria-label="Delete transaction confirmation">
                  <strong>Delete this transaction?</strong>
                  <p>
                    Are you sure you want to delete this {transaction.type} transaction of ${transaction.amount.toFixed(2)}? This action cannot be undone.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{ background: '#c9472d', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                    <button type="button" onClick={() => setConfirming(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
