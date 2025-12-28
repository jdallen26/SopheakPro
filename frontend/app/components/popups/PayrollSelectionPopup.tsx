'use client';

import React from 'react';
import { usePayrollStore } from '@/app/store/payroll-store';

const PayrollSelectionPopup = () => {
    const { isPopupOpen, closePopup } = usePayrollStore();

    if (!isPopupOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-xl font-semibold">Payroll Selection</h3>
                    <button onClick={closePopup} className="text-black dark:text-white">&times;</button>
                </div>
                <div className="py-4">
                    <p>Popup Body - Controls will go here.</p>
                </div>
                <div className="flex justify-end items-center border-t pt-3">
                    <button onClick={closePopup} className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded mr-2">
                        Cancel
                    </button>
                    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Open Payroll
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PayrollSelectionPopup;



