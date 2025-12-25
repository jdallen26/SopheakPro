// javascript
import {AdvancedCombo} from './advanced-combo.js';

/*
Initializes five AdvancedCombo instances and wires site changes + modal show.
- fetchTasks uses `insert-payroll-entry-site-modal` value to call the server API.
- createHandler posts to an example create API and expects a JSON-created item.
*/

document.addEventListener('DOMContentLoaded', () => {
    const siteSelect = document.getElementById('insert-payroll-entry-site-modal');
    const modalEl = document.getElementById('insertEntryModal');
    const insertBtn = document.getElementById('insertEntryBtn');

    async function fetchTasks(query = '') {
        const custId = siteSelect ? siteSelect.value : '';
        if (!custId) return [];
        const url = `/api/payroll_task_selection_api?cust_id=${encodeURIComponent(custId)}&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        const tasks = json.tasks ?? json.data ?? json ?? [];
        return (tasks || []).map(t => {
            const parts = [];
            if (t.master_id) parts.push(t.master_id);
            if (t.company) parts.push(t.company);
            if (t.description) parts.push(t.description);
            const tax = t.sale_tax_formatted ?? t.sale_tax;
            if (tax !== undefined && tax !== null && String(tax).trim() !== '') parts.push(`tax: ${tax}`);
            return {
                id: String(t.id ?? ''),
                label: parts.join(' \u2014 ') || String(t.description ?? t.id ?? ''),
                icon: t.icon_url || t.icon || '',
                meta: t.sale_tax_formatted ?? ''
            };
        });
    }

    async function createTaskOnServer(text) {
        const custId = siteSelect ? siteSelect.value : '';
        const url = '/api/payroll_task_create';
        const res = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({cust_id: custId, description: text})
        });
        if (!res.ok) throw new Error('Create failed');
        const json = await res.json();
        return {
            id: json.id ?? json.pk ?? '',
            label: json.description ?? json.label ?? text,
            icon: json.icon_url ?? '',
            meta: json.sale_tax_formatted ?? ''
        };
    }

    function comboOptions() {
        return {
            fetcher: async (q) => {
                try {
                    return await fetchTasks(q);
                } catch (e) {
                    console.error(e);
                    return [];
                }
            },
            multi: false,
            showCheckbox: false,
            showIcon: true,
            allowFreeText: true,
            confirmCreate: true,
            createHandler: async (text) => {
                try {
                    return await createTaskOnServer(text);
                } catch (err) {
                    console.error('create failed', err);
                    return null;
                }
            },
            debounceMs: 160,
            minChars: 0,
            onChange: (val) => { /* optional global change hook */
            }
        };
    }

    const combos = [];
    for (let i = 1; i <= 5; i++) {
        const root = document.getElementById(`taskComboRoot-${i}`);
        if (!root) continue;
        const combo = new AdvancedCombo(root, comboOptions());
        combos.push(combo);
    }

    function reloadAllCombos() {
        combos.forEach(c => {
            c.selected = [];
            if (c.input) c.input.value = '';
            if (c.input) c.input.dispatchEvent(new Event('input', {bubbles: true}));
            c._writeHidden && c._writeHidden();
        });
    }

    if (siteSelect) {
        siteSelect.addEventListener('change', reloadAllCombos);
    }

    if (modalEl) {
        modalEl.addEventListener('shown.bs.modal', () => {
            reloadAllCombos();
            combos[0] && combos[0].input && combos[0].input.focus();
        });
    }

    if (insertBtn) {
        insertBtn.addEventListener('click', () => {
            const payload = combos.map((c, idx) => ({
                slot: idx + 1,
                value: c.getValue(),
                hiddenText: (c.hiddenText && c.hiddenText.value) || ''
            }));
            console.log('Insert payload:', payload);
            // submit or send payload as needed
        });
    }
});
