'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Home, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

type ErrorKind = '404' | '401' | '403' | '500' | 'network'

const copy: Record<ErrorKind, { code: string; title: string; description: string; icon: typeof ShieldAlert }> = {
  '404': { code: '404', title: 'This page is off the map.', description: "The page you're looking for doesn't exist, may have moved, or the address might be incorrect.", icon: Home },
  '401': { code: '401', title: "You'll need to sign in.", description: 'Your session may have expired, or you need to authenticate before accessing this resource.', icon: ShieldAlert },
  '403': { code: '403', title: 'This area is restricted.', description: "You don't have permission to access this resource. If you think this is a mistake, contact the appropriate administrator.", icon: ShieldAlert },
  '500': { code: '500', title: 'Something went wrong.', description: 'An unexpected error occurred while processing your request. Please try again in a moment.', icon: RefreshCw },
  network: { code: 'NETWORK', title: "We couldn't reach the server.", description: 'Check your connection and try again.', icon: WifiOff },
}

export function WorkflowError({ kind, reset }: { kind: ErrorKind; reset?: () => void }) {
  const [busy, setBusy] = useState(false)
  const item = copy[kind]
  const Icon = item.icon
  const retry = () => { if (!reset || busy) return; setBusy(true); reset() }
  useEffect(() => { setBusy(false) }, [reset])
  return <main className="workflow-error-page"><aside className="workflow-error-rail"><strong className="workflow-error-brand">WorkFlow<span>X</span></strong><div><p>Projects, tasks, notes, and finances in one considered workspace.</p></div><small>ERROR / RECOVERY</small></aside><section className="workflow-error-main"><div className="workflow-error-content"><div className="workflow-error-mark"><Icon size={24} aria-hidden="true" /></div><p className="workflow-error-code">{item.code}</p><h1>{item.title}</h1><p>{item.description}</p><div className="workflow-error-actions">{kind === '401' ? <Link className="workflow-primary-action" href="/login">Sign in <ArrowUpRight size={14} /></Link> : kind === '403' ? <Link className="workflow-primary-action" href="/dashboard">Return to Dashboard <ArrowUpRight size={14} /></Link> : reset ? <button className="workflow-primary-action" type="button" onClick={retry} disabled={busy}>{busy ? 'Trying again…' : kind === 'network' ? 'Retry' : 'Try Again'} <RefreshCw size={14} /></button> : <Link className="workflow-primary-action" href="/">Back to Home <Home size={14} /></Link>}{kind !== '401' && <Link className="workflow-secondary-action" href="/" onClick={(event) => { if (typeof window !== 'undefined' && window.history.length > 1) { event.preventDefault(); window.history.back() } }}><ArrowLeft size={14} /> {kind === '404' || kind === '500' || kind === 'network' ? 'Go Back' : 'Go Back'}</Link>}{kind === '401' && <Link className="workflow-secondary-action" href="/">Back to Home <Home size={14} /></Link>}</div></div></section></main>
}

export function InlineError({ title = "We couldn't load this data.", description = 'Please try again.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="workflow-inline-error" role="alert"><ShieldAlert size={17} aria-hidden="true" /><div><strong>{title}</strong><p>{description}</p>{onRetry && <button type="button" onClick={onRetry}>Retry <RefreshCw size={11} /></button>}</div></div>
}
