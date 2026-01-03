/* File: app/tests/payroll/sites/SitesClients.tsx */
'use client'
import React, {useEffect, useRef, useState} from 'react'

interface Site {
    cust_id: string
    company: string
    weekof: string | null
    cod: boolean
    mailto: boolean
    taxable: boolean
    voucher: boolean
    other_bill: boolean
    adv_bill: boolean
    in_monthly: boolean
}

function normalizeResponse(parsed: unknown): Site[] {
    if (Array.isArray(parsed)) return parsed as Site[]
    if (parsed && typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>
        if (Array.isArray(obj.sites)) return obj.sites as Site[]
        if (Array.isArray(obj.data)) return obj.data as Site[]
        if (Array.isArray(obj.results)) return obj.results as Site[]
    }
    return []
}

export default function SitesClient(): React.ReactElement {
    const [sites, setSites] = useState<Site[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(false)

    useEffect(() => {
        const ac = new AbortController()
        mountedRef.current = true

        async function fetchSites() {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '')
                const url = `${API_BASE}/api/payroll/sites/?show_all=1&refresh=1`
                const res = await fetch(url, {signal: ac.signal, cache: 'no-store'})
                const text = await res.text()
                const contentType = res.headers.get('content-type') || ''

                if (!res.ok) {
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError(`Fetch failed: ${res.status}`)
                        setSites([])
                    }
                    return
                }

                if (!contentType.includes('application/json')) {
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError('Invalid content-type, expected JSON')
                        setSites([])
                    }
                    return
                }

                let parsed: unknown
                try {
                    parsed = JSON.parse(text)
                } catch {
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError('Failed to parse JSON')
                        setSites([])
                    }
                    return
                }

                const normalized = normalizeResponse(parsed)
                if (!ac.signal.aborted && mountedRef.current) setSites(normalized)
            } catch (err: unknown) {
                const name = (err as { name?: string }).name
                if (name === 'AbortError') return
                if (mountedRef.current) setError(String(err))
            }
        }

        fetchSites()

        return () => {
            mountedRef.current = false
            ac.abort()
        }
    }, [])

    if (error) return <p className="p-4 text-red-600">Error: {error}</p>
    if (sites === null) return <p className="p-4">Loading…</p>
    if (sites.length === 0) return <p className="p-4">No sites found.</p>

    const columns = [
        {key: 'cust_id', label: 'CustID', width: '72px', stickyLeft: false},
        {key: 'company', label: 'Company', width: '360px', stickyLeft: false},
        {key: 'cod', label: 'COD', width: '72px', stickyLeft: false},
        {key: 'mailto', label: 'MailTo', width: '72px', stickyLeft: false},
        {key: 'taxable', label: 'Taxable', width: '80px', stickyLeft: false},
        {key: 'voucher', label: 'Voucher', width: '80px', stickyLeft: false},
        {key: 'other_bill', label: 'Other Bill', width: '100px', stickyLeft: false},
        {key: 'adv_bill', label: 'Advanced Billing', width: '140px', stickyLeft: false},
        {key: 'in_monthly', label: 'In Monthly Table', width: '140px', stickyLeft: false},
    ] as const

    const totalMinWidth = columns.reduce((acc, c) => acc + parseInt(c.width, 10), 0)

    return (
        <div className="w-full h-full min-h-0 table-scroll">
            <table
                className="table-auto border-collapse shadow-md rounded-lg"
                style={{minWidth: totalMinWidth + 'px', width: '100%', margin: 0}}
            >
                <thead className="sticky-top border-b border-gray-200 bg-gray-200">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-2 text-left text-sm uppercase tracking-wider border-b"
                                style={{
                                    paddingTop: '0px',
                                    position: 'sticky',
                                    top: 'var(--header-height)',
                                    zIndex: col.stickyLeft ? 4 : 2,
                                    left: col.stickyLeft ? 0 : undefined,
                                    minWidth: col.width,
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    backgroundColor: 'var(--background, white)',
                                }}
                            >
                                <div style={{maxWidth: `100%`}} title={col.label}>
                                    {col.label}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                    {sites.map((site) => (
                        <tr key={site.cust_id} className="light:hover:bg-gray-200 dark:hover:bg-gray-200">
                            {columns.map((col) => {
                                const rawValue =
                                    col.key === 'cust_id'
                                        ? site.cust_id
                                        : col.key === 'company'
                                            ? site.company
                                            : Boolean((site as Site)[col.key]) // boolean fields

                                const isBoolean = ['cod', 'mailto', 'taxable', 'voucher', 'other_bill', 'adv_bill', 'in_monthly'].includes(col.key)

                                return (
                                    <td
                                        key={col.key}
                                        className="px-2 py-1"
                                        style={{
                                            minWidth: col.width,
                                            position: col.stickyLeft ? 'sticky' : undefined,
                                            left: col.stickyLeft ? 0 : undefined,
                                            zIndex: col.stickyLeft ? 3 : 0,
                                            borderTop: '1px solid #e5e7eb',
                                            borderRight: '2px solid #e5e7eb',
                                            fontSize: '12px',
                                            background: col.stickyLeft ? 'var(--background, white)' : undefined,
                                        }}
                                    >
                                        <div
                                            style={
                                                isBoolean
                                                    ? {
                                                        width: '100%',
                                                        marginLeft: 0,
                                                        paddingLeft: 0,
                                                        boxSizing: 'border-box',
                                                        maxWidth: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'flex-start',
                                                    }
                                                    : {
                                                        display: 'inline-block',
                                                        boxSizing: 'border-box',
                                                        marginLeft: 0,
                                                        paddingLeft: 0,
                                                        maxWidth: 'none',
                                                        whiteSpace: 'nowrap',
                                                    }
                                            }
                                            title={String(rawValue)}
                                        >
                                            {isBoolean ? (
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(rawValue)}
                                                    readOnly
                                                    aria-label={col.label}
                                                />
                                            ) : (
                                                String(rawValue)
                                            )}
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>

                <tfoot>
                    <tr>
                        <td
                            colSpan={columns.length}
                            style={{
                                position: 'sticky',
                                bottom: '-1px',
                                zIndex: 60,
                                backgroundColor: 'var(--background, white)',
                                borderTop: '1px solid #e5e7eb',
                                padding: '8px 12px',
                            }}
                        >
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px'}}>
                                <div>Showing {sites.length} sites</div>
                                <div className="text-sm text-gray-500">Last updated: {/* optional date */}</div>
                            </div>
                            <div className="flex justify-center border-t border-gray-200 mt-2 pt-2">
                                {Array.from({length: 9}).map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="px-1 rounded bg-gray-100 hover:bg-gray-200 text-sm mx-1"
                                        aria-label={`Action ${i + 1}`}
                                    >
                                        Action {i + 1}
                                    </button>
                                ))}
                            </div>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}
