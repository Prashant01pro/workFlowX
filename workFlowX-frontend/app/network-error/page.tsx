'use client'
import { WorkflowError } from '@/components/workflow-error'
export default function NetworkErrorPage() { return <WorkflowError kind="network" reset={() => window.location.reload()} /> }
