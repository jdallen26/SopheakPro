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
    description?: string; // Made optional to resolve TS error
}

interface PayrollState {
  isPayrollSelectionOpen: boolean;
  payrollSelectionData: PayrollSelectionData | null;
  refreshId: number; // Added to trigger re-fetching
  openPayrollSelection: () => void;
  closePayrollSelection: () => void;
  updatePayrollSelectionData: (newPselect: PayrollSelectionData) => void;
  triggerRefresh: () => void; // Added to trigger re-fetching
}

export const usePayrollStore = create<PayrollState>((set) => ({
  isPayrollSelectionOpen: false,
  payrollSelectionData: null,
  refreshId: 0,
  openPayrollSelection: () => {
    console.log('Opening payroll selection');
    set({ isPayrollSelectionOpen: true });
  },
  closePayrollSelection: () => set({ isPayrollSelectionOpen: false }),
  updatePayrollSelectionData: (newPselect) => set({ payrollSelectionData: newPselect }),
  triggerRefresh: () => set((state) => ({ refreshId: state.refreshId + 1 })),
}));
