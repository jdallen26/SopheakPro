'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/shared/components/Modal';
import { usePayrollStore } from '@/app/store/payroll-store';
import type { PayrollSelectionData } from '@/app/store/payroll-store';
import { toastOnNextLoad } from '@/app/utils/toast';
import {json} from "node:stream/consumers";

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

const PayrollSelectionPopup: React.FC = () => {
    const { isPayrollSelectionOpen, closePayrollSelection } = usePayrollStore();
    
    const [formData, setFormData] = useState<Partial<PayrollSelectionData>>({});
    const [employees, setEmployees] = useState<ApiEmployee[]>([]);
    const [payrollWeeks, setPayrollWeeks] = useState<ApiPayrollWeek[]>([]);
    const [routes, setRoutes] = useState<ApiRoute[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isPayrollSelectionOpen) {
            const fetchData = async () => {
                setIsLoading(true);
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.12.241:8000').replace(/\/$/, '');
                
                try {
                    const [empRes, weeksRes, routesRes, pselectRes] = await Promise.all([
                        fetch(`${API_BASE}/api/v1/hr/employees/?employed=1`),
                        fetch(`${API_BASE}/api/v1/payroll/payroll_weeks`),
                        fetch(`${API_BASE}/api/v1/routing/route_list/?active=1`),
                        fetch(`${API_BASE}/api/v1/payroll/pselect`)
                    ]);

                    const empData = await empRes.json();
                    const weeksData = await weeksRes.json();
                    const routesData = await routesRes.json();
                    const pselectData = await pselectRes.json();

                    // Safely get the nested arrays
                    const employeeList: ApiEmployee[] = empData?.employees || [];
                    const weekList: ApiPayrollWeek[] = weeksData?.weeks || [];
                    const routeList: ApiRoute[] = routesData?.routes || [];
                    
                    // Sort the data
                    employeeList.sort((a, b) => a.name.localeCompare(b.name));
                    routeList.sort((a, b) => a.route.localeCompare(b.route));
                    weekList.sort((a, b) => new Date(b.payroll_week).getTime() - new Date(a.payroll_week).getTime());

                    setEmployees(employeeList);
                    setPayrollWeeks(weekList);
                    setRoutes(routeList);

                    // Set initial form data from the fresh pselect fetch
                    const pselectRecord = pselectData?.pselect?.[0];
                    if (pselectRecord) {
                        setFormData({
                            ...pselectRecord,
                            start: pselectRecord.start, // Use the 'start' field directly
                            route: pselectRecord.route?.trim()
                        });
                    }

                } catch (error) {
                    console.error("Failed to fetch dropdown data", error);
                    alert("Failed to load required data for the form.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isPayrollSelectionOpen]);

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
        
        const { uid } = formData;
        if (!uid) {
            alert("Error: UID is missing. Cannot save.");
            setIsSaving(false);
            return;
        }

        // Construct the payload with keys matching the Python backend
        const payload = {
            uid: formData.uid,
            emp_id: formData.emp_id,
            start_mmddyyyy: formData.start,
            route: formData.route,
            spec_equip: formData.spec_equip,
            mile_rate: formData.mile_rate,
            reim_exp_currency: formData.reim_exp,
            otime_percentage: formData.otime_percentage,
            chk_price_paid: formData.chk_price_paid,
        };
        

        try {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.12.241:8000').replace(/\/$/, '');
            const url = `${API_BASE}/api/v1/pselect_edit/`;
            // Use the new utility to show the toast on the next page load
            toastOnNextLoad("Payload:\n" + JSON.stringify(payload) + "\nURL: " + url);

            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            sessionStorage.setItem('justAppliedFilters', '1');
        } catch (error) {
            console.error('Save error:', error);
            // Still show a toast even if the save fails
            toastOnNextLoad({ error: 'Failed to save selection to the server.', payload });
        } finally {
            const params = new URLSearchParams({
                employee: String(formData.emp_id || ''),
                date: String(formData.start || ''),
                route: String(formData.route || ''),
            });
            if (formData.spec_equip) {
                params.set('special_equipment', 'on');
            }
            
            window.location.href = `/payroll/processor?${params.toString()}`;
        }
    };

    const footer = (
        <>
            <button onClick={closePayrollSelection} className="btn btn-danger" disabled={isSaving}>Exit</button>
            <button onClick={handleEnterPayroll} className="btn btn-primary" disabled={isSaving || isLoading}>
                {isSaving ? 'Processing...' : 'Enter Payroll'}
            </button>
        </>
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
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="emp_id" className="form-label">Employee:</label>
                            <select id="emp_id" name="emp_id" className="form-control" value={formData.emp_id || ''} onChange={handleChange}>
                                <option value="">Select Employee…</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="start" className="form-label">Beginning Date:</label>
                            <select id="start" name="start" className="form-control" value={formData.start || ''} onChange={handleChange}>
                                <option value="">Select Week…</option>
                                {payrollWeeks.map(week => (
                                    <option key={week.payroll_week} value={week.payroll_week}>{week.payroll_week}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="route" className="form-label">Route:</label>
                            <select id="route" name="route" className="form-control" value={formData.route || ''} onChange={handleChange}>
                                <option value="">Select Route…</option>
                                {routes.map(r => (
                                    <option key={r.id} value={r.route}>{r.route} - {r.description}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input id="spec_equip" name="spec_equip" type="checkbox" className="form-checkbox" checked={formData.spec_equip || false} onChange={handleChange} />
                            <label htmlFor="spec_equip" className="ml-2 form-check-label">Special Equipment</label>
                        </div>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default PayrollSelectionPopup;
