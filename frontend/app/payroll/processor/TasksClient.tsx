// typescript
// File: `app/payroll/processor/TasksClient.tsx`
'use client'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import { normalizeResponse } from './lib/normalizeResponse'

interface Task {
  rec_id: number
  cust_id: string
  company: string
  description: string
  route: string
  week_of: string
  done_by: string
  word_order: string
  comment: string
  charge: string
  site_commission: string
  temp_deposit_date: string
  uid: number
  week_done: string
  emp_id: string
  price: string
  cod: string
  other_bill?: string
  type: string
  cash_paid?: string
  [key: string]: unknown
}

type Column = {
  key: string
  label: string
  width?: string
  stickyLeft?: boolean
  hidden?: boolean
}

export default function TasksClient(): React.ReactElement {
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    const ac = new AbortController()
    mountedRef.current = true

    async function fetchTasks() {
      try {
        const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')
        const url = `${API_BASE}/api/v1/payroll/sites/?show_all=1&refresh=1`
        const res = await fetch(url, { signal: ac.signal, cache: 'no-store' })

        console.log('[TasksClient] response meta:', {
          url: res.url,
          status: res.status,
          ok: res.ok,
          redirected: res.redirected,
          type: res.type,
          bodyUsed: res.bodyUsed,
        })

        for (const [name, value] of res.headers.entries()) {
          console.log(`[TasksClient] header: ${name}: ${value}`)
        }
        const contentType = res.headers.get('content-type') || ''
        console.log('[TasksClient] content-type header:', contentType)

        try {
          const preview = await res.clone().text()
          console.log('[TasksClient] body preview (clone, first 2000 chars):', preview.slice(0, 2000))
        } catch (cloneErr) {
          console.warn('[TasksClient] could not read clone body (maybe binary):', cloneErr)
        }

        const text = await res.text()

        if (!res.ok) {
          if (!ac.signal.aborted && mountedRef.current) {
            setError(`Fetch failed: ${res.status}`)
            setTasks([])
          }
          return
        }

        if (!contentType.includes('application/json')) {
          if (!ac.signal.aborted && mountedRef.current) {
            setError('Invalid content-type, expected JSON')
            setTasks([])
          }
          console.log('[TasksClient] non-JSON response body (full):', text.slice(0, 5000))
          return
        }

        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch (err) {
          console.error('[TasksClient] JSON.parse failed, raw body:', text.slice(0, 5000), err)
          if (!ac.signal.aborted && mountedRef.current) {
            setError('Failed to parse JSON')
            setTasks([])
          }
          return
        }

        console.log(
          '[TasksClient] parsed shape:',
          parsed && typeof parsed === 'object' ? Object.keys(parsed as Record<string, unknown>) : typeof parsed
        )

        const normalized = normalizeResponse<Task>(parsed)
        console.log('[TasksClient] normalized length:', normalized.length)
        if (!ac.signal.aborted && mountedRef.current) setTasks(normalized)
      } catch (err: unknown) {
        const name = (err as { name?: string }).name
        if (name === 'AbortError') return
        if (mountedRef.current) setError(String(err))
      }
    }

    fetchTasks()

    return () => {
      mountedRef.current = false
      ac.abort()
    }
  }, [])

  // call hooks in the same order on every render (move useMemo before any early returns)
  const rowKeys = useMemo(() => {
    if (!tasks) return []
    return tasks.map((t, i) => String(t.cust_id ?? t.rec_id ?? i))
  }, [tasks])

  if (error) return <p className="p-4 text-red-600">Error: {error}</p>
  if (tasks === null) return <p className="p-4">Loading…</p>
  if (tasks.length === 0) return <p className="p-4">No payroll tasks found.</p>

  const columns: Column[] = [
    { key: 'rec_id', label: '', width: '2%', stickyLeft: false, hidden: true },
    { key: 'cust_id', label: 'CustID', stickyLeft: false, width: '0', hidden: true },
    { key: 'company', label: 'Company', width: '15%', stickyLeft: false },
    { key: 'description', label: 'Description', width: '20%', stickyLeft: false },
    { key: 'route', label: 'Route', width: '2%', stickyLeft: false },
    { key: 'week_of', label: 'WeekOf', width: '3%', stickyLeft: false },
    { key: 'cash_paid', label: 'Site Commission', width: '3%', stickyLeft: false },
    { key: 'done_by', label: 'Done By', width: '5%', stickyLeft: false },
    { key: 'word_order', label: 'Work Order', width: '10%', stickyLeft: false },
    { key: 'comment', label: 'Comment', width: '15%', stickyLeft: false },
    { key: 'charge', label: 'Charge', width: '3%', stickyLeft: false, hidden: true },
    { key: 'temp_deposit_date', label: 'Temp Dep Date', width: '0', stickyLeft: false, hidden: true },
    { key: 'uid', label: 'uid', width: '0', stickyLeft: true, hidden: true },
    { key: 'week_done', label: 'Week Done', width: '0', stickyLeft: false, hidden: true },
    { key: 'emp_id', label: 'Emp ID', width: '0', stickyLeft: false, hidden: true },
    { key: 'price', label: 'Price', width: '0', stickyLeft: false, hidden: true },
    { key: 'cod', label: 'COD', width: '0', stickyLeft: false, hidden: true },
    { key: 'other_bill', label: 'Other Bill', width: '0', stickyLeft: false, hidden: true },
    { key: 'type', label: 'Type', width: '0', stickyLeft: false, hidden: true },
  ]

  const totalMinWidth = columns.reduce((acc, c) => acc + parseInt(String((c.width ?? '0')).replace('%', ''), 10), 0)

  return (
    <div className="w-full h-full min-h-0 table-scroll">
      <table
        className="table-auto border-collapse shadow-md rounded-lg"
        style={{ minWidth: totalMinWidth + 'px', width: '100%', margin: 0 }}
      >
        <thead className="sticky-top border-b border-gray-200 bg-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-2 text-left text-sm uppercase tracking-wider border-b ${col.hidden ? 'hidden' : ''}`}
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
                <div style={{ maxWidth: `100%` }} title={col.label}>
                  {col.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {tasks.map((task, rowIndex) => {
            const rowKey = rowKeys[rowIndex] ?? String(rowIndex)
            return (
              <tr key={rowKey} className="light:hover:bg-gray-200 dark:hover:bg-gray-200">
                {columns.map((col) => {
                  const value = (task as Record<string, unknown>)[col.key]
                  const isBoolean = ['cod', 'mailto', 'taxable', 'voucher', 'other_bill', 'adv_bill', 'in_monthly'].includes(col.key)
                  const rawValue = col.key === 'cust_id' ? value : col.key === 'company' ? value : value

                  return (
                    <td
                      key={col.key}
                      className={`px-2 py-1 ${col.hidden ? 'hidden' : ''}`}
                      style={{
                        minWidth: col.width,
                        position: col.stickyLeft ? 'sticky' : undefined,
                        left: col.stickyLeft ? 0 : undefined,
                        zIndex: col.stickyLeft ? 3 : 0,
                        borderTop: '1px solid #e5e7eb',
                        borderRight: '2px solid #e5e7eb',
                        fontSize: '11px',
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
                          <input type="checkbox" checked={Boolean(rawValue)} readOnly aria-label={col.label} />
                        ) : (
                          String(rawValue)
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>

        <tfoot>
          <tr>
            <td
              colSpan={columns.length}
              style={{
                position: 'sticky',
                bottom: '0px',
                zIndex: 60,
                backgroundColor: 'var(--background, white)',
                padding: '0px 7px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                }}
              >
                <div>Showing {tasks.length} tasks</div>
                <div className="text-sm text-gray-500">Last updated: {/* optional date */}</div>
              </div>
              <div className="flex justify-left border-t border-gray-200 ">
                {Array.from({ length: 9 }).map((_, i) => (
                  <button key={i} type="button" className=" rounded bg-gray-100 hover:bg-gray-200 text-sm mx-1" aria-label={`Action ${i + 1}`}>
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
