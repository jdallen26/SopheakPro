/**
 * HybridCore - Shared utilities and base class for Hybrid Controls
 *
 * @version 1.0.0
 * @license MIT
 */

(function(global) {
  'use strict';

  const DEBOUNCE_MS = 300;

  // Utility: Generate unique ID
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  // Utility: Debounce function
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Utility: Escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // SyncRegistry: Global registry for sync-group management
  const SyncRegistry = {
    _groups: new Map(),
    _snapshots: new Map(),
    _broadcasting: new Set(),

    register(element, groupName) {
      if (!groupName) return;
      if (!this._groups.has(groupName)) {
        this._groups.set(groupName, new Set());
      }
      this._groups.get(groupName).add(element);

      const snapshot = this._snapshots.get(groupName);
      if (snapshot && snapshot.options && snapshot.options.length > 0) {
        if (typeof element._applySyncSnapshot === 'function') {
          element._applySyncSnapshot(snapshot.options);
        }
      }
    },

    unregister(element, groupName) {
      if (!groupName) return;
      const group = this._groups.get(groupName);
      if (group) {
        group.delete(element);
        if (group.size === 0) {
          this._groups.delete(groupName);
        }
      }
    },

    migrate(element, oldGroup, newGroup) {
      this.unregister(element, oldGroup);
      this.register(element, newGroup);
    },

    publish(groupName, data, sourceElement) {
      if (!groupName || this._broadcasting.has(groupName)) return;

      this._broadcasting.add(groupName);

      const currentVersion = (this._snapshots.get(groupName)?.version || 0) + 1;
      this._snapshots.set(groupName, {
        version: currentVersion,
        options: Array.isArray(data) ? [...data] : data
      });

      const group = this._groups.get(groupName);
      if (group) {
        group.forEach(element => {
          if (element !== sourceElement && typeof element._applySyncSnapshot === 'function') {
            element._applySyncSnapshot(data);
          }
        });
      }

      this._broadcasting.delete(groupName);
    },

    refresh(groupName, payload = null) {
      const group = this._groups.get(groupName);
      if (!group) return;

      group.forEach(element => {
        if (payload) {
          if (typeof element._applySyncSnapshot === 'function') {
            element._applySyncSnapshot(payload);
          }
        } else if (element.getAttribute('data-url')) {
          if (typeof element._fetchRemoteData === 'function') {
            element._fetchRemoteData('');
          }
        } else {
          const snapshot = this._snapshots.get(groupName);
          if (snapshot && typeof element._applySyncSnapshot === 'function') {
            element._applySyncSnapshot(snapshot.options);
          }
        }
      });
    },

    getGroups() {
      return Array.from(this._groups.keys());
    },

    getGroupMembers(groupName) {
      return this._groups.get(groupName) || new Set();
    }
  };

  // Base styles shared across all hybrid controls - uses --hs-* prefix for consistency with HybridSelect
  const baseStyles = `
    :host {
      --hs-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --hs-font-size: 16px;
      --hs-font-size-label: 14px;
      --hs-font-size-helper: 12px;

      --hs-bg: #ffffff;
      --hs-bg-hover: #f8f9fa;
      --hs-bg-selected: #e9ecef;
      --hs-bg-disabled: #f1f3f4;

      --hs-text: #1a1a1a;
      --hs-text-secondary: #6c757d;
      --hs-text-placeholder: #9ca3af;
      --hs-text-disabled: #9ca3af;

      --hs-border: #d1d5db;
      --hs-border-hover: #9ca3af;
      --hs-border-focus: #3b82f6;
      --hs-border-error: #ef4444;
      --hs-border-success: #22c55e;

      --hs-ring: rgba(59, 130, 246, 0.15);
      --hs-ring-error: rgba(239, 68, 68, 0.15);
      --hs-ring-success: rgba(34, 197, 94, 0.15);

      --hs-radius: 8px;
      --hs-height: 48px;
      --hs-height-sm: 40px;
      --hs-height-lg: 56px;

      --hs-padding-x: 16px;
      --hs-padding-y: 12px;
      --hs-gap: 8px;

      --hs-transition: 0.2s ease;
      --hs-icon-size: 18px;

      display: block;
      font-family: var(--hs-font-family);
      font-size: var(--hs-font-size);
      position: relative;
      width: 100%;
    }

    :host([hidden]) {
      display: none;
    }

    :host([size="small"]), :host([size="sm"]) {
      --hs-height: var(--hs-height-sm);
      --hs-font-size: 14px;
      --hs-padding-x: 12px;
      --hs-padding-y: 8px;
      --hs-icon-size: 16px;
    }

    :host([size="large"]), :host([size="lg"]) {
      --hs-height: var(--hs-height-lg);
      --hs-font-size: 18px;
      --hs-padding-x: 20px;
      --hs-padding-y: 14px;
      --hs-icon-size: 20px;
    }

    * {
      box-sizing: border-box;
    }

    .wrapper {
      display: flex;
      flex-direction: column;
      gap: var(--hs-gap);
      width: 100%;
    }

    .label {
      font-size: var(--hs-font-size-label);
      font-weight: 500;
      color: var(--hs-text);
      user-select: none;
    }

    .label.required::after {
      content: ' *';
      color: var(--hs-border-error);
    }

    .control {
      position: relative;
      display: flex;
      align-items: center;
      min-height: var(--hs-height);
      background: var(--hs-bg);
      border: 1px solid var(--hs-border);
      border-radius: var(--hs-radius);
      cursor: text;
      transition: border-color var(--hs-transition), box-shadow var(--hs-transition), background-color var(--hs-transition);
    }

    .control:hover:not(.disabled) {
      border-color: var(--hs-border-hover);
      background: var(--hs-bg-hover);
    }

    .control.focused:not(.disabled) {
      border-color: var(--hs-border-focus);
      border-width: 2px;
      box-shadow: 0 0 0 3px var(--hs-ring);
    }

    .control.error {
      border-color: var(--hs-border-error);
    }

    .control.error.focused {
      box-shadow: 0 0 0 3px var(--hs-ring-error);
    }

    .control.success {
      border-color: var(--hs-border-success);
    }

    .control.success.focused {
      box-shadow: 0 0 0 3px var(--hs-ring-success);
    }

    .control.disabled {
      background: var(--hs-bg-disabled);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 var(--hs-padding-x);
      min-width: 0;
      height: 100%;
      gap: 10px;
    }

    .input {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: inherit;
      color: var(--hs-text);
      outline: none;
      padding: var(--hs-padding-y) 0;
      margin: 0;
      width: 100%;
      line-height: 1.4;
      height: auto;
    }

    .input::placeholder {
      color: var(--hs-text-placeholder);
    }

    .input:disabled {
      cursor: not-allowed;
      color: var(--hs-text-disabled);
    }

    .helper-text {
      font-size: var(--hs-font-size-helper);
      color: var(--hs-text-secondary);
      margin-top: 4px;
    }

    .helper-text.error {
      color: var(--hs-border-error);
    }

    .helper-text.success {
      color: var(--hs-border-success);
    }

    /* Icon containers */
    .prefix-icon, .suffix-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--hs-icon-size);
      height: var(--hs-icon-size);
      color: var(--hs-text-secondary);
      flex-shrink: 0;
    }

    .prefix-icon svg, .suffix-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Action buttons */
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 50%;
      cursor: pointer;
      color: var(--hs-text-secondary);
      transition: background-color var(--hs-transition), color var(--hs-transition);
      flex-shrink: 0;
      margin-right: 4px;
    }

    .action-btn:hover {
      background: var(--hs-bg-selected);
      color: var(--hs-text);
    }

    .action-btn:focus {
      outline: 2px solid var(--hs-border-focus);
      outline-offset: 2px;
    }

    .action-btn svg {
      width: 18px;
      height: 18px;
    }

    /* Loading spinner */
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 100%;
      flex-shrink: 0;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid var(--hs-border);
      border-top-color: var(--hs-border-focus);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Chips/Tags for multi-value */
    .chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 6px 0;
      flex: 1;
      min-width: 0;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--hs-bg-selected);
      border-radius: 4px;
      font-size: 13px;
      max-width: 150px;
    }

    .chip-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: var(--hs-text-secondary);
      padding: 0;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .chip-remove:hover {
      background: var(--hs-bg-hover);
      color: var(--hs-text);
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :host(:not([light-mode])) {
        --hs-bg: #1f2937;
        --hs-bg-hover: #374151;
        --hs-bg-selected: #4b5563;
        --hs-bg-disabled: #374151;

        --hs-text: #f9fafb;
        --hs-text-secondary: #9ca3af;
        --hs-text-placeholder: #6b7280;
        --hs-text-disabled: #6b7280;

        --hs-border: #4b5563;
        --hs-border-hover: #6b7280;
      }
    }

    :host([dark-mode]) {
      --hs-bg: #1f2937;
      --hs-bg-hover: #374151;
      --hs-bg-selected: #4b5563;
      --hs-bg-disabled: #374151;

      --hs-text: #f9fafb;
      --hs-text-secondary: #9ca3af;
      --hs-text-placeholder: #6b7280;
      --hs-text-disabled: #6b7280;

      --hs-border: #4b5563;
      --hs-border-hover: #6b7280;
    }
  `;

  // Common SVG Icons
  const Icons = {
    x: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    spinner: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    externalLink: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    mapPin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    checkSquare: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
    circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`,
    circleDot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3" fill="currentColor"></circle></svg>`
  };

  // HybridBase - Base class for all hybrid controls
  class HybridBase extends HTMLElement {
    static formAssociated = true;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // Internal state
      this._value = '';
      this._originalValue = ''; // For ESC to reset
      this._isFocused = false;
      this._isLoading = false;
      this._validationState = null; // null | 'valid' | 'invalid'
      this._validationMessage = '';
      this._abortController = null;

      // Form association
      if ('ElementInternals' in window) {
        try {
          this._internals = this.attachInternals();
        } catch (e) {
          // Form association not supported
        }
      }

      // Bound methods
      this._handleDocumentClick = this._handleDocumentClick.bind(this);
      this._debouncedEndpoint = debounce(this._callEndpoint.bind(this), DEBOUNCE_MS);
    }

    // Common observed attributes
    static get observedAttributes() {
      return [
        'name', 'label', 'placeholder', 'disabled', 'readonly', 'required',
        'error', 'helper', 'size', 'value', 'sync-group', 'data-url',
        'dark-mode', 'light-mode', 'padding-x', 'padding-y'
      ];
    }

    // Lifecycle
    connectedCallback() {
      document.addEventListener('click', this._handleDocumentClick);
      this._setupEventListeners();

      // Apply padding if specified
      const paddingX = this.getAttribute('padding-x');
      if (paddingX) {
        this.style.setProperty('--hs-padding-x', paddingX);
      }
      const paddingY = this.getAttribute('padding-y');
      if (paddingY) {
        this.style.setProperty('--hs-padding-y', paddingY);
      }

      const syncGroup = this.getAttribute('sync-group');
      if (syncGroup) {
        SyncRegistry.register(this, syncGroup);
      }

      this._render();
      this._updateFormValue();
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._handleDocumentClick);
      if (this._abortController) {
        this._abortController.abort();
      }

      const syncGroup = this.getAttribute('sync-group');
      if (syncGroup) {
        SyncRegistry.unregister(this, syncGroup);
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        if (name === 'sync-group') {
          SyncRegistry.migrate(this, oldValue, newValue);
        }
        if (name === 'value') {
          this._value = newValue || '';
        }
        if (name === 'padding-x') {
          if (newValue && newValue.trim() !== '') {
            this.style.setProperty('--hs-padding-x', newValue);
          } else {
            this.style.removeProperty('--hs-padding-x');
          }
        }
        if (name === 'padding-y') {
          if (newValue && newValue.trim() !== '') {
            this.style.setProperty('--hs-padding-y', newValue);
          } else {
            this.style.removeProperty('--hs-padding-y');
          }
        }
        this._render();
      }
    }

    // Common getters/setters
    get value() {
      return this._value;
    }

    set value(val) {
      this._value = val || '';
      this._render();
      this._updateFormValue();
    }

    get disabled() {
      return this.hasAttribute('disabled');
    }

    set disabled(val) {
      if (val) {
        this.setAttribute('disabled', '');
      } else {
        this.removeAttribute('disabled');
      }
    }

    get required() {
      return this.hasAttribute('required');
    }

    set required(val) {
      if (val) {
        this.setAttribute('required', '');
      } else {
        this.removeAttribute('required');
      }
    }

    get readonly() {
      return this.hasAttribute('readonly');
    }

    set readonly(val) {
      if (val) {
        this.setAttribute('readonly', '');
      } else {
        this.removeAttribute('readonly');
      }
    }

    get name() {
      return this.getAttribute('name');
    }

    get loading() {
      return this._isLoading;
    }

    get syncGroup() {
      return this.getAttribute('sync-group');
    }

    set syncGroup(value) {
      if (value) {
        this.setAttribute('sync-group', value);
      } else {
        this.removeAttribute('sync-group');
      }
    }

    // Public methods
    focus() {
      const input = this.shadowRoot.querySelector('.input');
      if (input) input.focus();
    }

    blur() {
      const input = this.shadowRoot.querySelector('.input');
      if (input) input.blur();
    }

    reset() {
      this._value = this._originalValue;
      this._validationState = null;
      this._validationMessage = '';
      this._render();
      this._updateFormValue();
      this._emitEvent('reset', { value: this._value });
    }

    clear() {
      this._value = '';
      this._validationState = null;
      this._validationMessage = '';
      this._render();
      this._updateFormValue();
      this._emitEvent('change', { value: '', cleared: true });
    }

    refresh() {
      const dataUrl = this.getAttribute('data-url');
      if (dataUrl) {
        this._callEndpoint(this._value);
      }
    }

    setValidation(state, message = '') {
      this._validationState = state;
      this._validationMessage = message;
      this._render();
    }

    // Protected methods (to be overridden)
    _render() {
      // To be implemented by subclasses
    }

    _setupEventListeners() {
      this.addEventListener('keydown', this._handleKeyDown.bind(this), { capture: true });
    }

    _handleDocumentClick(e) {
      // Default implementation - can be overridden
    }

    _handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.reset();
        this._emitEvent('cancel', { originalValue: this._originalValue });
      }
    }

    _handleFocus() {
      this._isFocused = true;
      this._originalValue = this._value; // Store for ESC reset
      this._render();
      this._emitEvent('focus', { value: this._value });
    }

    _handleBlur() {
      this._isFocused = false;
      this._render();
      this._emitEvent('blur', { value: this._value });
    }

    _handleInput(e) {
      this._value = e.target.value;
      this._emitEvent('input', { value: this._value });

      const dataUrl = this.getAttribute('data-url');
      if (dataUrl) {
        this._debouncedEndpoint(this._value);
      }
    }

    async _callEndpoint(value) {
      const url = this.getAttribute('data-url');
      if (!url) return;

      if (this._abortController) {
        this._abortController.abort();
      }
      this._abortController = new AbortController();

      this._isLoading = true;
      this._render();

      try {
        const fetchUrl = new URL(url, window.location.origin);
        fetchUrl.searchParams.set('value', value);
        fetchUrl.searchParams.set('q', value);

        const response = await fetch(fetchUrl.toString(), {
          signal: this._abortController.signal
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        this._handleEndpointResponse(data);
        this._emitEvent('endpoint-success', { data, value });
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.error('HybridControl: Endpoint call failed', e);
          this._emitEvent('endpoint-error', { error: e, value });
        }
      } finally {
        this._isLoading = false;
        this._render();
      }
    }

    _handleEndpointResponse(data) {
      // To be implemented by subclasses
      // Could set validation state, update suggestions, etc.
    }

    _updateFormValue() {
      if (this._internals) {
        this._internals.setFormValue(this._value || '');
      }
    }

    _emitEvent(name, detail = {}) {
      const componentName = this.tagName.toLowerCase();
      this.dispatchEvent(new CustomEvent(`${componentName}:${name}`, {
        bubbles: true,
        composed: true,
        detail: {
          ...detail,
          target: this,
          name: this.name
        }
      }));
    }

    _escapeHtml(text) {
      return escapeHtml(text);
    }

    _getControlClasses() {
      const classes = ['control'];
      if (this._isFocused) classes.push('focused');
      if (this.disabled) classes.push('disabled');
      if (this._validationState === 'invalid' || this.hasAttribute('error')) classes.push('error');
      if (this._validationState === 'valid') classes.push('success');
      return classes.join(' ');
    }

    _getLabelClasses() {
      const classes = ['label'];
      if (this.required) classes.push('required');
      return classes.join(' ');
    }

    _getHelperText() {
      if (this._validationMessage) return this._validationMessage;
      return this.getAttribute('error') || this.getAttribute('helper') || '';
    }

    _getHelperClasses() {
      const classes = ['helper-text'];
      if (this._validationState === 'invalid' || this.hasAttribute('error')) classes.push('error');
      if (this._validationState === 'valid') classes.push('success');
      return classes.join(' ');
    }

    // Sync group support
    _publishToSyncGroup(data) {
      const syncGroup = this.getAttribute('sync-group');
      if (syncGroup) {
        SyncRegistry.publish(syncGroup, data, this);
      }
    }

    _applySyncSnapshot(data) {
      // To be implemented by subclasses
    }

    // Static sync API
    static syncAll(groupName, payload = null) {
      SyncRegistry.refresh(groupName, payload);
    }

    static getSyncGroups() {
      return SyncRegistry.getGroups();
    }
  }

  // Export to global
  global.HybridCore = {
    generateId,
    debounce,
    escapeHtml,
    SyncRegistry,
    baseStyles,
    Icons,
    HybridBase,
    DEBOUNCE_MS
  };

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
