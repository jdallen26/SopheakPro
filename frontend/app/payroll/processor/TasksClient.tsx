// typescript
'use client'
import React, {useEffect, useRef, useState, useMemo} from 'react'
import {normalizeResponse} from './lib/normalizeResponse'
import {usePayrollStore} from '@/app/store/payroll-store';

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

interface PaySelect {
    uid: number
    emp_id: number
    employee_name: string
    start: string
    end: string
    week_done: string
    old_start: string
    old_end: string
    mile_rate: string
    chk_price_paid: string
    reim_exp: string
    otime_percentage: string
    spec_equip: boolean
    billing_date: string
    invoice_num: number
    route: string;
    route_description: string; // Added to match API response
}

type Column = {
    key: string
    label: string
    width?: string
    stickyLeft?: boolean
    hidden?: boolean
    responsiveClassName?: string
}

export default function TasksClient(): React.ReactElement {
    const {openPayrollSelection, updatePayrollSelectionData} = usePayrollStore();
    const [tasks, setTasks] = useState<Task[] | null>(null)
    const [paySelect, setPaySelect] = useState<PaySelect[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(false)

    useEffect(() => {
        const ac = new AbortController()
        mountedRef.current = true

        async function fetchPSelect() {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.12.241:8000').replace(/\/$/, '')
                const url = `${API_BASE}/api/v1/payroll/pselect`
                const res = await fetch(url, {signal: ac.signal, cache: 'no-store'})

                const contentType = res.headers.get('content-type') || ''
                const text = await res.text()

                if (!res.ok) {
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError(`Fetch failed: ${res.status}`)
                        setPaySelect([])
                    }
                    return
                }

                if (!contentType) {
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError('Invalid response content type')
                        setPaySelect([])
                    }
                    return
                }


                let parsed: unknown
                try {
                    parsed = JSON.parse(text)
                } catch (err) {
                    console.error('[TasksClient] JSON.parse failed, raw body:', text.slice(0, 5000), err)
                    if (!ac.signal.aborted && mountedRef.current) {
                        setError('Failed to parse JSON')
                        setPaySelect([])
                    }
                }

                const normalized = normalizeResponse<PaySelect>(parsed)
                if (!ac.signal.aborted && mountedRef.current) setPaySelect(normalized)
            } catch {
                console.log('error')
            }
        }

        fetchPSelect()

        return () => {
            mountedRef.current = false
            ac.abort()
        }
    }, [])

    useEffect(() => {
        if (!paySelect || paySelect.length === 0) {
            return
        }

        const ac = new AbortController()
        mountedRef.current = true

        async function fetchTasks() {
            try {
                const weekDoneRaw = paySelect![0].week_done;
                const date = new Date(weekDoneRaw);
                let weekOf: string;

                if (!isNaN(date.getTime())) {
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(date.getUTCDate()).padStart(2, '0');
                    weekOf = `${year}-${month}-${day}`;
                } else {
                    weekOf = weekDoneRaw;
                }

                const route = paySelect![0].route;

                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.12.241:8000').replace(/\/$/, '')
                const url = `${API_BASE}/api/v1/payroll/task_list/?refresh=1&week_of=${weekOf}&route=${route}`
                const res = await fetch(url, {signal: ac.signal, cache: 'no-store'})

                const contentType = res.headers.get('content-type') || ''
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

                const normalized = normalizeResponse<Task>(parsed)
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
    }, [paySelect])


    // keep hooks order stable — compute row keys before early returns
    const rowKeys = useMemo(() => {
        if (!tasks) return []
        return tasks.map((t, i) => String(t.rec_id ?? i))
    }, [tasks])

    const progress = useMemo(() => {
        if (!tasks || tasks.length === 0) {
            return 0;
        }
        const completedTasks = tasks.filter(t => t.done_by && t.done_by.trim() !== '').length;
        return Math.round((completedTasks / tasks.length) * 100);
    }, [tasks]);

    if (error) return <p className="p-4 text-red-600" style={{paddingLeft: '10px'}}>Error: {error}</p>
    if (tasks === null) return <p className="p-4" style={{paddingLeft: '10px'}}>Loading…</p>
    if (tasks.length === 0) return <p className="p-4" style={{paddingLeft: '10px'}}>No payroll tasks found.</p>

    const columns: Column[] = [
        {key: 'rec_id', label: '', stickyLeft: false, hidden: true},
        {key: 'cust_id', label: 'CustID', stickyLeft: false, hidden: true},
        {
            key: 'company',
            label: 'Company',
            width: '18%',
            stickyLeft: false,
            responsiveClassName: 'hidden sm:table-cell'
        },
        {
            key: 'description',
            label: 'Description',
            width: '18%',
            stickyLeft: false,
            responsiveClassName: 'hidden sm:table-cell'
        },
        {key: 'route', label: 'Route', width: '5%', stickyLeft: false, responsiveClassName: 'hidden md:table-cell'},
        {key: 'week_of', label: 'WeekOf', width: '7%', stickyLeft: false, responsiveClassName: 'hidden lg:table-cell'},
        {
            key: 'cash_paid',
            label: 'Cash Paid',
            width: '6%',
            stickyLeft: false,
            responsiveClassName: 'hidden md:table-cell'
        },
        {
            key: 'done_by',
            label: 'Done By',
            width: '16%',
            stickyLeft: false,
            responsiveClassName: 'hidden sm:table-cell'
        },
        {
            key: 'work_order',
            label: 'Work Order',
            width: '10%',
            stickyLeft: false,
            responsiveClassName: 'hidden md:table-cell'
        },
        {
            key: 'comment',
            label: 'Comment',
            width: '25%',
            stickyLeft: false,
            responsiveClassName: 'hidden md:table-cell'
        },
        {key: 'charge', label: 'Charge', width: '3%', stickyLeft: false, hidden: true},
        {
            key: 'temp_deposit_date',
            label: 'Temp Dep Date',
            width: '9%',
            stickyLeft: false,
            hidden: true,
        },
        {key: 'uid', label: 'UID', width: '0', stickyLeft: false, hidden: true},
        {key: 'week_done', label: 'Week Done', width: '0', stickyLeft: false, hidden: true},
        {key: 'emp_id', label: 'EmpID', width: '0', stickyLeft: false, hidden: true},
        {key: 'price', label: 'Price', width: '0', stickyLeft: false, hidden: true},
        {key: 'cod', label: 'COD', width: '0', stickyLeft: false, hidden: true},
        {key: 'other_bill', label: 'Other Bill', width: '0', stickyLeft: false, hidden: true},
        {key: 'type', label: 'Type', width: '0', stickyLeft: false, hidden: true},
    ]

    return (

        <div className="flex flex-col flex-1 min-h-0 h-full overflow-hidden">
            {paySelect && paySelect.length > 0 && (
                <div className="p-2" style={{
                    background: 'var(--background-tertiary)',
                    paddingBottom: '4px',
                    paddingLeft: '3px',
                    marginTop: '-5px',
                }}>
                    <div className="flex items-center justify-between">
                        <div className="flex-shrink-0">
                            <sub><span
                                className="font-semibold">{paySelect[0].employee_name || paySelect[0].emp_id}: </span></sub>
                            <sub><span>{(() => {
                                const date = new Date(paySelect[0].week_done);
                                if (!isNaN(date.getTime())) {
                                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                    const day = String(date.getUTCDate()).padStart(2, '0');
                                    const year = date.getUTCFullYear();
                                    return `${month}/${day}/${year}`;
                                }
                                return paySelect[0].week_done;
                            })()}</span></sub>
                            <sub>: <span>{paySelect[0].route} Route</span></sub>
                            <sub>: <span>{paySelect[0].route_description}</span></sub>
                        </div>
                        <div>
                            <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden"
                                 style={{width: '150px', height: '8px'}}>
                                <div
                                    className={`h-full transition-all duration-500 ease-out bg-gradient-to-r ${
                                        progress <= 60 ? 'from-red-900 to-red-500' :
                                            progress <= 85 ? 'from-amber-900 to-amber-500' :
                                                'from-green-700 to-green-400'
                                    }`}
                                    style={{width: `${progress}%`}}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {paySelect && paySelect.length > 0 && (
                <div>
                    <input className={'border hidden'} id="pselect-uid" name="uid"
                           defaultValue={String(paySelect[0].uid)}/>
                    <input className={'border hidden'} id="pselect-emp_id" name="emp_id"
                           defaultValue={String(paySelect[0].emp_id)}/>
                    <input className={'border hidden'} id="pselect-start" name="start"
                           defaultValue={String(paySelect[0].start)}/>
                    <input className={'border hidden'} id="pselect-end" name="end"
                           defaultValue={String(paySelect[0].end)}/>
                    <input className={'border hidden'} id="pselect-week_done" name="week_done"
                           defaultValue={String(paySelect[0].week_done)}/>
                    <input className={'border hidden'} id="pselect-old_start" name="old_start"
                           defaultValue={String(paySelect[0].old_start)}/>
                    <input className={'border hidden'} id="pselect-old_end" name="old_end"
                           defaultValue={String(paySelect[0].old_end)}/>
                    <input className={'border hidden'} id="pselect-mile_rate" name="mile_rate"
                           defaultValue={String(paySelect[0].mile_rate)}/>
                    <input className={'border hidden'} id="pselect-chk_price_paid" name="chk_price_paid"
                           defaultValue={String(paySelect[0].chk_price_paid)}/>
                    <input className={'border hidden'} id="pselect-reim_exp" name="reim_exp"
                           defaultValue={String(paySelect[0].reim_exp)}/>
                    <input className={'border hidden'} id="pselect-otime_percentage" name="otime_percentage"
                           defaultValue={String(paySelect[0].otime_percentage)}/>
                    <input className={'border hidden'} id="pselect-spec_equip" name="spec_equip"
                           defaultValue={String(paySelect[0].spec_equip)}/>
                    <input className={'border hidden'} id="pselect-billing_date" name="billing_date"
                           defaultValue={String(paySelect[0].billing_date)}/>
                    <input className={'border hidden'} id="pselect-invoice_num" name="invoice_num"
                           defaultValue={String(paySelect[0].invoice_num)}/>
                </div>

            )}
            {/* make the scroll area a flex child so it can size correctly */}
            <div className="flex-1 overflow-auto table-scroll min-h-0">
                <table className="data-table w-full" style={{tableLayout: 'fixed'}}>
                    <thead
                        className={'bg-white border-b border-gray-200 sticky-top'}
                        style={{
                            zIndex: 20,
                            top: '0px',
                        }}
                    >
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={`${col.hidden ? 'hidden' : ''} ${col.responsiveClassName ?? ''}`}
                                style={{width: col.width, paddingTop: '0px', paddingBottom: '2px'}}
                            >
                                <div title={col.label} className={'truncate'}>
                                    {col.label}
                                </div>
                            </th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {tasks.map((task, rowIndex) => {
                        const rowKey = rowKeys[rowIndex] ?? String(rowIndex)
                        return (
                            <tr key={rowKey}>
                                {columns.map((col) => {
                                        const value = (task as Record<string, unknown>)[col.key]
                                        const rawValue = col.key === 'rec_id' ? value : col.key === 'cust_id' ? value : col.key === 'company' ? value : value

                                        let cellContent: React.ReactNode
                                        let formattedValue: string | undefined


                                        switch (col.key) {
                                            // General
                                            case 'rec_id':
                                            case 'cust_id':
                                            case 'company':
                                            case 'description':
                                            case 'route':
                                            case 'type':
                                            case 'uid':
                                            case 'emp_id':
                                                cellContent = String(rawValue ?? '')
                                                break

                                            // Boolean
                                            case 'cod':
                                            case 'other_bill':
                                                break

                                            // Monetary
                                            case 'charge':
                                            case 'price':
                                            case 'cash_paid':
                                                const num = parseFloat(String(rawValue));
                                                cellContent = (rawValue == null || rawValue === 'None' || isNaN(num))
                                                    ? ''
                                                    : new Intl.NumberFormat('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD'
                                                    }).format(num);
                                                break

                                            // Date
                                            case 'week_of':
                                            case 'temp_deposit_date':
                                                const date = new Date(String(rawValue));
                                                if (rawValue && !isNaN(date.getTime())) {
                                                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                                    const day = String(date.getUTCDate()).padStart(2, '0');
                                                    const year = date.getUTCFullYear();
                                                    formattedValue = `${month}/${day}/${year}`;
                                                    cellContent = formattedValue;
                                                } else {
                                                    cellContent = '';
                                                }
                                                break

                                            // Custom
                                            case 'done_by':
                                                const employeeOptions = [
                                                    {value: 'emp1', label: 'Employee 1'},
                                                    {value: 'emp2', label: 'Employee 2'},
                                                    {value: 'emp3', label: 'Employee 3'},
                                                ];
                                                const currentDoneByValue = String(rawValue ?? '');
                                                const doneByValueExists = employeeOptions.some(opt => opt.value === currentDoneByValue);

                                                cellContent = (
                                                    <select
                                                        defaultValue={currentDoneByValue}
                                                        aria-label={col.label}
                                                        className={"w-full bg-transparent p-1"}
                                                        style={{
                                                            background: 'var(--background-tertiary)',
                                                            color: 'var(--foreground)',
                                                            border: '1px solid var(--border-color)'
                                                        }}
                                                        onChange={() => {
                                                        }}
                                                    >
                                                        <option value=""></option>
                                                        {!doneByValueExists && currentDoneByValue && (
                                                            <option value={currentDoneByValue}>{currentDoneByValue}</option>
                                                        )}
                                                        {employeeOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                );
                                                break;

                                            case 'comment':
                                                const commentOptions = [
                                                    {value: 'com1', label: 'Comment 1'},
                                                    {value: 'com2', label: 'Comment 2'},
                                                    {value: 'com3', label: 'Comment 3'},
                                                ];
                                                const currentCommentValue = String(rawValue ?? '');
                                                const commentValueExists = commentOptions.some(opt => opt.value === currentCommentValue);

                                                cellContent = (
                                                    <select
                                                        defaultValue={currentCommentValue}
                                                        aria-label={col.label}
                                                        className={"w-full bg-transparent"}
                                                        style={{
                                                            background: 'var(--background-tertiary)',
                                                            color: 'var(--foreground)',
                                                            border: '1px solid var(--border-color)'
                                                        }}
                                                        onChange={() => {
                                                        }}
                                                    >
                                                        <option value=""></option>
                                                        {!commentValueExists && currentCommentValue && (
                                                            <option
                                                                value={currentCommentValue}>{currentCommentValue}</option>
                                                        )}
                                                        {commentOptions.map(opt => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                );
                                                break;

                                            case 'work_order':
                                                cellContent = (
                                                    <input
                                                        type={'text'}
                                                        value={String(rawValue ?? '')}
                                                        readOnly
                                                        className={'w-full bg-transparent p-1'}
                                                        style={{
                                                            border: '1px solid var(--border-color)',
                                                            paddingLeft: '4px'
                                                        }}
                                                    />
                                                )
                                                break


                                            // All Others
                                            default:
                                                cellContent = String(rawValue ?? '')
                                                break
                                        }

                                        return (
                                            <td
                                                key={col.key}
                                                className={`${col.hidden ? 'hidden' : ''} ${col.responsiveClassName ?? ''}`}
                                                style={{width: col.width}}
                                            >
                                                <div title={formattedValue ?? String(rawValue ?? '')}>
                                                    {cellContent}
                                                </div>
                                            </td>
                                        )
                                    }
                                )
                                }
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
            <div style={{paddingLeft: '3px'}}>
                <div>Showing {tasks.length} tasks</div>
                <div className="text-sm text-gray-500">Last updated: {/* optional date */}</div>
            </div>
            <div className={'col-span-10 content-start'}>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)'
                            e.currentTarget.style.color = 'var(--foreground)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Insert
                    Entry
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Comment
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px', marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Commission
                    Rate
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px', marginBottom: '2px',
                            marginLeft: '4px'
                        }}
                        onClick={() => {
                            if (paySelect && paySelect.length > 0) {
                                const dataToUpdate = {
                                    ...paySelect[0],
                                    description: paySelect[0].route_description,
                                };
                                updatePayrollSelectionData(dataToUpdate);
                                openPayrollSelection();
                            }
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)'
                            e.currentTarget.style.color = 'var(--foreground)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Change Payroll
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Deposit
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px', marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>View Report
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Clear
                    All
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Print NOT DONE
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Clear NOT DONE
                </button>
                <button className="btn btn-primary flex items-center gap-2"
                        style={{
                            backgroundColor: 'var(--button-bg)',
                            color: 'var(--button-text)',
                            marginTop: '2px',
                            marginBottom: '2px',
                            marginLeft: '4px'
                        }} onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--button-bg)'
                            e.currentTarget.style.color = 'var(--button-text)'
                        }}>Show Projected
                    Deposit Date
                </button>

            </div>
        </div>
    )
}
