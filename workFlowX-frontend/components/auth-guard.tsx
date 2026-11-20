'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const PUBLIC_EXACT_ROUTES = new Set([
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
  '/forbidden',
  '/network-error',
])

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT_ROUTES.has(pathname)) {
    return true
  }
  // Allow dynamic reset password routes: /reset-password/[token]
  if (pathname.startsWith('/reset-password/')) {
    return true
  }
  return false
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = isPublicRoute(pathname)

  useEffect(() => {
    if (isLoading) return

    // 1. Authenticated user visiting guest-only auth pages -> redirect to /dashboard
    if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard')
      return
    }

    // 2. Unauthenticated user visiting protected route -> redirect to /login with returnTo
    if (!isAuthenticated && !isPublic) {
      const returnTo = encodeURIComponent(pathname)
      router.replace(`/login?returnTo=${returnTo}`)
      return
    }

    // 3. Authenticated non-admin visiting /admin routes -> redirect to /forbidden
    if (isAuthenticated && pathname.startsWith('/admin') && user?.role !== 'admin') {
      router.replace('/forbidden')
      return
    }
  }, [isLoading, isAuthenticated, user, pathname, isPublic, router])

  // While checking initial session for protected routes, show loading state to avoid unauthenticated flash
  if (isLoading && !isPublic) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--background, #ebeae5)',
          color: 'var(--foreground, #202321)',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '8px' }}>
            WorkFlow<span style={{ color: 'var(--accent, #e54d2e)' }}>X</span>
          </div>
          <p style={{ fontSize: '12px', color: '#747874', letterSpacing: '0.05em' }}>
            INITIALIZING WORKSPACE…
          </p>
        </div>
      </div>
    )
  }

  // Prevent rendering protected content if unauthenticated
  if (!isLoading && !isAuthenticated && !isPublic) {
    return null
  }

  // Prevent rendering admin content if unauthorized
  if (!isLoading && isAuthenticated && pathname.startsWith('/admin') && user?.role !== 'admin') {
    return null
  }

  return <>{children}</>
}

