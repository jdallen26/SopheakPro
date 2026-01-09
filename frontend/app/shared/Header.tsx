'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Search, Bell, Settings, Sun, Moon, Monitor, Menu} from 'lucide-react'

export default function Header(): React.ReactElement {
  const settingsRef = useRef<HTMLDivElement | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const themeOptions = [
    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
    { value: 'system', label: 'System', icon: <Monitor size={14} /> },
  ]

  return (
    <header
      className="sticky top-0 z-50 flex items-center px-4"
      style={{
        height: 'var(--header-height)',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <button
        type="button"
        className="md:hidden p-2 rounded transition-colors mr-2"
        style={{ color: 'var(--foreground-secondary)' }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 flex justify-center">
        <div
          className="flex items-center h-8 rounded px-3 gap-2 w-full max-w-md"
          style={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Search size={16} style={{ color: 'var(--foreground-muted)', marginLeft: '4px' }} />
          <input
            type="search"
            placeholder="Search"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--foreground)', marginLeft: '-4px' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
       {/*<button*/}
       {/*   type="button"*/}
       {/*   className="p-2 rounded transition-colors relative"*/}
       {/*   style={{ color: 'var(--foreground-secondary)' }}*/}
       {/*   onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}*/}
       {/*   onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}*/}
       {/* >*/}
       {/*   <Bell size={20} />*/}
       {/* </button>*/}

        {/*<div className="relative" ref={settingsRef}>*/}
        {/*  <button*/}
        {/*    type="button"*/}
        {/*    onClick={() => setSettingsOpen(!settingsOpen)}*/}
        {/*    className="p-2 rounded transition-colors"*/}
        {/*    style={{*/}
        {/*      color: 'var(--foreground-secondary)',*/}
        {/*      background: settingsOpen ? 'var(--hover-bg)' : 'transparent',*/}
        {/*    }}*/}
        {/*    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}*/}
        {/*    onMouseLeave={(e) => {*/}
        {/*      if (!settingsOpen) e.currentTarget.style.background = 'transparent'*/}
        {/*    }}*/}
        {/*  >*/}
        {/*    <Settings size={20} />*/}
        {/*  </button>*/}

        {/*  {settingsOpen && (*/}
        {/*    <div*/}
        {/*      className="absolute right-0 top-full mt-1 w-48 rounded overflow-hidden z-50"*/}
        {/*      style={{*/}
        {/*        background: 'var(--card-bg)',*/}
        {/*        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',*/}
        {/*        border: '1px solid var(--border-color)',*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <div className="p-2 border-b" style={{ borderColor: 'var(--border-color)' }}>*/}
        {/*        <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>*/}
        {/*          Theme*/}
        {/*        </div>*/}
        {/*        <div className="flex gap-1">*/}
        {/*          {mounted && themeOptions.map((opt) => (*/}
        {/*            <button*/}
        {/*              key={opt.value}*/}
        {/*              onClick={() => setTheme(opt.value)}*/}
        {/*              className="flex-1 flex flex-col items-center gap-1 p-1.5 rounded transition-colors"*/}
        {/*              style={{*/}
        {/*                background: theme === opt.value ? 'var(--active-bg)' : 'transparent',*/}
        {/*                color: theme === opt.value ? 'var(--teal)' : 'var(--foreground-secondary)',*/}
        {/*              }}*/}
        {/*              onMouseEnter={(e) => {*/}
        {/*                if (theme !== opt.value) e.currentTarget.style.background = 'var(--hover-bg)'*/}
        {/*              }}*/}
        {/*              onMouseLeave={(e) => {*/}
        {/*                if (theme !== opt.value) e.currentTarget.style.background = 'transparent'*/}
        {/*              }}*/}
        {/*            >*/}
        {/*              {opt.icon}*/}
        {/*              <span className="text-[10px]">{opt.label}</span>*/}
        {/*            </button>*/}
        {/*          ))}*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  )}*/}
        {/*</div>*/}

        {/*<div className="flex items-center gap-2 ml-2 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>*/}
        {/*  <div*/}
        {/*    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer"*/}
        {/*    style={{ background: 'var(--teal)', color: 'white' }}*/}
        {/*  >*/}
        {/*    JA*/}
        {/*  </div>*/}
        {/*  <span className="text-sm hidden lg:block" style={{ color: 'var(--foreground)', paddingRight: '5px'}}>*/}
        {/*    Jay Allen*/}
        {/*  </span>*/}
        {/*</div>*/}
      </div>
    </header>
  )
}
