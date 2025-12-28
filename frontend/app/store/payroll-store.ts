import { create } from 'zustand';

interface PSelect {
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
  isPopupOpen: boolean;
  pselect: PSelect | null;
  openPopup: () => void;
  closePopup: () => void;
  updatePselect: (newPselect: PSelect) => void;
}

export const usePayrollStore = create<PayrollState>((set) => ({
  isPopupOpen: false,
  pselect: null,
  openPopup: () => set({ isPopupOpen: true }),
  closePopup: () => set({ isPopupOpen: false }),
  updatePselect: (newPselect) => set({ pselect: newPselect }),
}));
