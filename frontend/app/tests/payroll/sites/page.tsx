// File: `app/tests/payroll/sites/page.tsx`
import React from 'react'
import SitesClient from './SitesClients'

export default function SitesPage(): React.ReactElement {
    return (
        <div className="flex flex-col flex-1 min-h-0 h-full">
            <div className="sticky-top flex items center px-2 font-bold text-xl"
            >
                Payroll Site Selection List
            </div>
            <hr/>
            <div className="flex-1 min-h-0 ">
                <SitesClient/>
            </div>
        </div>
    )
}