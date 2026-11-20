'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, Laptop, ShieldCheck, UserRound } from 'lucide-react'

export function SettingsLayout({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { href: '/settings/profile', label: 'Profile', icon: UserRound },
    { href: '/settings/security', label: 'Security', icon: ShieldCheck },
    { href: '/settings/sessions', label: 'Sessions', icon: Laptop },
  ]

  return (
    <div className="settings-page">
      <header className="settings-header">
        <Link href="/dashboard" className="settings-back">
          <ArrowLeft size={14} /> Workspace
        </Link>
        <div>
          <p className="app-eyebrow">ACCOUNT</p>
          <h1>{title}</h1>
          <p>{eyebrow}</p>
        </div>
      </header>
      <nav className="settings-tabs" aria-label="Account settings">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={15} /> {tab.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
