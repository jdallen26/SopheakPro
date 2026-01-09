'use client';
import React, { useState, useEffect } from 'react';
import { HybridSelectWrapper, HybridSelectOption, HybridSelectValue } from '@/app/shared/components/HybridSelectWrapper';
import { toast } from '@/app/utils/toast';

interface ApiComment {
    id: number;
    comment: string;
    count?: number;
}

export default function ControlTestingPage() {
    const [singleValue, setSingleValue] = useState<string | number | null>(null);
    const [multiValue, setMultiValue] = useState<(string | number)[]>([]);
    const [commentOptions, setCommentOptions] = useState<HybridSelectOption[]>([]);
    const [selectKey, setSelectKey] = useState(0); // Key to force re-render

    // Dummy data for testing
    const testOptions: HybridSelectOption[] = [
        { id: 1, label: 'Alice Johnson', value: '1', description: 'Software Engineer', icon: 'user' },
        { id: 2, label: 'Bob Smith', value: '2', description: 'Product Manager', icon: 'user-tie' },
        { id: 3, label: 'Charlie Brown', value: '3', description: 'Designer', icon: 'pen-nib' },
        { id: 4, label: 'David Wilson', value: '4', description: 'QA Tester', icon: 'bug' },
        { id: 5, label: 'Eva Davis', value: '5', description: 'HR Specialist', icon: 'users' },
    ];

    useEffect(() => {
        const fetchComments = async () => {
            const API_BASE = (process.env.NEXT_PUBLIC_LOCAL_API_BASE_URL || 'http://192.168.1.50:8000').replace(/\/$/, '');
            try {
                const res = await fetch(`${API_BASE}/api/v1/payroll/comments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        refresh: true,
                        min_count: 50
                    })
                });

                const data = await res.json();

                if (data && Array.isArray(data.comments)) {
                    const formattedOptions = data.comments.map((c: ApiComment) => ({
                        id: c.id,
                        label: c.comment,
                        value: c.id,
                        // description: `Count: ${c.count}`,
                        icon: 'comment'
                    }));
                    setCommentOptions(formattedOptions);
                }
            } catch (error) {
                console.error("Failed to fetch comments", error);
            }
        };

        fetchComments();
    }, []);

    // Handler for the single select change
    const handleCommentChange = (value: HybridSelectValue, option: HybridSelectOption | HybridSelectOption[] | null) => {
        // Example: Cancel the change if the specific ID is selected (e.g., ID 999)
        const valueOverride = true;
        if (value === 999 || value === '999' || valueOverride) {
            toast('This selection is not allowed.', 'warning', 'Change Cancelled');
            // Force re-render to reset the control to the previous value
            setSelectKey(prev => prev + 1);
            return; 
        }

        // Update state (commit the change)
        setSingleValue(value as string | number | null);

        // Example of accessing the full option object
        if (option && !Array.isArray(option)) {
            console.log("Selected Option Details:", option);
            toast(`Selected: ${option.label} (ID: ${value})`, 'info', 'Selection Changed');
        } else {
            toast(`Selected ID: ${value}`, 'info', 'Selection Changed');
        }
    };

    return (
        <div className="p-6" style={{padding: '3px'}}>

            <div className="flex flex-wrap">
                {/* Panel 1: Single Select */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 shadow-sm flex-1 min-w-[300px] m-[px]" style={{marginRight: '4px', padding: '12px'}}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Payroll Comments (Single)</h2>
                    <div className="max-w-md"> {/* This is test control number 1 */}
                        <HybridSelectWrapper 
                            key={selectKey} // Add key prop here
                            id="test-ctl-1"
                            label="Select Comment" 
                            placeholder="Search comments..."
                            options={commentOptions}
                            value={singleValue}
                            onChange={handleCommentChange}
                            onOpen={() => toast('Dropdown Opened', 'info', 'Event: Open')}
                            onClose={() => toast('Dropdown Closed', 'info', 'Event: Close')}
                            onInput={(val: string) => toast(`Input: ${val}`, 'info', 'Event: Input')}
                            onLoad={(opts: HybridSelectOption[], term: string) => toast(`Loaded ${opts.length} options for "${term}"`, 'success', 'Event: Load')}
                            onError={(err: unknown) => toast(`Error: ${String(err)}`, 'danger', 'Event: Error')}
                            onCreate={(label: string, opt: HybridSelectOption) => toast(`Created: ${label}`, 'success', 'Event: Create')}
                            showRecent
                            lightMode={true}
                        />
                    </div>
                    <div className="mt-4 p-3 rounded text-sm" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' }}>
                        Selected Value: <strong>{JSON.stringify(singleValue)}</strong>
                    </div>
                </div>

                {/* Panel 2: Multi Select */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-6 shadow-sm flex-1 min-w-[300px] m-[3px]" style={{marginLeft: '4px', padding: '12px'}}>
                    <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Hybrid Select (Multiple)</h2>
                    <div className="max-w-md"> {/* This is test control number 2 */}
                        <HybridSelectWrapper 
                            label="Assign Team Members" 
                            placeholder="Select multiple people..."
                            options={testOptions}
                            value={multiValue}
                            onChange={(v) => setMultiValue(v as (string | number)[])}
                            multiple
                            lightMode
                        />
                    </div>
                    <div className="mt-4 p-3 rounded text-sm" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' }}>
                        Selected Values: <strong>{JSON.stringify(multiValue)}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}