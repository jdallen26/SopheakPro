import React from 'react'
import SitesClient from './processor/TasksClient'

export default function PayrollProcessorPage(): React.ReactElement {
    return (
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
