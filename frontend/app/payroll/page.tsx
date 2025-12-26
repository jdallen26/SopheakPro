import React from 'react'
import SitesClient from './processor/TasksClient'

export default function PayrollProcessorPage(): React.ReactElement {
    return (
        // <div className="flex flex-col flex-1 min-h-0 h-full">
        //     <div className="flex items-center gap-3 mb-4">
        //         <h1
        //             className="text-2xl font-medium"
        //             style={{color: 'var(--foreground)'}}
        //         >
        //             Payroll Processing
        //         </h1>
        //     </div>
        //     <div
        //         className="google-card flex-1 min-h-0 overflow-hidden"
        //         style={{background: 'var(--card-bg)'}}
        //     >
        //         <SitesClient/>
        //     </div>
        <div className="panel">
            <div className="panel-heading flex items-center justify-between">
                <span>Recent Invoices</span>
                <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                </div>
            </div>
            <div className="panel-body p-0">
                <SitesClient/>
            </div>
        </div>
    )
}
