// File: `app/components/ThemeToggle.tsx`
'use client'
import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

type LightDark = 'light' | 'dark'
type RawTheme = LightDark | 'system'

function toLightDark(name?: string | null): LightDark {
  return name === 'dark' ? 'dark' : 'light'
}

export default function ThemeToggle(): React.ReactElement | null {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return <button aria-hidden="true" className="opacity-0" type="button">loading</button>

  const effective = (theme === 'system' ? toLightDark(systemTheme) : toLightDark(theme)) as LightDark

  function applyFallback(next: LightDark | 'system') {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (next !== 'system') root.classList.add(next)
  }

  function cycleTheme() {
    const next: LightDark = effective === 'dark' ? 'light' : 'dark'
    if (setTheme) {
      setTheme(next)
    } else {
      applyFallback(next)
    }
  }

  return (
    <div className="inline-flex items-center gap-2\">
      <button
        type="button"
        onClick={cycleTheme}
        aria-label="Toggle theme"
        className="px-2 py-1 border rounded"
      >
        {effective === 'dark' ? 'Dark' : 'Light'}
      </button>

      {/*<select*/}
      {/*  aria-label="Select theme"*/}
      {/*  value={(theme ?? 'system') as RawTheme}*/}
      {/*  onChange={(e) => {*/}
      {/*    const val = e.target.value as RawTheme*/}
      {/*    if (val === 'system') {*/}
      {/*      if (setTheme) setTheme('system')*/}
      {/*      else applyFallback('system')*/}
      {/*    } else {*/}
      {/*      if (setTheme) setTheme(val)*/}
      {/*      else applyFallback(val)*/}
      {/*    }*/}
      {/*  }}*/}
      {/*  className="px-2 py-1 border rounded bg-white dark:bg-gray-800"*/}
      {/*>*/}
      {/*  <option value="light">Light</option>*/}
      {/*  <option value="dark">Dark</option>*/}
      {/*</select>*/}
    </div>
  )
}
