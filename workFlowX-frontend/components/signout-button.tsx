'use client'

import React, { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function SignOutButton({
  className = 'app-signout',
  onClick,
  children,
}: {
  className?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  const { logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSignOut(e: React.MouseEvent) {
    e.preventDefault()
    if (loggingOut) return
    setLoggingOut(true)
    if (onClick) onClick()
    try {
      await logout()
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleSignOut}
      disabled={loggingOut}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        cursor: 'pointer',
      }}
    >
      {children || (
        <>
          <LogOut size={16} />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </>
      )}
    </button>
  )
}

