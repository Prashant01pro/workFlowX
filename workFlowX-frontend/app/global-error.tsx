'use client'
import { useEffect } from 'react'
import { WorkflowError } from '@/components/workflow-error'
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error('[v0] WorkFlowX global error', error) }, [error]); return <html lang="en"><body><WorkflowError kind="500" reset={reset} /></body></html> }
