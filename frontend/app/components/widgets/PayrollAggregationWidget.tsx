'use client';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import WidgetTemplate from './WidgetTemplate';
import { HybridSelectWrapper, HybridSelectOption } from '@/app/shared/components/HybridSelectWrapper';
import { Settings } from 'lucide-react';

interface PayrollWeek {
    row_id: number;
    payroll_week: string;
    task_count: number;
}

interface RouteData {
    week_of: string;
    route: string;
    task_count: number;
    completed_count: number;
    percent_complete: string;
    cash_paid: string;
    charges: string;
    total_tax: string;
    total_price: string;
    total_commission_paid: string;
}

const formatToYyyyMmDd = (dateString: string): string => {
    if (!dateString) return '';
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const getCurrentMonday = (): string => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    
    const mm = String(monday.getMonth() + 1).padStart(2, '0');
    const dd = String(monday.getDate()).padStart(2, '0');
    const yyyy = monday.getFullYear();
    
    return `${mm}/${dd}/${yyyy}`;
};

const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num || 0);
};

export default function PayrollAggregationWidget() {
    const [weekOptions, setWeekOptions] = useState<HybridSelectOption[]>([]);
    const [selectedWeek, setSelectedWeek] = useState<string>('');
    const [routeData, setRouteData] = useState<RouteData[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    
    // Refresh Settings State
    const [refreshRate, setRefreshRate] = useState<number>(5); // Default 5 minutes
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef<HTMLDivElement>(null);

    // Close settings on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Payroll Weeks
    useEffect(() => {
        const fetchWeeks = async () => {
            try {
                const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
                const res = await fetch(`${API_BASE}/api/v1/payroll/payroll_weeks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                
                if (!res.ok) throw new Error('Failed to fetch weeks');
                const data = await res.json();
                
                let options: HybridSelectOption[] = (data.weeks || []).map((w: PayrollWeek) => ({
                    id: w.row_id,
                    label: w.payroll_week,
                    value: w.payroll_week
                }));

                const currentMonday = getCurrentMonday();
                const hasCurrentMonday = options.some(opt => opt.value === currentMonday);

                if (!hasCurrentMonday) {
                    const newOption = { id: 'current-week', label: currentMonday, value: currentMonday };
                    options = [newOption, ...options];
                }
                
                setWeekOptions(options);
                
                // Default to current Monday if nothing selected, or if the list was empty
                if (!selectedWeek) {
                    setSelectedWeek(currentMonday);
                }
            } catch (error) {
                console.error('Error fetching payroll weeks:', error);
                // Fallback to current Monday on error
                const currentMonday = getCurrentMonday();
                setWeekOptions([{ id: 'current-week', label: currentMonday, value: currentMonday }]);
                setSelectedWeek(currentMonday);
            }
        };
        void fetchWeeks();
    }, []);

    const fetchAggregatedData = useCallback(async () => {
        if (!selectedWeek) return;
        
        // Only set loading on initial fetch or manual change, not background refresh
        if (routeData.length === 0) setLoading(true);

        try {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            const formattedDate = formatToYyyyMmDd(selectedWeek);
            
            const res = await fetch(`${API_BASE}/api/v1/payroll/payroll_aggregate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ week_of: formattedDate })
            });
            
            if (!res.ok) throw new Error('Failed to fetch aggregate data');
            const result = await res.json();
            setRouteData(result.data || []);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (error) {
            console.error('Error fetching aggregate data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedWeek, routeData.length]);

    // Initial Fetch and Timer
    useEffect(() => {
        void fetchAggregatedData();

        if (refreshRate > 0) {
            const intervalId = setInterval(() => {
                void fetchAggregatedData();
            }, refreshRate * 60000);
            return () => clearInterval(intervalId);
        }
    }, [fetchAggregatedData, refreshRate]);

    // Process Data for Layout
    const routePairs = useMemo(() => {
        const pairs = [];
        for (let i = 0; i < routeData.length; i += 2) {
            pairs.push(routeData.slice(i, i + 2));
        }
        return pairs;
    }, [routeData]);

    const totals = useMemo(() => {
        return routeData.reduce((acc, curr) => ({
            tasks: acc.tasks + curr.task_count,
            completed: acc.completed + curr.completed_count,
            price: acc.price + parseFloat(curr.total_price),
            commission: acc.commission + parseFloat(curr.total_commission_paid)
        }), { tasks: 0, completed: 0, price: 0, commission: 0 });
    }, [routeData]);

    const headerContent = (
        <div className="flex items-center gap-2">
            <div style={{ width: '200px' }}>
                <HybridSelectWrapper
                    options={weekOptions}
                    value={selectedWeek}
                    onChange={(val) => setSelectedWeek(String(val))}
                    placeholder="Select Week"
                    clearable={false}
                />
            </div>
            <div className="relative" ref={settingsRef}>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`p-1 rounded hover:bg-gray-100 transition-colors ${refreshRate === 0 ? 'text-red-400' : 'text-gray-500'}`}
                    title="Refresh Settings"
                >
                    <Settings size={18} />
                </button>
                
                {isSettingsOpen && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-blue-500 rounded-lg shadow-xl z-50 py-1 overflow-hidden" style={{border: '1px solid var(--border-color)'}}>
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50"  style={{paddingLeft: '4px', borderBottomWidth: '1px'}}>
                            Refresh Rate
                        </div>
                        {[1, 3, 5, 10, 15, 20, 30].map(min => (
                            <button
                                key={min}
                                onClick={() => { setRefreshRate(min); setIsSettingsOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${refreshRate === min ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                                style={{paddingLeft: '4px'}}
                            >
                                {min} Minutes
                            </button>
                        ))}
                        <button
                            onClick={() => { setRefreshRate(0); setIsSettingsOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors border-t border-gray-100 ${refreshRate === 0 ? 'text-red-500 font-medium bg-red-50' : 'text-gray-700'}`}
                            style={{paddingLeft: '4px'}}
                        >
                            Disabled
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const footerContent = (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-semibold text-center">
            <div className="p-2 rounded  bg-gray-100">
                <div className="text-xs text-gray-500">Total Tasks</div>
                <div>{totals.tasks.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded bg-gray-100">
                <div className="text-xs text-gray-500">Completed</div>
                <div>{totals.completed.toLocaleString()}</div>
            </div>
            <div className="p-2 rounded  bg-gray-100">
                <div className="text-xs text-gray-500">Total Price</div>
                <div>{formatCurrency(totals.price)}</div>
            </div>
            <div className="p-2 rounded  bg-gray-100">
                <div className="text-xs text-gray-500">Total Commission</div>
                <div>{formatCurrency(totals.commission)}</div>
            </div>
        </div>
    );

    return (
        <WidgetTemplate 
            title={
                <div className="flex items-baseline gap-2">
                    <span>Payroll Progress</span>
                    {lastUpdated && <span className="text-xs text-gray-400 font-normal">Last Updated: {lastUpdated}</span>}
                </div>
            } 
            headerContent={headerContent}
        >
            {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full" style={{ borderSpacing: '0', borderCollapse: 'separate' }}>
                            <tbody>
                                {routePairs.map((pair, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {pair.map((route, colIndex) => (
                                            <td key={colIndex} className="p-3 w-1/2 align-top" style={{ border: '1px solid var(--border-color)', paddingLeft: '4px', paddingRight: '4px' }}>
                                                {/* Row 1: Route Name | Progress Bar */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-sm whitespace-nowrap mr-6" style={{paddingRight: '4px'}}>{route.route}</span>
                                                    
                                                    {/* Masked Gradient Progress Bar */}
                                                    <div className="relative flex-grow h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-400 to-green-600">
                                                        <div 
                                                            className="absolute top-0 right-0 h-full bg-gray-200 transition-all duration-500 ease-out"
                                                            style={{ width: `${100 - parseFloat(route.percent_complete)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Row 2: Tasks Complete | Stats */}
                                                <div className="flex justify-between items-center text-xs text-gray-500">
                                                    <span>{route.completed_count} / {route.task_count} Tasks Complete</span>
                                                    <span className="font-medium">{formatCurrency(route.total_price)}</span>
                                                </div>
                                            </td>
                                        ))}
                                        {pair.length === 1 && <td className="w-1/2" style={{ border: '1px solid var(--border-color)' }}></td>}
                                    </tr>
                                ))}
                                {routeData.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="p-4 text-center text-gray-500" style={{ border: '1px solid var(--border-color)' }}>No data available for this week</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" style={{paddingTop: '5px'}}>
                        {footerContent}
                    </div>
                </>
            )}
        </WidgetTemplate>
    );
}