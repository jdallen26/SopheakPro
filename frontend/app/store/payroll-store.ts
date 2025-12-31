import { create } from 'zustand';

export interface PayrollSelectionData {
    uid: number;
    emp_id: number;
    start: string;
    end: string;
    week_done: string;
    old_start: string;
    old_end: string;
    mile_rate: string;
    chk_price_paid: string;
    reim_exp: string;
    otime_percentage: string;
    spec_equip: boolean;
    billing_date: string;
    invoice_num: number;
    employee_name?: string;
    route?: string;
}

interface PayrollState {
  isPayrollSelectionOpen: boolean;
  payrollSelectionData: PayrollSelectionData | null;
  openPayrollSelection: () => void;
  closePayrollSelection: () => void;
  updatePayrollSelectionData: (newPselect: PayrollSelectionData) => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  isPayrollSelectionOpen: false,
  payrollSelectionData: null,
  openPayrollSelection: () => {
    console.log('Opening payroll selection');
    set({ isPayrollSelectionOpen: true });
  },
  closePayrollSelection: () => set({ isPayrollSelectionOpen: false }),
  updatePayrollSelectionData: (newPselect) => set({ payrollSelectionData: newPselect }),
}));


