// File: `app/payroll/processor/page.tsx`
import React from 'react'
import SitesClient from './TasksClient'
import {HardDriveDownload, LucidePrinter, SearchSlashIcon, SearchIcon} from "lucide-react";

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
                        <span><LucidePrinter size={18} color={'green'}/></span>
                        <span><HardDriveDownload size={18} color={'green'}/></span>
                    </div>
                </div>
                <div className="panel-body p-0 flex-1 min-h-0">
                    <SitesClient/>
                </div>
            </div>
        </div>
    )
}