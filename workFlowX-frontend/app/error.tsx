'use client'
import { useEffect } from 'react'
import { WorkflowError } from '@/components/workflow-error'
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) { useEffect(() => { console.error('[v0] WorkFlowX route error', error) }, [error]); return <WorkflowError kind="500" reset={reset} /> }
