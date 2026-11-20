'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, LayoutDashboard, Users } from 'lucide-react'

export function AdminLayout({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isOverview = pathname === '/admin'
  const isUsers = pathname.startsWith('/admin/users')

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link href="/dashboard" className="admin-back">
          <ArrowLeft size={14} /> Workspace
        </Link>
        <p className="app-eyebrow">ADMINISTRATION</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <nav className="admin-tabs" aria-label="Administration">
        <Link
          href="/admin"
          className={isOverview ? 'active' : ''}
          aria-current={isOverview ? 'page' : undefined}
        >
          <LayoutDashboard size={15} /> Overview
        </Link>
        <Link
          href="/admin/users"
          className={isUsers ? 'active' : ''}
          aria-current={isUsers ? 'page' : undefined}
        >
          <Users size={15} /> Users
        </Link>
      </nav>
      {children}
    </main>
  )
}
