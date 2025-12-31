'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/app/shared/components/Modal';
import { usePayrollStore } from '@/app/store/payroll-store';
import type { PayrollSelectionData } from '@/app/store/payroll-store';

const PayrollSelectionPopup: React.FC = () => {
  const { isPayrollSelectionOpen, closePayrollSelection, payrollSelectionData, updatePayrollSelectionData } = usePayrollStore();

  const [formData, setFormData] = useState<Partial<PayrollSelectionData>>(payrollSelectionData || {});

  useEffect(() => {
    if (payrollSelectionData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(payrollSelectionData);
    }
  }, [payrollSelectionData]);

  if (isPayrollSelectionOpen) {
    console.log('PayrollSelectionPopup is open');
  }

  if (!isPayrollSelectionOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    let newValue: string | number | boolean = value;
    if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
    }
    if (type === 'number') {
        newValue = parseFloat(value);
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = () => {
    if (payrollSelectionData) {
        const updatedData = {
            ...payrollSelectionData,
            ...formData,
        };
        updatePayrollSelectionData(updatedData as PayrollSelectionData);
    }
    closePayrollSelection();
  };

  const footer = (
    <>
      <button onClick={closePayrollSelection} className="btn btn-secondary">Cancel</button>
      <button onClick={handleSave} className="btn btn-primary">Save</button>
    </>
  );

  return (
    <Modal
      isOpen={isPayrollSelectionOpen}
      onClose={closePayrollSelection}
      title="Payroll Selection"
      footer={footer}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="employee_name" className="form-label">Employee</label>
          <input type="text" id="employee_name" name="employee_name" className="form-control" value={formData.employee_name || ''} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="start" className="form-label">Date</label>
          <input type="date" id="start" name="start" className="form-control" value={formData.start || ''} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="route" className="form-label">Route</label>
          <input type="text" id="route" name="route" className="form-control" value={formData.route || ''} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="mile_rate" className="form-label">Mileage Rate</label>
            <input type="number" id="mile_rate" name="mile_rate" className="form-control" value={formData.mile_rate || ''} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="chk_price_paid" className="form-label">Check Price Paid</label>
            <input type="number" id="chk_price_paid" name="chk_price_paid" className="form-control" value={formData.chk_price_paid || ''} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="reim_exp" className="form-label">Reimbursed Expenses</label>
            <input type="number" id="reim_exp" name="reim_exp" className="form-control" value={formData.reim_exp || ''} onChange={handleChange} />
        </div>
        <div>
            <label htmlFor="otime_percentage" className="form-label">Overtime %</label>
            <input type="number" id="otime_percentage" name="otime_percentage" className="form-control" value={formData.otime_percentage || ''} onChange={handleChange} />
        </div>
        <div className="flex items-center">
            <input type="checkbox" id="spec_equip" name="spec_equip" className="form-checkbox" checked={formData.spec_equip || false} onChange={handleChange} />
            <label htmlFor="spec_equip" className="ml-2">Special Equipment</label>
        </div>
      </div>
    </Modal>
  );
};

export default PayrollSelectionPopup;
