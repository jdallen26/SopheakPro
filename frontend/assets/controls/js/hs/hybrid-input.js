/**
 * HybridInput - Self-contained enhanced text input with endpoint validation and multi-value support
 *
 * @version 2.0.3
 * @license MIT
 * 
 * Fixes in 2.0.3:
 * - Added --hi-focus-border-width CSS variable.
 *
 * Fixes in 2.0.2:
 * - Renamed all CSS variables from --hs- to --hi- for proper namespacing.
 *
 * Fixes in 2.0.1:
 * - Removed full _render() on value change to prevent cursor jumping and focus issues.
 * - Decoupled focus/blur styling from _render() to prevent DOM destruction on focus.
 * - Removed _render() from _handleInput to prevent DOM destruction on keystroke.
 */

(function(global) {
  'use strict';

  const COMPONENT_NAME = 'hybrid-input';
  const DEBOUNCE_MS = 300;

  // ... (Utilities: generateId, debounce, escapeHtml, SyncRegistry, Icons) ...
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  const SyncRegistry = {
    _groups: new Map(),
    _snapshots: new Map(),
    _broadcasting: new Set(),
    register(element, groupName) { if (!groupName) return; if (!this._groups.has(groupName)) { this._groups.set(groupName, new Set()); } this._groups.get(groupName).add(element); const snapshot = this._snapshots.get(groupName); if (snapshot && snapshot.options && snapshot.options.length > 0) { if (typeof element._applySyncSnapshot === 'function') { element._applySyncSnapshot(snapshot.options); } } },
    unregister(element, groupName) { if (!groupName) return; const group = this._groups.get(groupName); if (group) { group.delete(element); if (group.size === 0) { this._groups.delete(groupName); } } },
    migrate(element, oldGroup, newGroup) { this.unregister(element, oldGroup); this.register(element, newGroup); },
    publish(groupName, data, sourceElement) { if (!groupName || this._broadcasting.has(groupName)) return; this._broadcasting.add(groupName); const currentVersion = (this._snapshots.get(groupName)?.version || 0) + 1; this._snapshots.set(groupName, { version: currentVersion, options: Array.isArray(data) ? [...data] : data }); const group = this._groups.get(groupName); if (group) { group.forEach(element => { if (element !== sourceElement && typeof element._applySyncSnapshot === 'function') { element._applySyncSnapshot(data); } }); } this._broadcasting.delete(groupName); },
    refresh(groupName, payload = null) { const group = this._groups.get(groupName); if (!group) return; group.forEach(element => { if (payload) { if (typeof element._applySyncSnapshot === 'function') { element._applySyncSnapshot(payload); } } else if (element.getAttribute('data-url')) { if (typeof element._fetchRemoteData === 'function') { element._fetchRemoteData(''); } } else { const snapshot = this._snapshots.get(groupName); if (snapshot && typeof element._applySyncSnapshot === 'function') { element._applySyncSnapshot(snapshot.options); } } }); },
    getGroups() { return Array.from(this._groups.keys()); },
    getGroupMembers(groupName) { return this._groups.get(groupName) || new Set(); }
  };

  const Icons = {
    x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
  };

  const styles = `
    :host {
      --hi-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --hi-font-size: 16px;
      --hi-font-size-label: 14px;
      --hi-font-size-helper: 12px;
      --hi-bg: #ffffff;
      --hi-bg-hover: #f8f9fa;
      --hi-bg-selected: #e9ecef;
      --hi-bg-disabled: #f1f3f4;
      --hi-text: #1a1a1a;
      --hi-text-secondary: #6c757d;
      --hi-text-placeholder: #9ca3af;
      --hi-text-disabled: #9ca3af;
      --hi-border: #d1d5db;
      --hi-border-hover: #9ca3af;
      --hi-border-focus: #3b82f6;
      --hi-border-error: #ef4444;
      --hi-border-success: #22c55e;
      --hi-focus-border-width: 2px;
      --hi-ring: rgba(59, 130, 246, 0.15);
      --hi-ring-error: rgba(239, 68, 68, 0.15);
      --hi-ring-success: rgba(34, 197, 94, 0.15);
      --hi-radius: 8px;
      --hi-height: 48px;
      --hi-height-sm: 40px;
      --hi-height-lg: 56px;
      --hi-padding-x: 16px;
      --hi-padding-y: 12px;
      --hi-gap: 8px;
      --hi-transition: 0.2s ease;
      --hi-icon-size: 18px;
      display: block;
      font-family: var(--hi-font-family);
      font-size: var(--hi-font-size);
      position: relative;
      width: 100%;
    }
    :host([hidden]) { display: none; }
    :host([size="small"]), :host([size="sm"]) { --hi-height: var(--hi-height-sm); --hi-font-size: 14px; --hi-padding-x: 12px; --hi-padding-y: 8px; --hi-icon-size: 16px; }
    :host([size="large"]), :host([size="lg"]) { --hi-height: var(--hi-height-lg); --hi-font-size: 18px; --hi-padding-x: 20px; --hi-padding-y: 14px; --hi-icon-size: 20px; }
    * { box-sizing: border-box; }
    .wrapper { display: flex; flex-direction: column; gap: var(--hi-gap); width: 100%; }
    .label { font-size: var(--hi-font-size-label); font-weight: 500; color: var(--hi-text); user-select: none; }
    .label.required::after { content: ' *'; color: var(--hi-border-error); }
    .control { position: relative; display: flex; align-items: center; min-height: var(--hi-height); background: var(--hi-bg); border: 1px solid var(--hi-border); border-radius: var(--hi-radius); cursor: text; transition: border-color var(--hi-transition), box-shadow var(--hi-transition), background-color var(--hi-transition); }
    .control:hover:not(.disabled) { border-color: var(--hi-border-hover); background: var(--hi-bg-hover); }
    .control.focused:not(.disabled) { border-color: var(--hi-border-focus); border-width: var(--hi-focus-border-width); box-shadow: 0 0 0 3px var(--hi-ring); }
    .control.error { border-color: var(--hi-border-error); }
    .control.error.focused { box-shadow: 0 0 0 3px var(--hi-ring-error); }
    .control.success { border-color: var(--hi-border-success); }
    .control.success.focused { box-shadow: 0 0 0 3px var(--hi-ring-success); }
    .control.disabled { background: var(--hi-bg-disabled); cursor: not-allowed; opacity: 0.5; }
    .input-wrapper { flex: 1; display: flex; align-items: center; padding: 0 var(--hi-padding-x); min-width: 0; height: 100%; gap: 10px; }
    .input-container { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .input { flex: 1; min-width: 0; border: none; background: transparent; font-family: inherit; font-size: inherit; color: var(--hi-text); outline: none; padding: var(--hi-padding-y) 0; margin: 0; width: 100%; line-height: 1.4; height: auto; }
    .input::placeholder { color: var(--hi-text-placeholder); }
    .input:disabled { cursor: not-allowed; color: var(--hi-text-disabled); }
    .input.has-chips { min-width: 80px; flex: 1; }
    .helper-text { font-size: var(--hi-font-size-helper); color: var(--hi-text-secondary); margin-top: 4px; }
    .helper-text.error { color: var(--hi-border-error); }
    .helper-text.success { color: var(--hi-border-success); }
    .loading-spinner { display: flex; align-items: center; justify-content: center; width: 32px; height: 100%; flex-shrink: 0; }
    .spinner { width: 18px; height: 18px; border: 2px solid var(--hi-border); border-top-color: var(--hi-border-focus); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .validation-icon { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; }
    .validation-icon.valid { color: var(--hi-border-success); }
    .validation-icon.invalid { color: var(--hi-border-error); }
    .validation-icon svg { width: 100%; height: 100%; }
    .char-counter { font-size: 11px; color: var(--hi-text-secondary); flex-shrink: 0; padding-right: 8px; }
    .char-counter.warning { color: #f59e0b; }
    .char-counter.error { color: var(--hi-border-error); }
    .chips-inline { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
    .chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--hi-bg-selected); border-radius: 4px; font-size: 12px; max-width: 120px; animation: chipIn 0.15s ease; }
    @keyframes chipIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .chip-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chip-remove { display: flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: none; background: transparent; cursor: pointer; color: var(--hi-text-secondary); padding: 0; border-radius: 50%; flex-shrink: 0; transition: all 0.15s ease; }
    .chip-remove:hover { background: var(--hi-bg-hover); color: var(--hi-text); }
    .chip-remove svg { width: 10px; height: 10px; }
    .input[type="password"] { letter-spacing: 2px; }
    .prefix-text, .suffix-text { color: var(--hi-text-secondary); font-size: inherit; flex-shrink: 0; user-select: none; }
    @media (prefers-color-scheme: dark) { :host(:not([light-mode])) { --hi-bg: #1f2937; --hi-bg-hover: #374151; --hi-bg-selected: #4b5563; --hi-bg-disabled: #374151; --hi-text: #f9fafb; --hi-text-secondary: #9ca3af; --hi-text-placeholder: #6b7280; --hi-text-disabled: #6b7280; --hi-border: #4b5563; --hi-border-hover: #6b7280; } }
    :host([dark-mode]) { --hi-bg: #1f2937; --hi-bg-hover: #374151; --hi-bg-selected: #4b5563; --hi-bg-disabled: #374151; --hi-text: #f9fafb; --hi-text-secondary: #9ca3af; --hi-text-placeholder: #6b7280; --hi-text-disabled: #6b7280; --hi-border: #4b5563; --hi-border-hover: #6b7280; }
    :host([light-mode]) { --hi-bg: #ffffff; --hi-bg-hover: #f8f9fa; --hi-bg-selected: #e9ecef; --hi-bg-disabled: #f1f3f4; --hi-text: #1a1a1a; --hi-text-secondary: #6c757d; --hi-text-placeholder: #9ca3af; --hi-text-disabled: #9ca3af; --hi-border: #d1d5db; --hi-border-hover: #9ca3af; }
  `;

  class HybridInput extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
      return [
        'name', 'label', 'placeholder', 'disabled', 'readonly', 'required',
        'error', 'helper', 'size', 'value', 'sync-group', 'data-url',
        'dark-mode', 'light-mode', 'padding-x', 'padding-y',
        'type', 'multiple', 'separator', 'max-length', 'min-length',
        'pattern', 'prefix', 'suffix', 'show-counter', 'allow-create',
        'validate-on-blur', 'validate-on-input', 'input-mode', 'autocomplete'
      ];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._value = '';
      this._originalValue = '';
      this._isFocused = false;
      this._isLoading = false;
      this._validationState = null;
      this._validationMessage = '';
      this._abortController = null;
      this._values = [];
      this._originalValues = [];
      if ('ElementInternals' in window) { try { this._internals = this.attachInternals(); } catch (e) {} }
      this._handleDocumentClick = this._handleDocumentClick.bind(this);
      this._debouncedEndpoint = debounce(this._callEndpoint.bind(this), DEBOUNCE_MS);
      this._debouncedValidate = debounce(this._validateInput.bind(this), 300);
    }

    connectedCallback() {
      document.addEventListener('click', this._handleDocumentClick);
      this._setupEventListeners();
      const paddingX = this.getAttribute('padding-x');
      if (paddingX) this.style.setProperty('--hi-padding-x', paddingX);
      const paddingY = this.getAttribute('padding-y');
      if (paddingY) this.style.setProperty('--hi-padding-y', paddingY);
      const syncGroup = this.getAttribute('sync-group');
      if (syncGroup) SyncRegistry.register(this, syncGroup);
      this._render();
      this._updateFormValue();
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._handleDocumentClick);
      if (this._abortController) this._abortController.abort();
      const syncGroup = this.getAttribute('sync-group');
      if (syncGroup) SyncRegistry.unregister(this, syncGroup);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === 'value') {
            this._syncValue(newValue);
        } else {
            if (name === 'sync-group') SyncRegistry.migrate(this, oldValue, newValue);
            if (name === 'padding-x') { if (newValue && newValue.trim() !== '') { this.style.setProperty('--hi-padding-x', newValue); } else { this.style.removeProperty('--hi-padding-x'); } }
            if (name === 'padding-y') { if (newValue && newValue.trim() !== '') { this.style.setProperty('--hi-padding-y', newValue); } else { this.style.removeProperty('--hi-padding-y'); } }
            this._render();
        }
    }

    _syncValue(val) {
        const newValue = val || '';
        if (this.multiple) {
            this._values = newValue ? newValue.split(this.separator).map(v => v.trim()).filter(v => v) : [];
            this._value = '';
        } else {
            if (this._value === newValue) return;
            this._value = newValue;
        }

        const input = this.shadowRoot.querySelector('.input');
        if (input) {
            input.value = this._value;
        }
        this._updateFormValue();
    }

    get value() {
      if (this.multiple) return this._values.join(this.separator);
      return this._value;
    }

    set value(val) {
      this._syncValue(val);
    }

    // ... (rest of getters/setters are fine)
    get values() { return [...this._values]; }
    get disabled() { return this.hasAttribute('disabled'); }
    set disabled(val) { if (val) { this.setAttribute('disabled', ''); } else { this.removeAttribute('disabled'); } }
    get required() { return this.hasAttribute('required'); }
    set required(val) { if (val) { this.setAttribute('required', ''); } else { this.removeAttribute('required'); } }
    get readonly() { return this.hasAttribute('readonly'); }
    set readonly(val) { if (val) { this.setAttribute('readonly', ''); } else { this.removeAttribute('readonly'); } }
    get multiple() { return this.hasAttribute('multiple'); }
    set multiple(val) { if (val) { this.setAttribute('multiple', ''); } else { this.removeAttribute('multiple'); } }
    get type() { return this.getAttribute('type') || 'text'; }
    get separator() { return this.getAttribute('separator') || ','; }
    get maxLength() { const val = this.getAttribute('max-length'); return val ? parseInt(val, 10) : null; }
    get minLength() { const val = this.getAttribute('min-length'); return val ? parseInt(val, 10) : null; }
    get pattern() { return this.getAttribute('pattern'); }
    get name() { return this.getAttribute('name'); }
    get loading() { return this._isLoading; }
    get syncGroup() { return this.getAttribute('sync-group'); }
    set syncGroup(value) { if (value) { this.setAttribute('sync-group', value); } else { this.removeAttribute('sync-group'); } }

    // Public methods
    focus() { const input = this.shadowRoot.querySelector('.input'); if (input) input.focus(); }
    blur() { const input = this.shadowRoot.querySelector('.input'); if (input) input.blur(); }
    reset() { this._value = this._originalValue; if (this.multiple) { this._values = [...this._originalValues]; } this._validationState = null; this._validationMessage = ''; this._render(); this._updateFormValue(); this._emitEvent('reset', { value: this.value, values: this._values }); }
    clear() { this._value = ''; this._values = []; this._validationState = null; this._validationMessage = ''; this._render(); this._updateFormValue(); this._emitEvent('change', { value: '', values: [], cleared: true }); }
    refresh() { const dataUrl = this.getAttribute('data-url'); if (dataUrl) { this._callEndpoint(this._value); } }
    setValidation(state, message = '') { this._validationState = state; this._validationMessage = message; this._render(); }
    addValue(val) { if (!this.multiple || !val) return; const trimmed = val.trim(); if (trimmed && !this._values.includes(trimmed)) { this._values.push(trimmed); this._value = ''; this._render(); this._updateFormValue(); this._emitEvent('add', { value: trimmed, values: this._values }); this._emitEvent('change', { value: this.value, values: this._values }); } }
    removeValue(val) { if (!this.multiple) return; const index = this._values.indexOf(val); if (index > -1) { this._values.splice(index, 1); this._render(); this._updateFormValue(); this._emitEvent('remove', { value: val, values: this._values }); this._emitEvent('change', { value: this.value, values: this._values }); } }

    _emitEvent(name, detail) { this.dispatchEvent(new CustomEvent(`hybrid-input:${name}`, { bubbles: true, composed: true, detail })); }
    _escapeHtml(text) { return escapeHtml(text); }
    _setupEventListeners() { this.addEventListener('keydown', this._handleKeyDown.bind(this), { capture: true }); }
    _handleDocumentClick(e) {}

    _handleKeyDown(e) {
      if (e.key === 'Escape') { e.preventDefault(); this.reset(); this._emitEvent('cancel', { originalValue: this._originalValue, originalValues: this._originalValues }); return; }
      if (this.multiple) {
        if (e.key === 'Enter') { e.preventDefault(); if (this._value.trim()) { this.addValue(this._value); } return; }
        if (e.key === 'Backspace' && !this._value && this._values.length > 0) { e.preventDefault(); this.removeValue(this._values[this._values.length - 1]); return; }
      }
    }

    _handleFocus() {
        this._isFocused = true;
        this._originalValue = this._value;
        if (this.multiple) {
            this._originalValues = [...this._values];
        }
        const control = this.shadowRoot.querySelector('.control');
        if (control) {
            control.classList.add('focused');
        }
        this._emitEvent('focus', { value: this.value });
    }

    _handleBlur() {
        if (this.multiple && this._value.trim()) {
            this.addValue(this._value);
        }
        if (this.hasAttribute('validate-on-blur')) {
            this._validateInput();
        }
        this._isFocused = false;
        const control = this.shadowRoot.querySelector('.control');
        if (control) {
            control.classList.remove('focused');
        }
        this._emitEvent('blur', { value: this.value, values: this._values });
    }

    _handleInput(e) {
      this._value = e.target.value;
      if (this.multiple && this._value.includes(this.separator)) {
        const parts = this._value.split(this.separator);
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].trim();
          if (part) this.addValue(part);
        }
        this._value = parts[parts.length - 1];
        this._render(); // Re-render only when chips are added
      }
      this._emitEvent('input', { value: this._value, values: this._values });
      if (this.hasAttribute('validate-on-input')) this._debouncedValidate();
      const dataUrl = this.getAttribute('data-url');
      if (dataUrl) this._debouncedEndpoint(this._value);
    }

    // ... (Endpoint, Validation, Form, CSS helpers, Sync methods are fine) ...
    async _callEndpoint(value) { const url = this.getAttribute('data-url'); if (!url) return; if (this._abortController) { this._abortController.abort(); } this._abortController = new AbortController(); this._isLoading = true; this._render(); try { const fetchUrl = new URL(url, window.location.origin); fetchUrl.searchParams.set('value', value); fetchUrl.searchParams.set('q', value); const response = await fetch(fetchUrl.toString(), { signal: this._abortController.signal }); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); this._handleEndpointResponse(data); this._emitEvent('load', { data }); } catch (err) { if (err.name !== 'AbortError') { this._emitEvent('error', { error: err.message }); } } finally { this._isLoading = false; this._render(); } }
    _handleEndpointResponse(data) { if (data.valid !== undefined) { this._validationState = data.valid ? 'valid' : 'invalid'; this._validationMessage = data.message || ''; } if (data.suggestions) { this._emitEvent('suggestions', { suggestions: data.suggestions }); } this._render(); }
    _validateInput() { let isValid = true; let message = ''; if (this.required) { if (this.multiple && this._values.length === 0) { isValid = false; message = 'At least one value is required'; } else if (!this.multiple && !this._value.trim()) { isValid = false; message = 'This field is required'; } } if (isValid && this.minLength !== null && !this.multiple) { if (this._value.length < this.minLength) { isValid = false; message = `Minimum ${this.minLength} characters required`; } } if (isValid && this.maxLength !== null && !this.multiple) { if (this._value.length > this.maxLength) { isValid = false; message = `Maximum ${this.maxLength} characters allowed`; } } if (isValid && this.pattern && !this.multiple) { const regex = new RegExp(this.pattern); if (!regex.test(this._value)) { isValid = false; message = this.getAttribute('pattern-message') || 'Invalid format'; } } if (isValid && !this.multiple) { const typeValidation = this._validateType(); if (!typeValidation.valid) { isValid = false; message = typeValidation.message; } } this._validationState = isValid ? 'valid' : 'invalid'; this._validationMessage = message; this._render(); this._emitEvent('validate', { valid: isValid, message, value: this.value, values: this._values }); return isValid; }
    _validateType() { const value = this._value; if (!value) return { valid: true }; switch (this.type) { case 'email': const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; if (!emailRegex.test(value)) { return { valid: false, message: 'Please enter a valid email address' }; } break; case 'tel': const telRegex = /^[\d\s\-+()]+$/; if (!telRegex.test(value)) { return { valid: false, message: 'Please enter a valid phone number' }; } break; case 'number': if (isNaN(parseFloat(value))) { return { valid: false, message: 'Please enter a valid number' }; } break; } return { valid: true }; }
    _updateFormValue() { if (this._internals) { const value = this.multiple ? this._values.join(this.separator) : this._value; this._internals.setFormValue(value || ''); } }
    _getControlClasses() { const classes = ['control']; if (this._isFocused) classes.push('focused'); if (this.disabled) classes.push('disabled'); if (this._validationState === 'invalid') classes.push('error'); if (this._validationState === 'valid') classes.push('success'); return classes.join(' '); }
    _getLabelClasses() { const classes = ['label']; if (this.required) classes.push('required'); return classes.join(' '); }
    _getHelperText() { if (this._validationMessage) return this._validationMessage; return this.getAttribute('helper') || this.getAttribute('error') || ''; }
    _getHelperClasses() { const classes = ['helper-text']; if (this._validationState === 'invalid') classes.push('error'); if (this._validationState === 'valid') classes.push('success'); return classes.join(' '); }
    _applySyncSnapshot(data) { if (Array.isArray(data)) { this._values = [...data]; } else if (typeof data === 'string') { this._value = data; } this._render(); this._updateFormValue(); }

    _render() {
      const label = this.getAttribute('label');
      const placeholder = this.getAttribute('placeholder') || '';
      const helper = this._getHelperText();
      const prefix = this.getAttribute('prefix');
      const suffix = this.getAttribute('suffix');
      const showCounter = this.hasAttribute('show-counter') && this.maxLength;

      let charCounterHtml = '';
      if (showCounter) {
        const remaining = this.maxLength - this._value.length;
        const counterClass = remaining < 10 ? (remaining < 0 ? 'error' : 'warning') : '';
        charCounterHtml = `<span class="char-counter ${counterClass}">${this._value.length}/${this.maxLength}</span>`;
      }

      let validationIconHtml = '';
      if (this._validationState === 'valid') {
        validationIconHtml = `<span class="validation-icon valid">${Icons.check}</span>`;
      } else if (this._validationState === 'invalid') {
        validationIconHtml = `<span class="validation-icon invalid">${Icons.alert}</span>`;
      }

      let loadingHtml = '';
      if (this._isLoading) {
        loadingHtml = `<div class="loading-spinner"><div class="spinner"></div></div>`;
      }

      let chipsHtml = '';
      if (this.multiple && this._values.length > 0) {
        chipsHtml = `
          <div class="chips-inline">
            ${this._values.map(v => `
              <span class="chip" data-value="${this._escapeHtml(v)}">
                <span class="chip-label">${this._escapeHtml(v)}</span>
                <button type="button" class="chip-remove" data-remove="${this._escapeHtml(v)}" aria-label="Remove ${this._escapeHtml(v)}">
                  ${Icons.x}
                </button>
              </span>
            `).join('')}
          </div>
        `;
      }

      const inputType = ['text', 'email', 'tel', 'password', 'number', 'url', 'search'].includes(this.type)
        ? this.type
        : 'text';

      this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="wrapper">
          ${label ? `<label class="${this._getLabelClasses()}">${this._escapeHtml(label)}</label>` : ''}
          <div class="${this._getControlClasses()}" data-testid="input-control">
            <div class="input-wrapper">
              ${prefix ? `<span class="prefix-text">${this._escapeHtml(prefix)}</span>` : ''}
              <div class="input-container">
                ${chipsHtml}
                <input
                  type="${inputType}"
                  class="input ${this.multiple && this._values.length > 0 ? 'has-chips' : ''}"
                  placeholder="${this._escapeHtml(placeholder)}"
                  value="${this._escapeHtml(this._value)}"
                  ${this.disabled ? 'disabled' : ''}
                  ${this.readonly ? 'readonly' : ''}
                  ${this.getAttribute('inputmode') ? `inputmode="${this.getAttribute('inputmode')}"` : ''}
                  ${this.getAttribute('autocomplete') ? `autocomplete="${this.getAttribute('autocomplete')}"` : ''}
                  data-testid="input-field"
                />
              </div>
              ${suffix ? `<span class="suffix-text">${this._escapeHtml(suffix)}</span>` : ''}
              ${charCounterHtml}
              ${validationIconHtml}
              ${loadingHtml}
            </div>
          </div>
          ${helper ? `<span class="${this._getHelperClasses()}">${this._escapeHtml(helper)}</span>` : ''}
        </div>
      `;

      this._attachInputListeners();
    }

    _attachInputListeners() {
      const input = this.shadowRoot.querySelector('.input');
      if (input) {
        input.addEventListener('focus', () => this._handleFocus());
        input.addEventListener('blur', () => this._handleBlur());
        input.addEventListener('input', (e) => this._handleInput(e));
      }

      const removeButtons = this.shadowRoot.querySelectorAll('.chip-remove');
      removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const value = btn.getAttribute('data-remove');
          this.removeValue(value);
        });
      });

      const control = this.shadowRoot.querySelector('.control');
      if (control) {
        control.addEventListener('click', () => {
          if (!this.disabled && !this.readonly) {
            this.focus();
          }
        });
      }
    }
  }

  if (!customElements.get(COMPONENT_NAME)) {
    customElements.define(COMPONENT_NAME, HybridInput);
  }

  global.HybridInput = HybridInput;

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
