'use client'
import React from 'react'
import { ThemeProvider as NextThemeProvider } from 'next-themes'

type Props = { children: React.ReactNode }

export default function ThemeProvider({ children }: Props) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemeProvider>
  )
}