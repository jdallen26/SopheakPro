import './globals.css'
import ClientVendors from "@/app/components/ClientVendors"
import ThemeProvider from "@/app/components/ThemeProvider"
import React from "react"
import type { Metadata } from "next"
import Header from "@/app/shared/Header"
import Sidebar from "@/app/shared/Sidebar"
import Toast from "@/app/shared/components/Toast"

export const metadata: Metadata = {
  title: "Color Admin - Sopheak",
  description: "Minnehaha Building Maintenance inc.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <ClientVendors />
          <Toast />
          <div id="modal-root"></div>
          <div className="h-screen flex overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <Header />
              <main
                className="flex-1 overflow-auto"
                style={{
                  background: 'var(--background)',
                  padding: '5px',
                }}
              >
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
