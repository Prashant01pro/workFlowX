'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CircleAlert,
  LoaderCircle,
  Save,
} from 'lucide-react'
import { FormEvent, useEffect, useState, useCallback } from 'react'
import { transactionsApi } from '@/lib/api/transactions'
import { projectsApi } from '@/lib/api/projects'
import type { ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const transactionId = params?.id
  const { user } = useAuth()

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projects, setProjects] = useState<ProjectEntity[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const loadData = useCallback(async () => {
    if (!transactionId) return
    setLoading(true)
    setError('')
    try {
      const [txRes, projectsRes] = await Promise.all([
        transactionsApi.getById(transactionId),
        projectsApi.getAll({ limit: 100 }).catch(() => ({ projects: [] })),
      ])
      const tx = txRes.data.transaction
      setType(tx.type)
      setAmount(String(tx.amount))
      setCategory(tx.category)
      setDescription(tx.description || '')
      setDate(tx.date ? new Date(tx.date).toISOString().slice(0, 10) : '')
      if (tx.project) {
        setProjectId(typeof tx.project === 'object' ? tx.project._id : tx.project)
      }
      setProjects(projectsRes.projects || [])
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load transaction.')
      }
    } finally {
      setLoading(false)
    }
  }, [transactionId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || !transactionId) return

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid positive amount greater than 0.')
      return
    }
    if (!category.trim()) {
      setError('Category is required.')
      return
    }
    if (category.trim().length < 2 || category.trim().length > 50) {
      setError('Category must be between 2 and 50 characters.')
      return
    }
    if (description.trim().length > 500) {
      setError('Description cannot exceed 500 characters.')
      return
    }
    if (!date) {
      setError('Please select a transaction date.')
      return
    }

    setSaving(true)
    setError('')

    try {
      await transactionsApi.update(transactionId, {
        type,
        amount: parsedAmount,
        category: category.trim().toLowerCase(),
        description: description.trim() || undefined,
        date: new Date(date).toISOString(),
        project: projectId || null,
      })
      router.push(`/finances/transactions/${transactionId}`)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to update transaction.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        <header className="app-header">
          <div>
            <p className="app-eyebrow">FINANCES / TRANSACTION / EDIT</p>
            <h1>Edit Transaction</h1>
            <p>Update the recorded details of this financial movement.</p>
          </div>
          <span className="app-avatar app-avatar-light">{initials}</span>
        </header>

        <div className="app-content transaction-form-content">
          <div className="detail-breadcrumbs">
            <Link href="/finances">
              <ArrowLeft size={13} />
              Finances
            </Link>
            <span>/</span>
            <Link href="/finances/transactions">Transactions</Link>
            <span>/</span>
            <Link href={`/finances/transactions/${transactionId}`}>Details</Link>
            <span>/</span>
            <span>Edit</span>
          </div>

          {loading ? (
            <div className="transaction-empty app-section">
              <LoaderCircle size={24} className="animate-spin text-accent" />
              <div>
                <strong>Loading transaction...</strong>
                <p>Retrieving current values.</p>
              </div>
            </div>
          ) : (
            <div className="transaction-form-layout">
              <form className="app-section transaction-form" onSubmit={submit} noValidate>
                <div className="app-section-head">
                  <div>
                    <p className="app-eyebrow">EDIT RECORD</p>
                    <h2>Update details</h2>
                  </div>
                </div>

                <div className="form-fields">
                  <fieldset className="transaction-type-field">
                    <legend>Transaction type</legend>
                    <div className="transaction-type-options">
                      <label className={type === 'expense' ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="type"
                          value="expense"
                          checked={type === 'expense'}
                          onChange={(e) => setType(e.target.value as any)}
                        />
                        Expense
                      </label>
                      <label className={type === 'income' ? 'selected' : ''}>
                        <input
                          type="radio"
                          name="type"
                          value="income"
                          checked={type === 'income'}
                          onChange={(e) => setType(e.target.value as any)}
                        />
                        Income
                      </label>
                    </div>
                  </fieldset>

                  <div className="form-two-col">
                    <div className="field-group">
                      <label htmlFor="edit-amount">
                        Amount <span className="required">REQUIRED</span>
                      </label>
                      <div className="money-input">
                        <span>$</span>
                        <input
                          id="edit-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label htmlFor="edit-date">
                        Transaction date <span className="required">REQUIRED</span>
                      </label>
                      <input
                        id="edit-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label htmlFor="edit-category">
                      Category <span className="required">REQUIRED</span>
                    </label>
                    <input
                      id="edit-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. software, marketing, utilities"
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="edit-description">Description (optional)</label>
                    <input
                      id="edit-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this transaction for?"
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="edit-project">Associated Project (optional)</label>
                    <select
                      id="edit-project"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      style={{
                        height: '40px',
                        background: '#f0eee8',
                        border: '1px solid #bfc0b9',
                        padding: '0 12px',
                        fontSize: '11px',
                        color: '#202321',
                        width: '100%',
                      }}
                    >
                      <option value="">None (Standalone transaction)</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {error && (
                    <p
                      className="form-error"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#c2410c',
                        marginTop: '10px',
                      }}
                    >
                      <CircleAlert size={15} />
                      {error}
                    </p>
                  )}

                  <div className="form-actions">
                    <Link className="app-secondary-action" href={`/finances/transactions/${transactionId}`}>
                      Cancel
                    </Link>
                    <button className="app-primary-action" type="submit" disabled={saving}>
                      {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </div>
              </form>

              <aside className="form-tip transaction-summary">
                <p className="app-eyebrow">PREVIEW</p>
                <h2>Updated summary</h2>
                <div className="summary-row">
                  <span>Type</span>
                  <strong style={{ textTransform: 'capitalize' }}>{type}</strong>
                </div>
                <div className="summary-row">
                  <span>Amount</span>
                  <strong>{amount ? `$${Number(amount).toFixed(2)}` : '—'}</strong>
                </div>
                <div className="summary-row">
                  <span>Category</span>
                  <strong style={{ textTransform: 'capitalize' }}>{category || '—'}</strong>
                </div>
                <div className="summary-row">
                  <span>Date</span>
                  <strong>{date || '—'}</strong>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
