import { create } from 'zustand';

/**
 * Interface representing the data structure for a payroll selection.
 * This includes details about the employee, time period, rates, and billing information.
 */
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
    description: string;
}

/**
 * Interface for the Payroll Store state.
 * Defines the state variables and actions available in the store.
 */
interface PayrollState {
  isPayrollSelectionOpen: boolean;
  payrollSelectionData: PayrollSelectionData | null;
  openPayrollSelection: () => void;
  closePayrollSelection: () => void;
  updatePayrollSelectionData: (newPselect: PayrollSelectionData) => void;
}

/**
 * Zustand store for managing payroll selection state.
 * Handles the visibility of the payroll selection modal/component and stores the selected payroll data.
 */
export const usePayrollStore = create<PayrollState>((set) => ({
  isPayrollSelectionOpen: false,
  payrollSelectionData: null,
  // Action to open the payroll selection UI
  openPayrollSelection: () => {
    console.log('Opening payroll selection');
    set({ isPayrollSelectionOpen: true });
  },
  // Action to close the payroll selection UI
  closePayrollSelection: () => set({ isPayrollSelectionOpen: false }),
  // Action to update the currently selected payroll data
  updatePayrollSelectionData: (newPselect) => set({ payrollSelectionData: newPselect }),
}));
