import React from 'react'
import SitesClient from './TasksClient'

export default function PayrollProcessorPage(): React.ReactElement {
    return (
        <div className="flex flex-col flex-1 min-h-0 h-full">
            <div className="flex items-center gap-3 mb-4">
                <h1 
                    className="text-2xl font-medium"
                    style={{ color: 'var(--foreground)' }}
                >
                    Payroll Processing
                </h1>
            </div>
            <div 
                className="google-card flex-1 min-h-0 overflow-hidden"
                style={{ background: 'var(--card-bg)' }}
            >
                <SitesClient />
            </div>
        </div>
    )
}
