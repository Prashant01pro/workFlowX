'use client'

import { useParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/reset-password-form'

export default function ResetPasswordTokenPage() {
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : Array.isArray(params?.token) ? params.token[0] : ''

  return <ResetPasswordForm token={token} />
}

