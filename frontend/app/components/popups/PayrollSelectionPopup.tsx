'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/shared/components/Modal';
import { usePayrollStore } from '@/app/store/payroll-store';
import type { PayrollSelectionData } from '@/app/store/payroll-store';
import { toast } from '@/app/utils/toast';

// Define types for the raw API data to avoid using 'any'
interface ApiEmployee {
    id: number;
    name: string;
}

interface ApiPayrollWeek {
    payroll_week: string;
}

interface ApiRoute {
    id: string;
    route: string;
    description: string;
}

interface Task {
    route: string;
}

const PayrollSelectionPopup: React.FC = () => {
    const { isPayrollSelectionOpen, closePayrollSelection, triggerRefresh } = usePayrollStore();
    
    const [formData, setFormData] = useState<Partial<PayrollSelectionData>>({});
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [payrollWeeks, setPayrollWeeks] = useState<ApiPayrollWeek[]>([]);
    const [allRoutes, setAllRoutes] = useState<ApiRoute[]>([]);
    const [filteredRoutes, setFilteredRoutes] = useState<ApiRoute[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial data fetch
    useEffect(() => {
        if (isPayrollSelectionOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
                
                try {
                    // Employees
                    const empRes = await fetch(`${API_BASE}/api/v1/hr/employees`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ employed: true }),
                    });
                    const empData = await empRes.json();
                    const employeeList: ApiEmployee[] = empData?.employees || [];
                    employeeList.sort((a, b) => a.name.localeCompare(b.name));
                    setEmployees(employeeList);

                    // Payroll Weeks
                    const weeksRes = await fetch(`${API_BASE}/api/v1/payroll/payroll_weeks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });
                    const weeksData = await weeksRes.json();
                    const weekList: ApiPayrollWeek[] = weeksData?.weeks || [];
                    weekList.sort((a, b) => new Date(b.payroll_week).getTime() - new Date(a.payroll_week).getTime());
                    setPayrollWeeks(weekList);

                    // All Routes
                    const routesRes = await fetch(`${API_BASE}/api/v1/routing/route_list`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ active: true }),
                    });
                    const routesData = await routesRes.json();
                    const routeList: ApiRoute[] = routesData?.routes || [];
                    routeList.sort((a, b) => a.route.localeCompare(b.route));
                    setAllRoutes(routeList);
                    setFilteredRoutes(routeList); // Initially show all routes

                    // PSelect
                    const pselectRes = await fetch(`${API_BASE}/api/v1/payroll/pselect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                    });
                    const pselectData = await pselectRes.json();
                    const pselectRecord = pselectData?.pselect?.[0];
                    if (pselectRecord) {
                        let formattedStart = pselectRecord.start;
                        if (formattedStart && /^\d{4}-\d{2}-\d{2}/.test(formattedStart)) {
                            const [y, m, d] = formattedStart.split('T')[0].split('-');
                            formattedStart = `${m}/${d}/${y}`;
                        }
                        setFormData({
                            ...pselectRecord,
                            start: formattedStart,
                            route: pselectRecord.route?.trim()
                        });
                    }

                } catch (error) {
                    toast("Failed to load required data for the form.", 'danger', 'Error');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isPayrollSelectionOpen]);

    // Filter routes when start date changes
    useEffect(() => {
        const filterRoutesByDate = async () => {
            if (!formData.start) {
                setFilteredRoutes(allRoutes);
                return;
            }

            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
                const [month, day, year] = formData.start.split('/');
                const weekOfFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                
                const res = await fetch(`${API_BASE}/api/v1/payroll/task_list`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ week_of: weekOfFormatted }),
                });
                const data = await res.json();
                const tasks: Task[] = data?.tasks || [];
                
                const routesInTasks = new Set(tasks.map(task => task.route.trim()));
                const relevantRoutes = allRoutes.filter(route => routesInTasks.has(route.route.trim()));
                
                setFilteredRoutes(relevantRoutes);

            } catch (error) {
                toast("Could not filter routes for the selected date.", 'warning', 'Filter Warning');
                setFilteredRoutes(allRoutes); // Fallback to all routes on error
            }
        };

        if (allRoutes.length > 0) {
            filterRoutesByDate();
        }
    }, [formData.start, allRoutes]);


    if (!isPayrollSelectionOpen) {
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let newValue: string | number | boolean = value;
        if (type === 'checkbox') {
            newValue = (e.target as HTMLInputElement).checked;
        } else if (name === 'emp_id') {
            newValue = parseInt(value, 10);
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
    };

    const handleEnterPayroll = async () => {
        setIsSaving(true);
        
        const { uid, emp_id, start, route, spec_equip } = formData;

        if (!uid || !emp_id || !start || !route) {
            toast({ error: "Please fill out all required fields: Employee, Beginning Date, and Route." }, 'warning', 'Validation Error');
            setIsSaving(false);
            return;
        }

        const startDate = new Date(start);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        
        const formatDate = (date: Date) => {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        };

        const payload = {
            uid,
            emp_id,
            start: formatDate(startDate),
            end: formatDate(endDate),
            route,
            spec_equip: spec_equip || false,
        };
        
        try {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            const url = `${API_BASE}/api/v1/payroll/pselect_edit`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMessage = `Save failed with status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
                } catch (e) {
                    // Not a JSON response
                }
                throw new Error(errorMessage);
            }
            
            triggerRefresh();
            closePayrollSelection();

        } catch (error) {
            const errorMessage = (error as Error).message;
            const toastMessage = {
                error: errorMessage,
                payload: payload
            };
            toast(toastMessage, 'danger', 'Error');
        } finally {
            setIsSaving(false);
        }
    };

    const footer = (
        <div className="flex w-full justify-between">
            <button
                onClick={closePayrollSelection}
                className="btn btn-primary flex items-center justify-center gap-2"
                style={{
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--button-text)',
                    marginTop: '2px',
                    marginBottom: '2px',
                    marginLeft: '4px',
                    width: '140px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--button-bg)'
                    e.currentTarget.style.color = 'var(--button-text)'
                }}
                disabled={isSaving}
            >
                Exit
            </button>
            <button
                onClick={handleEnterPayroll}
                className="btn btn-primary flex items-center justify-center gap-2"
                style={{
                    backgroundColor: 'var(--button-bg)',
                    color: 'var(--button-text)',
                    marginTop: '2px',
                    marginBottom: '2px',
                    marginLeft: '4px',
                    width: '140px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--hover-bg)'
                    e.currentTarget.style.color = 'var(--foreground)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--button-bg)'
                    e.currentTarget.style.color = 'var(--button-text)'
                }}
                disabled={isSaving || isLoading}
            >
                {isSaving ? 'Processing...' : 'Enter Payroll'}
            </button>
        </div>
    );

    return (
        <Modal
            isOpen={isPayrollSelectionOpen}
            onClose={closePayrollSelection}
            title="Payroll Selection"
            footer={footer}
        >
            {isLoading ? (
                <div className="flex justify-center items-center h-40">Loading...</div>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleEnterPayroll(); }}>
                    <div className="grid grid-cols-1 gap-2">
                        <div>
                            <label htmlFor="emp_id" className="form-label" style={{ color: 'var(--foreground)' }}>Employee:</label>
                            <select 
                                id="emp_id" 
                                name="emp_id" 
                                className="w-full bg-transparent p-1" 
                                style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
                                value={formData.emp_id || ''} 
                                onChange={handleChange}
                            >
                                <option value="">Select Employee…</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="start" className="form-label" style={{ color: 'var(--foreground)' }}>Beginning Date:</label>
                            <select 
                                id="start" 
                                name="start" 
                                className="w-full bg-transparent p-1" 
                                style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
                                value={formData.start || ''} 
                                onChange={handleChange}
                            >
                                <option value="">Select Week…</option>
                                {payrollWeeks.map(week => (
                                    <option key={week.payroll_week} value={week.payroll_week}>{week.payroll_week}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="route" className="form-label" style={{ color: 'var(--foreground)' }}>Route:</label>
                            <select 
                                id="route" 
                                name="route" 
                                className="w-full bg-transparent p-1" 
                                style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
                                value={formData.route || ''} 
                                onChange={handleChange}
                                disabled={!formData.start}
                            >
                                <option value="">Select Route…</option>
                                {filteredRoutes.map(r => (
                                    <option key={r.route} value={r.route}>{r.route} - {r.description}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input 
                                id="spec_equip" 
                                name="spec_equip" 
                                type="checkbox" 
                                className="w-4 h-4"
                                checked={formData.spec_equip || false} 
                                onChange={handleChange} 
                            />
                            <label htmlFor="spec_equip" className="ml-2" style={{ color: 'var(--foreground)', paddingLeft: '3px' }}>Special Equipment</label>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default PayrollSelectionPopup;
