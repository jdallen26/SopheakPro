'use client'
import React, {useEffect, useRef, useState, useMemo, useCallback} from 'react'
import {usePayrollStore} from '@/app/store/payroll-store';
import {toast} from '@/app/utils/toast';
import {HybridSelectWrapper, HybridSelectOption, HybridSelectValue} from '@/app/shared/components/HybridSelectWrapper';
import {HybridInputWrapper} from '@/app/shared/components/HybridInputWrapper';

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
    commission?: string;
    Comm?: string;

    [key: string]: unknown
}

interface Comment {
    id: number;
    comment: string;
    count?: number;
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
    commission_rate?: number; // Added for business logic
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

interface HybridSelectElement extends HTMLElement {
    options: HybridSelectOption[];
    value: HybridSelectValue;
    selectedOption: HybridSelectOption | HybridSelectOption[] | null;
    _isOpen: boolean;
    _highlightedIndex: number;
    _filteredOptions: HybridSelectOption[];
    _selectOption: (id: string | number) => void;
    close: () => void;
}

const formatToYyyyMmDd = (dateString: string): string => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return dateString;
    }
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Subcomponents used to optimize rendering and stabilize options
const TaskDoneByCell = React.memo(({task, options, onFocus, onKeyDown, onChange}: {
    task: Task,
    options: HybridSelectOption[],
    onFocus: (task: Task) => void,
    onKeyDown: (e: React.KeyboardEvent, task: Task) => void,
    onChange: (task: Task, value: string) => void,
}) => {
    const currentDoneByVal = String(task.done_by ?? '');

    return (
        <HybridSelectWrapper
            className="max-w-md"
            id={`doneby-hybrid-${task.uid}`}
            name={`doneby-hybrid-${task.uid}`}
            value={currentDoneByVal}
            placeholder={currentDoneByVal}
            searchable={true}
            required={true}
            options={options}
            clearable={false}
            onChange={(val) => onChange(task, String(val))}
            onFocus={() => onFocus(task)}
            onKeyDown={(e) => onKeyDown(e as React.KeyboardEvent, task)}
        />
    );
});
TaskDoneByCell.displayName = 'TaskDoneByCell';

const TaskCommentCell = React.memo(({task, commentOptions, onChange, onFocus}: {
    task: Task,
    commentOptions: HybridSelectOption[],
    onChange: (task: Task, val: string) => void,
    onFocus: (task: Task) => void,
}) => {
    const selectRef = useRef<HybridSelectElement | null>(null);
    const currentCommentVal = String(task.comment ?? '');

    const options = useMemo(() => {
        let rowCommentOptions = [...commentOptions];
        if (currentCommentVal && !commentOptions.some(o => String(o.value) === currentCommentVal)) {
            rowCommentOptions = [{
                id: currentCommentVal,
                label: currentCommentVal,
                value: currentCommentVal
            }, ...commentOptions];
        }
        return rowCommentOptions;
    }, [commentOptions, currentCommentVal]);

    return (
        <HybridSelectWrapper
            ref={selectRef}
            className="max-w-md"
            id={`comment-hybrid-${task.uid}`}
            name={`comment-hybrid-${task.uid}`}
            value={currentCommentVal}
            searchable={true}
            required={true}
            options={options}
            clearable={false}
            onChange={(val) => onChange(task, String(val))}
            onFocus={() => onFocus(task)}
        />
    );
});
TaskCommentCell.displayName = 'TaskCommentCell';


export default function TasksClient(): React.ReactElement {
    const {openPayrollSelection, updatePayrollSelectionData, refreshId} = usePayrollStore();
    const [commentOptions, setCommentOptions] = useState<HybridSelectOption[]>([]);
    const [tasks, setTasks] = useState<Task[] | null>(null)
    const [paySelect, setPaySelect] = useState<PaySelect[] | null>(null)
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const mountedRef = useRef(false);
    const originalValuesRef = useRef<Map<string, Task>>(new Map());

    const updateProgress = useCallback((currentTasks: Task[]) => {
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
    }, []);

    useEffect(() => {
        const ac = new AbortController()
        mountedRef.current = true

        async function fetchInitialData() {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '')

                const pselectUrl = `${API_BASE}/api/v1/payroll/pselect`
                const pselectRes = await fetch(pselectUrl, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({employed: true}),
                });
                if (!empRes.ok) throw new Error(`Employees fetch failed: ${empRes.status}`);
                const empData = await empRes.json();
                const employeeList: ApiEmployee[] = empData?.employees || [];
                if (mountedRef.current) setEmployees(employeeList);

            } catch (err) {
                if ((err as Error).name !== 'AbortError' && mountedRef.current) {
                    setError((err as Error).message);
                    setPaySelect([]);
                    setEmployees([]);
                }
            }
        }

        void fetchInitialData()

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
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({week_of: weekOfFormatted, route: route}),
                    signal: ac.signal,
                    cache: 'no-store'
                })

                if (!res.ok) throw new Error(`Task list fetch failed: ${res.status}`);

                const parsed = await res.json();
                const normalized = parsed?.tasks || [];
                if (mountedRef.current) {
                    setTasks(normalized);
                    updateProgress(normalized);
                }

            } catch (err) {
                if ((err as Error).name !== 'AbortError' && mountedRef.current) {
                    setError((err as Error).message);
                    setTasks([]);
                }
            }
        }

        void fetchTasks()

        return () => {
            mountedRef.current = false
            ac.abort()
        }
    }, [paySelect, updateProgress])

    useEffect(() => {
        const fetchComments = async () => {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            try {
                const res = await fetch(`${API_BASE}/api/v1/payroll/comments`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        refresh: true,
                        min_count: 50
                    })
                });

                const data = await res.json();
                if (data && Array.isArray(data.comments)) {
                    const formattedOptions = data.comments.map((c: Comment) => ({
                        id: c.id,
                        label: c.comment,
                        value: c.comment,
                    }));
                    formattedOptions.push({id: '__blank__', value: '', label: '\u00A0'});
                    setCommentOptions(formattedOptions);
                }
            } catch (error) {
                console.error("Failed to fetch comments", error);
            }
        };

        void fetchComments();
    }, []);

    const handleFocus = useCallback((task: Task) => {
        const key = `task-${task.uid}`;
        if (!originalValuesRef.current.has(key)) {
            originalValuesRef.current.set(key, task);
        }
    }, []);
    
    const handleSimpleSave = useCallback(async (task: Task, field: keyof Task, value: string) => {
        const uid = task.uid;
        const originalTask = originalValuesRef.current.get(`task-${uid}`);

        const body = { [field]: value };

        setTasks(prevTasks => prevTasks?.map(t => t.uid === uid ? { ...t, ...body } : t) || null);

        try {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            const res = await fetch(`${API_BASE}/api/v1/accounting/edit_monthly_invoice_task`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ uid, ...body })
            });

            if (!res.ok) throw new Error('Server responded with an error.');
            
            const updatedTask = { ...task, ...body };
            originalValuesRef.current.set(`task-${uid}`, updatedTask);

        } catch (error) {
            setTasks(prevTasks => prevTasks?.map(t => t.uid === uid ? (originalTask || t) : t) || null);
        }
    }, []);

    const handleDoneBySave = useCallback(async (task: Task, value: string) => {
        if (!paySelect || paySelect.length === 0) return;

        const uid = task.uid;
        const originalTask = originalValuesRef.current.get(`task-${uid}`);

        const originalDoneBy = originalTask?.done_by ?? '';
        const isSpecialStatus = ["", "CANCELLED", "NOT DONE", "REFUSED"].includes(originalDoneBy);
        if (!isSpecialStatus && originalDoneBy !== paySelect[0].employee_name && value !== originalDoneBy) {
            setTasks(prevTasks => prevTasks?.map(t => t.uid === uid ? (originalTask || t) : t) || null);
            return;
        }
        
        let updatedTask: Task | null = null;
        let apiPayload: Partial<Task> = {};

        setTasks(prevTasks => {
            if (!prevTasks) return null;
            return prevTasks.map(t => {
                if (t.uid !== uid) return t;

                const tempTask = { ...t, done_by: value };

                const employeeCommissionRate = paySelect[0].commission_rate ?? 0.35;
                const siteCommission = parseFloat(tempTask.site_commission);
                const finalCommissionRate = siteCommission > 0 ? siteCommission : employeeCommissionRate;
                
                tempTask.commission = String(finalCommissionRate);
                tempTask.Comm = String(Math.floor(100 * (finalCommissionRate * parseFloat(tempTask.price) + 0.00501)) / 100);

                const newValue = String(value);
                if (newValue === "" || newValue === "NOT DONE") {
                    tempTask.emp_id = "";
                    tempTask.cash_paid = "";
                    tempTask.temp_deposit_date = "";
                    if (new Date(tempTask.week_of) < new Date(tempTask.week_done)) {
                        tempTask.week_done = tempTask.week_of;
                    }
                } else if (newValue === "CANCELLED") {
                    tempTask.emp_id = String(paySelect[0].emp_id);
                    tempTask.cash_paid = "";
                    tempTask.temp_deposit_date = "";
                } else { // Normal completion
                    tempTask.emp_id = String(paySelect[0].emp_id);
                    if (paySelect[0].start && tempTask.week_done !== paySelect[0].start) {
                        tempTask.week_done = paySelect[0].start;
                    }

                    const isCOD = tempTask.cod === 'True';
                    const isOtherBill = tempTask.other_bill === 'True' && tempTask.type !== 'Windows';

                    if ((isCOD || isOtherBill) && parseFloat(tempTask.price) > 0) {
                        if (newValue === "REFUSED") {
                            tempTask.cash_paid = "";
                            tempTask.temp_deposit_date = "";
                        } else {
                            // TODO: Implement modal workflow to replace InputBox
                            tempTask.cash_paid = tempTask.charge;
                            tempTask.temp_deposit_date = new Date().toLocaleDateString('en-US');
                        }
                    }
                }
                updatedTask = tempTask;
                const { uid: taskUid, ...rest } = updatedTask;
                apiPayload = rest;
                return updatedTask;
            });
        });

        try {
            if (!updatedTask) throw new Error("Update failed");

            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            const res = await fetch(`${API_BASE}/api/v1/accounting/edit_monthly_invoice_task`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ uid, ...apiPayload })
            });

            if (!res.ok) throw new Error('Server responded with an error.');
            
            originalValuesRef.current.set(`task-${uid}`, updatedTask);

        } catch (error) {
            setTasks(prevTasks => prevTasks?.map(t => t.uid === uid ? (originalTask || t) : t) || null);
        }
    }, [paySelect]);

    const currentEmployeeName = useMemo(() => {
        if (!paySelect || paySelect.length === 0 || !employees || employees.length === 0) return '';
        const empId = paySelect[0].emp_id;
        const employee = employees.find(e => e.id === empId);
        return employee ? employee.name : String(empId);
    }, [paySelect, employees]);

    const doneByOptions = useMemo(() => {
        const opts: HybridSelectOption[] = [
            {id: 'CANCELLED', label: 'CANCELLED', value: 'CANCELLED'},
            {id: 'NOT DONE', label: 'NOT DONE', value: 'NOT DONE'},
            {id: '__blank__', label: '\u00A0', value: ''}
        ];
        if (currentEmployeeName) {
            opts.unshift({id: currentEmployeeName, label: currentEmployeeName, value: currentEmployeeName});
        }
        return opts;
    }, [currentEmployeeName]);

    const handleDoneByKeyDown = useCallback((e: React.KeyboardEvent, task: Task) => {
        const moveFocus = () => {
            const nextField = document.getElementById(`workorder-hybrid-${task.uid}`);
            nextField?.focus();
        };

        if (['Enter', 'Tab', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            void handleDoneBySave(task, (e.target as HTMLInputElement).value);
            moveFocus();
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const originalDoneBy = originalValuesRef.current.get(`task-${task.uid}`)?.done_by ?? '';
            const isSpecialStatus = ["", "CANCELLED", "NOT DONE", "REFUSED"].includes(originalDoneBy);

            if (isSpecialStatus || originalDoneBy === currentEmployeeName) {
                const currentValue = (e.target as HTMLInputElement).value;
                const currentIndex = doneByOptions.findIndex(opt => opt.value === currentValue);
                const nextIndex = (currentIndex + 1) % doneByOptions.length;
                const nextValue = String(doneByOptions[nextIndex].value ?? '');
                setTasks(prevTasks => prevTasks?.map(t => t.uid === task.uid ? {...t, done_by: nextValue} : t) || null);
            }
        }
    }, [handleDoneBySave, currentEmployeeName, doneByOptions]);
    
    const handleDoneByChange = useCallback((task: Task, value: string) => {
        void handleDoneBySave(task, value);
        const nextField = document.getElementById(`workorder-hybrid-${task.uid}`);
        nextField?.focus();
    }, [handleDoneBySave]);

    const handleWorkOrderBlur = useCallback(async (uid: number, newValue: string) => {
        const originalValue = originalValuesRef.current.get(`task-${uid}`)?.work_order;
        if (newValue !== originalValue) {
            const taskToUpdate = tasks?.find(t => t.uid === uid);
            if (taskToUpdate) {
                await handleSimpleSave(taskToUpdate, 'work_order', newValue);
            }
        }
    }, [handleSimpleSave, tasks]);


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
                    {tasks.map((task) => {
                        return (
                            <tr key={task.uid}>
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

                                            // Custom: Done By - Wrapper
                                            case 'done_by':
                                                cellContent = (
                                                    <TaskDoneByCell
                                                        task={task}
                                                        options={doneByOptions}
                                                        onFocus={handleFocus}
                                                        onKeyDown={handleDoneByKeyDown}
                                                        onChange={handleDoneByChange}
                                                    />
                                                )
                                                break;

                                            // Custom: Comment - Wrapper
                                            case 'comment':
                                                cellContent = (
                                                    <TaskCommentCell
                                                        task={task}
                                                        commentOptions={commentOptions}
                                                        onChange={(task, val) => handleSimpleSave(task, 'comment', val)}
                                                        onFocus={handleFocus}
                                                    />
                                                )
                                                break;

                                            case 'work_order':
                                                cellContent = (
                                                    <HybridInputWrapper
                                                        id={`workorder-hybrid-${task.uid}`}
                                                        value={String(rawValue ?? '')}
                                                        onFocus={() => handleFocus(task)}
                                                        onBlur={(e) => handleWorkOrderBlur(task.uid, (e.target as HTMLInputElement).value)}
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
            <div style={{paddingLeft: '3px', borderTop: '1px solid var(--border-color)'}}>
                <div
                    className="text-gray-500"
                ><sub>Showing {tasks.length} tasks</sub>
                </div>
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