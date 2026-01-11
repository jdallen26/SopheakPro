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
const TaskDoneByCell = React.memo(({task, currentEmployeeName, onChange, onFocus}: {
    task: Task,
    currentEmployeeName: string,
    onChange: (task: Task, employeeName: string) => void,
    onFocus: (key: string, value: string) => void,
}) => {
    const selectRef = useRef<HybridSelectElement | null>(null);
    const currentDoneByVal = String(task.done_by ?? '');

    useEffect(() => {
        const handleNavigation = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const hs = target as unknown as HybridSelectElement;

            if (hs && hs._isOpen) {
                let index = hs._highlightedIndex;
                if (index === -1 && hs._filteredOptions && hs._filteredOptions.length > 0) {
                    index = 0;
                }
                if (index >= 0 && hs._filteredOptions && hs._filteredOptions[index]) {
                    hs._selectOption(hs._filteredOptions[index].id);
                } else {
                    hs.close();
                }
            }

            const allElements = Array.from(document.querySelectorAll('*'));
            const focusable = allElements.filter(el => {
                const isHybrid = el.tagName.toLowerCase() === 'hybrid-select' || el.tagName.toLowerCase() === 'hybrid-input';
                const isStandard = el.matches('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])');

                if (!isHybrid && !isStandard) return false;
                if (el.hasAttribute('disabled')) return false;

                // Check visibility
                return (el as HTMLElement).offsetParent !== null;
            }) as HTMLElement[];

            const currentIndex = focusable.indexOf(target);
            const nextElement = focusable[currentIndex + 1];

            if (nextElement) {
                setTimeout(() => nextElement.focus(), 0);
            }
        };

        const element = selectRef.current;
        if (element) {
            element.addEventListener('hybrid-select:arrow-right', handleNavigation);
            element.addEventListener('hybrid-select:tab', handleNavigation);
            return () => {
                element.removeEventListener('hybrid-select:arrow-right', handleNavigation);
                element.removeEventListener('hybrid-select:tab', handleNavigation);
            };
        }
    }, []);

    const options = useMemo(() => {
        let opts: HybridSelectOption[] = [
            {id: currentEmployeeName, label: currentEmployeeName, value: currentEmployeeName},
            {id: 'CANCELLED', label: 'CANCELLED', value: 'CANCELLED'},
            {id: 'NOT DONE', label: 'NOT DONE', value: 'NOT DONE'},
            {id: '__blank__', label: '\u00A0', value: ''}
        ];
        if (currentDoneByVal && !opts.some(o => o.value === currentDoneByVal)) {
            opts = [{id: currentDoneByVal, label: currentDoneByVal, value: currentDoneByVal}, ...opts];
        }
        return opts;
    }, [currentEmployeeName, currentDoneByVal]);

    return (
        <HybridSelectWrapper
            ref={selectRef}
            className="max-w-md"
            id={`doneby-hybrid-${task.uid}`}
            name={`doneby-hybrid-${task.uid}`}
            value={currentDoneByVal}
            placeholder={currentDoneByVal}
            searchable={true}
            required={true}
            options={options}
            clearable={false}
            onChange={(val) => {
                onChange(task, String(val));
            }}
            onFocus={() => onFocus(`done_by-${task.uid}`, currentDoneByVal)}
        />
    );
});
TaskDoneByCell.displayName = 'TaskDoneByCell';

const TaskCommentCell = React.memo(({task, commentOptions, onChange, onFocus}: {
    task: Task,
    commentOptions: HybridSelectOption[],
    onChange: (uid: number, val: string) => void,
    onFocus: (key: string, value: string) => void,
}) => {
    const selectRef = useRef<HybridSelectElement | null>(null);
    const currentCommentVal = String(task.comment ?? '');

    useEffect(() => {
        const handleNavigation = (e: Event) => {
            e.preventDefault();
            const target = e.target as HTMLElement;
            const hs = target as unknown as HybridSelectElement;

            if (hs && hs._isOpen) {
                let index = hs._highlightedIndex;
                if (index === -1 && hs._filteredOptions && hs._filteredOptions.length > 0) {
                    index = 0;
                }
                if (index >= 0 && hs._filteredOptions && hs._filteredOptions[index]) {
                    hs._selectOption(hs._filteredOptions[index].id);
                } else {
                    hs.close();
                }
            }

            const allElements = Array.from(document.querySelectorAll('*'));
            const focusable = allElements.filter(el => {
                const isHybrid = el.tagName.toLowerCase() === 'hybrid-select' || el.tagName.toLowerCase() === 'hybrid-input';
                const isStandard = el.matches('a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])');

                if (!isHybrid && !isStandard) return false;
                if (el.hasAttribute('disabled')) return false;

                // Check visibility
                return (el as HTMLElement).offsetParent !== null;
            }) as HTMLElement[];

            const currentIndex = focusable.indexOf(target);
            const nextElement = focusable[currentIndex + 1];

            if (nextElement) {
                setTimeout(() => nextElement.focus(), 0);
            }
        };

        const element = selectRef.current;
        if (element) {
            element.addEventListener('hybrid-select:arrow-right', handleNavigation);
            element.addEventListener('hybrid-select:tab', handleNavigation);
            return () => {
                element.removeEventListener('hybrid-select:arrow-right', handleNavigation);
                element.removeEventListener('hybrid-select:tab', handleNavigation);
            };
        }
    }, []);

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
            onChange={(val) => {
                toast(`Task ${task.uid} Comment changed to ${val}`, 'info');
                onChange(task.uid, String(val));
            }}
            onFocus={() => onFocus(`comment-${task.uid}`, currentCommentVal)}
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
    const originalValuesRef = useRef<Map<string, string>>(new Map());

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

    const handleTaskChange = useCallback(async (taskOrUid: number | Task, field: keyof Task, value: string | number | boolean, currentEmployeeName?: string) => {
        const uid = typeof taskOrUid === 'object' ? taskOrUid.uid : taskOrUid;
        const originalValue = originalValuesRef.current.get(`${field}-${uid}`);

        setTasks((prevTasks: Task[] | null) => {
            if (!prevTasks) return null;
            const updated = prevTasks.map(task =>
                task.uid === uid ? {...task, [field]: value} as Task : task
            );
            updateProgress(updated);
            return updated;
        });
        const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');

        switch (field) {
            case 'done_by':
                try {
                    const res = await fetch(`${API_BASE}/api/v1/accounting/edit_monthly_invoice_task`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            uid: uid,
                            done_by: value
                        })
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Failed to save ${field}: ${res.status} ${errorText}`);
                    }

                    const data = await res.json();
                    const updatedTask = data.task && data.task[0];

                    if (updatedTask) {
                        toast(`${field.replace('_', ' ')} for task ${uid} saved!`, 'success');
                        originalValuesRef.current.set(`${field}-${uid}`, updatedTask[field]);
                        setTasks((prevTasks: Task[] | null) => {
                            if (!prevTasks) return null;
                            const newTasks = prevTasks.map(t => t.uid === uid ? {
                                ...t, ...updatedTask,
                                done_by: String(updatedTask.done_by ?? '')
                            } as Task : t);
                            updateProgress(newTasks);
                            return newTasks;
                        });
                    } else {
                        throw new Error('Invalid response from server.');
                    }
                } catch (error) {
                    console.error(`Failed to save ${field}:`, error);
                    toast(`Error saving ${field.replace('_', ' ')}: ${(error as Error).message}`, 'danger');
                    setTasks((prevTasks: Task[] | null) => {
                        if (!prevTasks) return null;
                        const reverted = prevTasks.map(task =>
                            task.uid === uid ? {...task, [field]: originalValue ?? ''} as Task : task
                        );
                        updateProgress(reverted);
                        return reverted;
                    });
                }
                break;
            case 'comment':
                try {
                    const res = await fetch(`${API_BASE}/api/v1/accounting/edit_monthly_invoice_task`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            uid: uid,
                            [field]: value
                        })
                    });

                    if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`Failed to save ${field}: ${res.status} ${errorText}`);
                    }

                    const data = await res.json();
                    const updatedTask = data.task && data.task[0];

                    if (updatedTask) {
                        toast(`${field.replace('_', ' ')} for task ${uid} saved!`, 'success');
                        originalValuesRef.current.set(`${field}-${uid}`, updatedTask[field]);
                        setTasks((prevTasks: Task[] | null) => {
                            if (!prevTasks) return null;
                            const newTasks = prevTasks.map(t => t.uid === uid ? {...t, ...updatedTask} as Task : t);
                            updateProgress(newTasks);
                            return newTasks;
                        });
                    } else {
                        throw new Error('Invalid response from server.');
                    }
                } catch (error) {
                    toast(`Error saving ${field.replace('_', ' ')}: ${(error as Error).message}`, 'danger');
                    setTasks((prevTasks: Task[] | null) => {
                        if (!prevTasks) return null;
                        const reverted = prevTasks.map(task =>
                            task.uid === uid ? {...task, [field]: originalValue} as Task : task
                        );
                        updateProgress(reverted);
                        return reverted;
                    });
                }
                break;
            default:
                break;
        }
    }, [updateProgress]);

    const handleFocus = useCallback((key: string, value: string) => {
        toast(`Focused Value: ${key} for task...`, 'info')
        // console.log(`Focused Value: ${key} for task...`, `${value}`)
        originalValuesRef.current.set(key, value);
    }, []);

    const currentEmployeeName = useMemo(() => {
        if (!paySelect || paySelect.length === 0 || employees.length === 0) {
            return paySelect?.[0]?.emp_id ? String(paySelect[0].emp_id) : '';
        }
        const empId = paySelect[0].emp_id;
        const employee = employees.find(e => e.id === empId);
        return employee ? employee.name : String(empId);
    }, [paySelect, employees]);

    const handleWorkOrderBlur = useCallback(async (uid: number, newValue: string) => {
        const originalValue = originalValuesRef.current.get(`wo-${uid}`);
        if (newValue !== originalValue) {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
                const res = await fetch(`${API_BASE}/api/v1/accounting/edit_monthly_invoice_task`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        uid: uid,
                        work_order: newValue
                    })
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    throw new Error(`Failed to save work order: ${res.status} ${errorText}`);
                }

                const data = await res.json();
                const updatedTask = data.task && data.task[0];

                if (updatedTask) {
                    toast(`Work Order for task ${uid} saved!`, 'success');
                    originalValuesRef.current.set(`wo-${uid}`, updatedTask.work_order);

                    setTasks((prevTasks: Task[] | null) => {
                        if (!prevTasks) return null;
                        const newTasks = prevTasks.map(t => t.uid === uid ? {...t, ...updatedTask} as Task : t);
                        updateProgress(newTasks);
                        return newTasks;
                    });
                } else {
                    throw new Error('Invalid response from server.');
                }
            } catch (error) {
                void handleTaskChange(uid, 'work_order', originalValue || '', currentEmployeeName);
            }
        }
    }, [handleTaskChange, updateProgress, currentEmployeeName]);

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
                                                        currentEmployeeName={currentEmployeeName}
                                                        onChange={(t, val) => handleTaskChange(t, 'done_by', val, currentEmployeeName)}
                                                        onFocus={handleFocus}
                                                    />
                                                )
                                                break;

                                            // Custom: Comment - Wrapper
                                            case 'comment':
                                                cellContent = (
                                                    <TaskCommentCell
                                                        task={task}
                                                        commentOptions={commentOptions}
                                                        onChange={(uid, val) => handleTaskChange(uid, 'comment', val, currentEmployeeName)}
                                                        onFocus={handleFocus}
                                                    />
                                                )
                                                break;

                                            case 'work_order':
                                                cellContent = (
                                                    <HybridInputWrapper
                                                        value={String(rawValue ?? '')}
                                                        onFocus={(e) => handleFocus(`wo-${task.uid}`, (e.target as HTMLInputElement).value)}
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