'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/reset-password-form'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || searchParams.get('code') || ''

  return <ResetPasswordForm token={token} />
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
