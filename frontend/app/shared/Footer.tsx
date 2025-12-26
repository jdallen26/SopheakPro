'use client'
import React from 'react'

export default function Footer(): React.ReactElement {
    return (
        <footer
            className="flex items-center justify-center px-4"
            style={{
                height: 'var(--footer-height)',
                background: 'var(--background)',
                borderTop: '1px solid var(--border-color)',
                color: 'var(--foreground-muted)',
                fontSize: '9px',
                marginTop: '-8px'
            }}
        >
            <span style={{
            }}>&copy; {new Date().getFullYear()} Sopheak. All rights reserved.</span>
        </footer>
    )
}
