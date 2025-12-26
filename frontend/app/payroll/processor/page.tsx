// File: `app/payroll/processor/page.tsx`
import React from 'react'
import SitesClient from './TasksClient'

export default function PayrollProcessorPage(): React.ReactElement {
    return (
        <div
            className="flex flex-col flex-1 min-h-0 h-full">
            <div className="panel flex flex-col flex-1 min-h-0">
                <div className="panel-heading flex items-center justify-between"
                style={{
                    paddingLeft: '8px',
                }}>
                    <span>Payroll Processing</span>
                    <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    </div>
                </div>
                <div className="panel-body p-0 flex-1 min-h-0">
                    <SitesClient/>
                </div>
            </div>
        </div>
    )
}
