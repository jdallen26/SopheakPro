'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Calculator,
  DollarSign,
  Users,
  Route,
  BookUser,
  FileText,
  ChevronRight,
  ChevronDown,
  Building2,
  Play,
  Settings,
  Map,
  UserCircle,
  BarChart3,
  Calendar,
  LayoutGrid,
  LogIn,
} from 'lucide-react'

type MenuItem = {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  badge?: string
  badgeColor?: string
  children?: MenuItem[]
}

const MENU: MenuItem[] = [
  { id: 'home', label: 'Dashboard', icon: <Home size={18} />, href: '/' },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={18} />, href: '/accounting' },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: <DollarSign size={18} />,
    children: [
      { id: 'payroll-sites', label: 'Site List', icon: <Building2 size={16} />, href: '/tests/payroll/sites' },
      { id: 'payroll-run', label: 'Run Payroll', icon: <Play size={16} />, href: '/payroll/processor' },
      { id: 'payroll-settings', label: 'Settings', icon: <Settings size={16} />, href: '/payroll/settings' },
    ],
  },
  { id: 'hr', label: 'HR', icon: <Users size={18} />, href: '/hr' },
  {
    id: 'routing',
    label: 'Routing',
    icon: <Route size={18} />,
    children: [
      { id: 'routes', label: 'Routes', icon: <Map size={16} />, href: '/routing/routes' },
      { id: 'drivers', label: 'Drivers', icon: <UserCircle size={16} />, href: '/routing/drivers' },
    ],
  },
  { id: 'customers', label: 'Customers', icon: <BookUser size={18} />, href: '/customers' },
  { id: 'invoicing', label: 'Invoicing', icon: <FileText size={18} />, href: '/invoicing' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, href: '/reports' },
  { id: 'calendar', label: 'Calendar', icon: <Calendar size={18} />, href: '/calendar' },
  { id: 'scrum', label: 'Scrum Board', icon: <LayoutGrid size={18} />, href: '/scrum-board', badge: 'NEW', badgeColor: '#00acac' },
  { id: 'settings', label: 'Settings Page', icon: <Settings size={18} />, href: '/settings' },
  { id: 'login', label: 'Login & Register', icon: <LogIn size={18} />, href: '/auth/login' },
]

export default function Sidebar(): React.ReactElement {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const pathname = usePathname()

  function toggle(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }))
  }

  function isActive(href?: string): boolean {
    if (!href) return false
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden md:flex flex-col h-full"
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--sidebar-bg)',
        minWidth: 'var(--sidebar-width)',
      }}
    >
      <div
        className="flex items-center gap-3 px-4"
        style={{
          height: 'var(--header-height)',
          background: 'var(--sidebar-menu-bg)',
        }}
      >
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'var(--teal)' }}
        >
          S
        </div>
        <span className="text-base font-semibold text-white">
          Sopheak
        </span>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'var(--sidebar-menu-bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
          style={{ background: 'var(--teal)', color: 'white' }}
        >
          SN
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white truncate">Sean Ngu</div>
          <div className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>Frontend developer</div>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sidebar-text)' }}>
          Navigation
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ul className="list-none p-0 m-0">
          {MENU.map((m) => {
            const hasChildren = Array.isArray(m.children) && m.children.length > 0
            const active = isActive(m.href) || (hasChildren && m.children?.some(c => isActive(c.href)))
            const isOpen = open[m.id]

            return (
              <li key={m.id}>
                {hasChildren ? (
                  <>
                    <button
                      type="button"
                      onClick={() => toggle(m.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                      style={{
                        background: active ? 'var(--sidebar-menu-bg)' : 'transparent',
                        color: active ? 'var(--sidebar-text-hover)' : 'var(--sidebar-text)',
                        borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--sidebar-menu-bg)'
                        e.currentTarget.style.color = 'var(--sidebar-text-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--sidebar-text)'
                        }
                      }}
                    >
                      <span>{m.icon}</span>
                      <span className="flex-1 text-sm">{m.label}</span>
                      {m.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ background: m.badgeColor }}
                        >
                          {m.badge}
                        </span>
                      )}
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <ul
                      className="overflow-hidden transition-all"
                      style={{
                        maxHeight: isOpen ? '500px' : '0',
                        background: 'var(--sidebar-menu-bg)',
                      }}
                    >
                      {m.children!.map((c) => {
                        const childActive = isActive(c.href)
                        return (
                          <li key={c.id}>
                            <Link
                              href={c.href || '#'}
                              className="flex items-center gap-3 pl-11 pr-4 py-2 transition-colors text-sm"
                              style={{
                                color: childActive ? 'var(--sidebar-text-hover)' : 'var(--sidebar-text)',
                                background: childActive ? 'rgba(0, 172, 172, 0.1)' : 'transparent',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--sidebar-text-hover)'
                              }}
                              onMouseLeave={(e) => {
                                if (!childActive) {
                                  e.currentTarget.style.color = 'var(--sidebar-text)'
                                }
                              }}
                            >
                              <span>{c.label}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={m.href || '#'}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{
                      background: active ? 'var(--sidebar-menu-bg)' : 'transparent',
                      color: active ? 'var(--sidebar-text-hover)' : 'var(--sidebar-text)',
                      borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--sidebar-menu-bg)'
                      e.currentTarget.style.color = 'var(--sidebar-text-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--sidebar-text)'
                      }
                    }}
                  >
                    <span>{m.icon}</span>
                    <span className="flex-1 text-sm">{m.label}</span>
                    {m.badge && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ background: m.badgeColor }}
                      >
                        {m.badge}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
