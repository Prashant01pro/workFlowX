'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, CircleAlert, LoaderCircle, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { transactionsApi } from '@/lib/api/transactions'
import { projectsApi } from '@/lib/api/projects'
import type { ProjectEntity } from '@/lib/types'
import { ApiError } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'

const fieldNames = ['amount', 'description', 'type', 'category', 'date', 'project'] as const
type Field = (typeof fieldNames)[number]

export default function AddTransactionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const name = user?.name || 'Alex Morgan'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AM'

  const [values, setValues] = useState({
    amount: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    project: '',
  })
  const [projects, setProjects] = useState<ProjectEntity[]>([])
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    projectsApi
      .getAll({ limit: 100 })
      .then((res) => setProjects(res.projects || []))
      .catch(() => setProjects([]))
  }, [])

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setFormError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return

    const next: Partial<Record<Field, string>> = {}
    const parsedAmount = parseFloat(values.amount)

    if (!values.amount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0) {
      next.amount = 'Enter a valid positive amount greater than 0.'
    }
    if (!values.category.trim()) {
      next.category = 'Category is required.'
    } else if (values.category.trim().length < 2) {
      next.category = 'Category must be at least 2 characters.'
    } else if (values.category.trim().length > 50) {
      next.category = 'Category must be less than 50 characters.'
    }
    if (values.description.trim().length > 500) {
      next.description = 'Description cannot exceed 500 characters.'
    }
    if (!values.date) {
      next.date = 'Choose a valid transaction date.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    setFormError('')

    try {
      await transactionsApi.create({
        type: values.type,
        amount: parsedAmount,
        category: values.category.trim().toLowerCase(),
        description: values.description.trim() || undefined,
        date: new Date(values.date).toISOString(),
        project: values.project || null,
      })
      router.push('/finances/transactions')
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else if (err instanceof Error) {
        setFormError(err.message)
      } else {
        setFormError('Failed to record transaction.')
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
            <p className="app-eyebrow">FINANCES / TRANSACTIONS</p>
            <h1>Add Transaction</h1>
            <p>Record income or expenses to keep your financial activity organized.</p>
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
            <span>Add transaction</span>
          </div>

          <div className="transaction-form-layout">
            <form className="app-section transaction-form" onSubmit={submit} noValidate>
              <div className="app-section-head">
                <div>
                  <p className="app-eyebrow">NEW RECORD</p>
                  <h2>Transaction details</h2>
                </div>
              </div>

              <div className="form-fields">
                <fieldset className="transaction-type-field">
                  <legend>Transaction type</legend>
                  <div className="transaction-type-options">
                    <label className={values.type === 'expense' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="type"
                        value="expense"
                        checked={values.type === 'expense'}
                        onChange={(event) => update('type', event.target.value)}
                      />
                      Expense
                    </label>
                    <label className={values.type === 'income' ? 'selected' : ''}>
                      <input
                        type="radio"
                        name="type"
                        value="income"
                        checked={values.type === 'income'}
                        onChange={(event) => update('type', event.target.value)}
                      />
                      Income
                    </label>
                  </div>
                </fieldset>

                <div className="form-two-col">
                  <div className="field-group">
                    <label htmlFor="amount">
                      Amount <span className="required">REQUIRED</span>
                    </label>
                    <div className="money-input">
                      <span>$</span>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        inputMode="decimal"
                        value={values.amount}
                        onChange={(event) => update('amount', event.target.value)}
                        placeholder="0.00"
                        aria-invalid={Boolean(errors.amount)}
                        required
                      />
                    </div>
                    {errors.amount && <p className="field-error">{errors.amount}</p>}
                  </div>

                  <div className="field-group">
                    <label htmlFor="date">
                      Transaction date <span className="required">REQUIRED</span>
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={values.date}
                      onChange={(event) => update('date', event.target.value)}
                      aria-invalid={Boolean(errors.date)}
                      required
                    />
                    {errors.date && <p className="field-error">{errors.date}</p>}
                  </div>
                </div>

                <div className="field-group">
                  <label htmlFor="category">
                    Category <span className="required">REQUIRED</span>
                  </label>
                  <input
                    id="category"
                    value={values.category}
                    onChange={(event) => update('category', event.target.value)}
                    placeholder="e.g. software, marketing, salary, utilities, office"
                    aria-invalid={Boolean(errors.category)}
                    required
                  />
                  {errors.category && <p className="field-error">{errors.category}</p>}
                  <small style={{ color: '#858981', fontSize: '10px' }}>
                    Categories are stored lowercased and used for spending breakdowns.
                  </small>
                </div>

                <div className="field-group">
                  <label htmlFor="description">Description (optional)</label>
                  <input
                    id="description"
                    value={values.description}
                    onChange={(event) => update('description', event.target.value)}
                    placeholder="What was this transaction for?"
                    aria-invalid={Boolean(errors.description)}
                  />
                  {errors.description && <p className="field-error">{errors.description}</p>}
                </div>

                <div className="field-group">
                  <label htmlFor="project">Associated Project (optional)</label>
                  <select
                    id="project"
                    value={values.project}
                    onChange={(e) => update('project', e.target.value)}
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

                {formError && (
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
                    {formError}
                  </p>
                )}

                <div className="form-actions">
                  <Link className="app-secondary-action" href="/finances/transactions">
                    Cancel
                  </Link>
                  <button className="app-primary-action" type="submit" disabled={saving}>
                    {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Saving…' : 'Save transaction'}
                  </button>
                </div>
              </div>
            </form>

            <aside className="form-tip transaction-summary">
              <p className="app-eyebrow">SUMMARY</p>
              <h2>Review before saving.</h2>
              <p>Your summary reflects the current form values.</p>
              <div className="summary-row">
                <span>Type</span>
                <strong style={{ textTransform: 'capitalize' }}>{values.type}</strong>
              </div>
              <div className="summary-row">
                <span>Amount</span>
                <strong>{values.amount ? `$${Number(values.amount).toFixed(2)}` : '—'}</strong>
              </div>
              <div className="summary-row">
                <span>Category</span>
                <strong style={{ textTransform: 'capitalize' }}>{values.category || '—'}</strong>
              </div>
              <div className="summary-row">
                <span>Date</span>
                <strong>{values.date || '—'}</strong>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
