'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/reset-password-form'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || searchParams.get('code') || ''

  return <ResetPasswordForm token={token} />
}
