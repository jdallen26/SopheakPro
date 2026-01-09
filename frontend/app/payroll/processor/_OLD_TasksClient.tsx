// typescript
'use client'
import React, {useEffect, useRef, useState, useMemo} from 'react'
import {usePayrollStore} from '@/app/store/payroll-store';
import { toast } from '@/app/utils/toast';
import ComboBox from '@/app/shared/components/ComboBox';

interface Task {
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

interface Comment {
    id: number
    comment: string
    count: number
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
    route_description: string;
}

interface ApiEmployee {
    id: number;
    name: string;
}

type Column = {
    key: string
    label: string
    width?: string
    stickyLeft?: boolean
    hidden?: boolean
    responsiveClassName?: string
}

const formatToYyyyMmDd = (dateString: string): string => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString; // Return original if format is not mm/dd/yyyy
    }
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export default function TasksClient(): React.ReactElement {
    const {openPayrollSelection, updatePayrollSelectionData, refreshId} = usePayrollStore();
    const [tasks, setTasks] = useState<Task[] | null>(null)
    const [paySelect, setPaySelect] = useState<PaySelect[] | null>(null)
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const mountedRef = useRef(false)

    const updateProgress = (currentTasks: Task[]) => {
        if (!currentTasks || currentTasks.length === 0) {
            setProgress(0);
            setProgressText('');
            return;
        }
        const completedTasks = currentTasks.filter(t => t.done_by && t.done_by.trim() !== '').length;
        const totalTasks = currentTasks.length;
        const percentage = Math.round((completedTasks / totalTasks) * 100);
        
        setProgress(percentage);
        setProgressText(`${completedTasks} of ${totalTasks} Complete`);
    };

    useEffect(() => {
        const ac = new AbortController()
        mountedRef.current = true

        async function fetchInitialData() {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '')
                
                const pselectUrl = `${API_BASE}/api/v1/payroll/pselect`
                const pselectRes = await fetch(pselectUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                    signal: ac.signal, 
                    cache: 'no-store'
                })
                if (!pselectRes.ok) throw new Error(`PSelect fetch failed: ${pselectRes.status}`);
                const pselectData = await pselectRes.json();
                const pselectNormalized = pselectData?.pselect || [];
                if (mountedRef.current) setPaySelect(pselectNormalized);

                const empUrl = `${API_BASE}/api/v1/hr/employees`;
                const empRes = await fetch(empUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ employed: true }),
                });
                if (!empRes.ok) throw new Error(`Employees fetch failed: ${empRes.status}`);
                const empData = await empRes.json();
                const employeeList: ApiEmployee[] = empData?.employees || [];
                if (mountedRef.current) setEmployees(employeeList);

            } catch(err) {
                if ((err as Error).name !== 'AbortError' && mountedRef.current) {
                    setError((err as Error).message);
                    setPaySelect([]);
                    setEmployees([]);
                }
            }
        }

        fetchInitialData()

        return () => {
            mountedRef.current = false
            ac.abort()
        }
    }, [refreshId])

    useEffect(() => {
        if (!paySelect || paySelect.length === 0) {
            if (paySelect !== null) { 
                setTasks([]);
            }
            return;
        }

        const ac = new AbortController()
        mountedRef.current = true

        async function fetchTasks() {
            try {
                const weekOfRaw = paySelect![0].start;
                const weekOfFormatted = formatToYyyyMmDd(weekOfRaw);
                const route = paySelect![0].route?.trim();

                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '')
                const url = `${API_BASE}/api/v1/payroll/task_list`
                
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ week_of: weekOfFormatted, route: route }),
                    signal: ac.signal, 
                    cache: 'no-store'
                })

                if (!res.ok) throw new Error(`Task list fetch failed: ${res.status}`);

                const parsed = await res.json();
                const normalized = parsed?.tasks || [];
                if (mountedRef.current) {
                    setTasks(normalized);
                    updateProgress(normalized); // Update progress when tasks are fetched
                }

            } catch (err) {
                if ((err as Error).name !== 'AbortError' && mountedRef.current) {
                    setError((err as Error).message);
                    setTasks([]);
                }
            }
        }

        fetchTasks()

        return () => {
            mountedRef.current = false
            ac.abort()
        }
    }, [paySelect])

    const currentEmployeeName = useMemo(() => {
        if (!paySelect || paySelect.length === 0 || employees.length === 0) {
            return paySelect?.[0]?.emp_id ? String(paySelect[0].emp_id) : '';
        }
        const empId = paySelect[0].emp_id;
        const employee = employees.find(e => e.id === empId);
        return employee ? employee.name : String(empId);
    }, [paySelect, employees]);


    const rowKeys = useMemo(() => {
        if (!tasks) return []
        return tasks.map((t, i) => String(t.uid ?? i))
    }, [tasks])

    if (error) return <p className="p-4 text-red-600" style={{paddingLeft: '10px'}}>Error: {error}</p>
    if (tasks === null) return <p className="p-4" style={{paddingLeft: '10px'}}>Loading…</p>
    if (tasks.length === 0) return <p className="p-4" style={{paddingLeft: '10px'}}>No payroll tasks found.</p>

    const columns: Column[] = [
        {key: 'uid', label: 'UID', width: '0', stickyLeft: false, hidden: true},
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
        {key: 'week_done', label: 'Week Done', width: '0', stickyLeft: false, hidden: true},
        {key: 'emp_id', label: 'EmpID', width: '0', stickyLeft: false, hidden: true},
        {key: 'price', label: 'Price', width: '0', stickyLeft: false, hidden: true},
        {key: 'cod', label: 'COD', width: '0', stickyLeft: false, hidden: true},
        {key: 'other_bill', label: 'Other Bill', width: '0', stickyLeft: false, hidden: true},
        {key: 'type', label: 'Type', width: '0', stickyLeft: false, hidden: true},
    ]

    const handleBlur = (uid: number) => {
        toast(`UID: ${uid}`, 'info', 'Record Focus');
    };

    const handleTaskChange = (uid: number, field: keyof Task, value: string | number | boolean) => {
        setTasks(prevTasks => {
            if (!prevTasks) return null;
            return prevTasks.map(task => 
                task.uid === uid ? { ...task, [field]: value } : task
            );
        });
    };

    return (

        <div className="flex flex-col flex-1 min-h-0 h-full">
            {paySelect && paySelect.length > 0 && (
                <div className="p-2" style={{
                    background: 'var(--background-tertiary)',
                    paddingBottom: '4px',
                    paddingLeft: '3px',
                    marginTop: '-5px',
                }}>
                    <div className="flex items-center justify-between">
                        <div className="flex-shrink-0">
                            <sub><span className="font-semibold">{currentEmployeeName}: </span></sub>
                            <sub><span>{paySelect[0].start}</span></sub>
                            <sub>: <span>{paySelect[0].route} Route</span></sub>
                            <sub>: <span>{paySelect[0].route_description}</span></sub>
                        </div>
                        <div className="flex items-center gap-2"
                            style={{paddingTop: '4px'}}
                        >
                            <div 
                                className="relative h-4 w-full rounded-full bg-gray-200 overflow-hidden"
                                style={{width: '150px', height: '15px'}}
                                role="progressbar"
                            >
                                <div
                                    className={`h-full transition-all duration-500 ease-out bg-gradient-to-r ${
                                        progress <= 60 ? 'from-red-900 to-red-500' :
                                            progress <= 85 ? 'from-amber-900 to-amber-500' :
                                                'from-green-700 to-green-400'
                                    }`}
                                    style={{width: `${progress}%`}}
                                ></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[11px] font-semibold text-black" style={{lineHeight: '8px'}}>
                                        {progressText}
                                    </span>
                                </div>
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
                                        const rawValue = col.key === 'uid' ? value : col.key === 'cust_id' ? value : col.key === 'company' ? value : value

                                        let cellContent: React.ReactNode
                                        let formattedValue: string | undefined


                                        switch (col.key) {
                                            // General
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
                                                const doneByOptions = [
                                                    { value: currentEmployeeName, label: currentEmployeeName },
                                                    { value: 'CANCELLED', label: 'CANCELLED' },
                                                    { value: 'NOT DONE', label: 'NOT DONE' },
                                                    { value: '', label: '' }
                                                ];
                                                cellContent = (
                                                    <ComboBox
                                                        id={`done-by-combobox-${task.uid}`}
                                                        options={doneByOptions}
                                                        value={String(rawValue ?? '')}
                                                        onChange={(newValue) => handleTaskChange(task.uid, 'done_by', newValue)}
                                                        onBlur={() => handleBlur(task.uid)}
                                                        fontSize="9px"
                                                        icon="arrow-down"
                                                    />
                                                );
                                                break;

                                            case 'comment':
                                                const commentOptions = [
                                                    {value: '', label: ''},
                                                    {value: 'com1', label: 'Comment 1'},
                                                    {value: 'com2', label: 'Comment 2'},
                                                    {value: 'com3', label: 'Comment 3'},
                                                ];
                                                cellContent = (
                                                    <ComboBox
                                                        id={`comment-combobox-${task.uid}`}
                                                        options={commentOptions}
                                                        value={String(rawValue ?? '')}
                                                        onChange={(newValue) => handleTaskChange(task.uid, 'comment', newValue)}
                                                        onBlur={() => handleBlur(task.uid)}
                                                        fontSize="9px"
                                                        icon="arrow-down"
                                                    />
                                                );
                                                break;

                                            case 'work_order':
                                                cellContent = (
                                                    <input
                                                        type={'text'}
                                                        value={String(rawValue ?? '')}
                                                        onChange={(e) => handleTaskChange(task.uid, 'work_order', e.target.value)}
                                                        className={'w-full bg-transparent p-1'}
                                                        style={{
                                                            border: '1px solid var(--border-color)',
                                                            paddingLeft: '4px'
                                                        }}
                                                        onBlur={() => handleBlur(task.uid)}
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
                <div
                    className="text-gray-500"
                ><sub>Showing {tasks.length} tasks</sub>
                </div>
                {/*<div className="text-sm text-gray-500">Last updated: /!* optional date *!/</div>*/}
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
                        }}                        onMouseEnter={(e) => {
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
