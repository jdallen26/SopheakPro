'use client'
import React, {useState} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
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
    ChevronsLeft, ChevronsRight, SquareMenuIcon
} from 'lucide-react'


import { SiTestinglibrary  } from "react-icons/si";
import { MdOutlineSpaceDashboard } from "react-icons/md"


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
    {id: 'home', label: 'Dashboard', icon: <MdOutlineSpaceDashboard size={18}/>, href: '/'},
    // {id: 'accounting', label: 'Accounting', icon: <Calculator size={18}/>, href: '/accounting'},
    {
        id: 'payroll',
        label: 'Payroll',
        icon: <DollarSign size={18}/>,
        children: [
            // {id: 'payroll-sites', label: 'Site List', icon: <Building2 size={16}/>, href: '/tests/payroll/sites'},
            {id: 'payroll-processor', label: 'Payroll Processor', icon: <Play size={16}/>, href: '/payroll/processor'},
        ],
    },
    // {id: 'hr', label: 'HR', icon: <Users size={18}/>, href: '/hr'},
    // {
    //     id: 'routing',
    //     label: 'Routing',
    //     icon: <Route size={18}/>,
    //     children: [
    //         {id: 'routing-map', label: 'Live Map', icon: <Map size={16}/>, href: '/routing/map'},
    //         {id: 'routing-planner', label: 'Route Planner', icon: <Play size={16}/>, href: '/routing/planner'},
    //     ],
    // },
    // {id: 'customers', label: 'Customers', icon: <BookUser size={18}/>, href: '/customers'},
    // {id: 'invoicing', label: 'Invoicing', icon: <FileText size={18}/>, href: '/invoicing'},
    // {
    //     id: 'reports',
    //     label: 'Reports',
    //     icon: <BarChart3 size={18}/>,
    //     children: [
    //         {id: 'reports-sales', label: 'Sales Report', icon: <UserCircle size={16}/>, href: '/reports/sales'},
    //         {
    //             id: 'reports-performance',
    //             label: 'Performance Report',
    //             icon: <UserCircle size={16}/>,
    //             href: '/reports/performance'
    //         },
    //     ],
    // },
    // {id: 'settings', label: 'Settings Page', icon: <Settings size={18}/>, href: '/settings'},
    // {id: 'calendar', label: 'Calendar', icon: <Calendar size={18}/>, href: '/calendar'},
    // {id: 'login', label: 'Login', icon: <LogIn size={18}/>, href: '/login'},
    // {id: 'profile', label: 'Profile', icon: <UserCircle size={18}/>, href: '/profile'},
    // {id: 'kanban', label: 'Kanban Board', icon: <LayoutGrid size={18}/>, href: '/kanban'},
    // {id: 'ControlTesting', label: 'Control Testing', icon: <SiTestinglibrary size={18}/>, href: '/control-testing'},
]

export default function Sidebar(): React.ReactElement {
    const [open, setOpen] = useState<Record<string, boolean>>({})
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    function toggle(id: string) {
        setOpen((s) => ({...s, [id]: !s[id]}))
    }

    function isActive(href?: string): boolean {
        if (!href) return false
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    return (
        <aside
            className="hidden md:flex flex-col h-full transition-all duration-300 z-50"
            style={{
                width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                background: 'var(--background-secondary)',
                borderRight: '1px solid var(--border-color)',
            }}
        >
            <div
                className="flex items-center gap-3"
                style={{
                    height: 'var(--header-height)',
                    background: 'var(--background-tertiary)',
                    borderBottom: '1px solid var(--border-color)',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    paddingLeft: isCollapsed ? '0' : '5px',
                    paddingRight: isCollapsed ? '0' : '5px',
                }}
            >
                {!isCollapsed && (
                    <span className="text-base font-semibold" style={{color: 'var(--foreground)'}}>
                      Sopheak
                    </span>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-full flex items-center justify-center transition-colors hover:bg-[var(--hover-bg)]"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? <ChevronsRight size={18}/> : <ChevronsLeft size={18}/>}
                </button>
            </div>

            <div
                className={`flex items-center gap-3 py-3 ${isCollapsed ? 'justify-center' : ''}`}
                style={{
                    background: 'var(--background-tertiary)',
                    marginBottom: '2px',
                    paddingBottom: '5px',
                    paddingTop: '5px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingLeft: isCollapsed ? '0' : '5px',
                    paddingRight: isCollapsed ? '0' : '5px',

                }}
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                    style={{background: 'var(--teal)', color: 'white'}}
                >
                    JA
                </div>
                {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{color: 'var(--foreground)'}}>Jay Allen
                        </div>
                        <div className="text-xs truncate" style={{color: 'var(--foreground-muted)'}}>Full-Stack
                            Developer
                        </div>
                    </div>
                )}
            </div>

            <div className={`py-2 ${isCollapsed ? 'text-center' : ''}`} style={{paddingLeft: isCollapsed ? '0' : '5px', paddingRight: isCollapsed ? '0' : '5px'}}>
                <div
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{color: 'var(--foreground-muted)'}}
                >
                    {isCollapsed ? 'Nav' : 'Navigation'}
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden">
                <ul className="list-none p-0 m-0">
                    {MENU.map((m) => {
                        const hasChildren = Array.isArray(m.children) && m.children.length > 0
                        const active = isActive(m.href) || (hasChildren && m.children?.some(c => isActive(c.href)))
                        const isOpen = open[m.id]

                        return (
                            <li key={m.id} className="relative" title={isCollapsed ? m.label : undefined}>
                                {hasChildren ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => toggle(m.id)}
                                            className={`w-full flex items-center gap-3 py-2.5 transition-colors text-left ${isCollapsed ? 'justify-center' : ''}`}
                                            style={{
                                                color: active ? 'var(--active-text)' : 'var(--foreground-secondary)',
                                                background: active ? 'var(--active-bg)' : 'transparent',
                                                borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
                                                paddingLeft: isCollapsed ? '0' : '5px',
                                                paddingRight: isCollapsed ? '0' : '5px',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.background = 'var(--hover-bg)'
                                                    e.currentTarget.style.color = 'var(--foreground)'
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!active) {
                                                    e.currentTarget.style.background = 'transparent'
                                                    e.currentTarget.style.color = 'var(--foreground-secondary)'
                                                }
                                            }}
                                        >
                                            <span>{m.icon}</span>
                                            {!isCollapsed && (
                                                <span className="flex-1 text-sm">{m.label}</span>
                                            )}
                                            {!isCollapsed && (
                                                isOpen ? <ChevronDown size={14}/> : <ChevronRight size={14}/>
                                            )}
                                        </button>
                                        <ul
                                            className="overflow-hidden transition-all"
                                            style={{
                                                maxHeight: isOpen ? `${m.children!.length * 40}px` : '0',
                                                background: 'var(--background)',
                                            }}
                                        >
                                            {m.children!.map((c) => {
                                                const childActive = isActive(c.href)
                                                return (
                                                    <li key={c.id}>
                                                        <Link
                                                            href={c.href || '#'}
                                                            className={`flex items-center gap-3 py-2.5 transition-colors w-full ${isCollapsed ? 'justify-center' : ''}`}
                                                            style={{
                                                                background: childActive ? 'var(--active-bg)' : 'transparent',
                                                                color: childActive ? 'var(--active-text)' : 'var(--foreground-secondary)',
                                                                paddingLeft: isCollapsed ? '20px' : '44px',
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (!childActive) {
                                                                    e.currentTarget.style.background = 'var(--hover-bg)'
                                                                    e.currentTarget.style.color = 'var(--foreground)'
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (!childActive) {
                                                                    e.currentTarget.style.background = 'transparent'
                                                                    e.currentTarget.style.color = 'var(--foreground-secondary)'
                                                                }
                                                            }}
                                                        >
                                                            <span>{c.icon}</span>
                                                            {!isCollapsed && (
                                                                <span className="flex-1 text-sm">{c.label}</span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </>
                                ) : (
                                    <Link
                                        href={m.href || '#'}
                                        className={`flex items-center gap-3 py-2.5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                                        style={{
                                            background: active ? 'var(--active-bg)' : 'transparent',
                                            color: active ? 'var(--active-text)' : 'var(--foreground-secondary)',
                                            borderLeft: active ? '3px solid var(--teal)' : '3px solid transparent',
                                            paddingLeft: isCollapsed ? '0' : '5px',
                                            paddingRight: isCollapsed ? '0' : '5px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'var(--hover-bg)'
                                                e.currentTarget.style.color = 'var(--foreground)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!active) {
                                                e.currentTarget.style.background = 'transparent'
                                                e.currentTarget.style.color = 'var(--foreground-secondary)'
                                            }
                                        }}
                                    >
                                        <span>{m.icon}</span>
                                        {!isCollapsed && (
                                            <span className="flex-1 text-sm">{m.label}</span>
                                        )}
                                        {!isCollapsed && m.badge && (
                                            <span
                                                className="px-2 py-0.5 text-xs rounded-full"
                                                style={{
                                                    background: m.badgeColor || 'var(--teal)',
                                                    color: 'white'
                                                }}
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
