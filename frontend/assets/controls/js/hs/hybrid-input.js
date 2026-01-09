/**
 * HybridInput - Enhanced text input with endpoint validation and multi-value support
 *
 * @version 1.0.0
 * @license MIT
 *
 * Features:
 * - Async endpoint validation with debounce
 * - Multi-value chips/tags
 * - ESC to cancel and reset
 * - Validation states (valid/invalid/pending)
 * - Full keyboard navigation
 * - Dark mode support
 * - Form integration
 * - Sync-group for shared state
 */

(function(global) {
  'use strict';

  // Wait for HybridCore to be available
  const initComponent = () => {
    const { baseStyles, Icons, HybridBase, generateId, debounce, escapeHtml } = global.HybridCore;

    const COMPONENT_NAME = 'hybrid-input';

    // Component-specific styles
    const styles = `
      ${baseStyles}

      .input-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;
      }

      .input.has-chips {
        min-width: 80px;
        flex: 1;
      }

      /* Validation icons */
      .validation-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .validation-icon.valid {
        color: var(--hs-border-success);
      }

      .validation-icon.invalid {
        color: var(--hs-border-error);
      }

      /* Character counter */
      .char-counter {
        font-size: 11px;
        color: var(--hs-text-secondary);
        flex-shrink: 0;
        padding-right: 8px;
      }

      .char-counter.warning {
        color: #f59e0b;
      }

      .char-counter.error {
        color: var(--hs-border-error);
      }

      /* Multi-value chips inline */
      .chips-inline {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 4px 0;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        background: var(--hs-bg-selected);
        border-radius: 4px;
        font-size: 12px;
        max-width: 120px;
        animation: chipIn 0.15s ease;
      }

      @keyframes chipIn {
        from {
          opacity: 0;
          transform: scale(0.9);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
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
        width: 14px;
        height: 14px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--hs-text-secondary);
        padding: 0;
        border-radius: 50%;
        flex-shrink: 0;
        transition: all 0.15s ease;
      }

      .chip-remove:hover {
        background: var(--hs-bg-hover);
        color: var(--hs-text);
      }

      .chip-remove svg {
        width: 10px;
        height: 10px;
      }

      /* Input types */
      .input[type="password"] {
        letter-spacing: 2px;
      }

      /* Prefix/Suffix text */
      .prefix-text, .suffix-text {
        color: var(--hs-text-secondary);
        font-size: inherit;
        flex-shrink: 0;
        user-select: none;
      }
    `;

    class HybridInput extends HybridBase {
      static get observedAttributes() {
        return [
          ...HybridBase.observedAttributes,
          'type', 'multiple', 'separator', 'max-length', 'min-length',
          'pattern', 'prefix', 'suffix', 'show-counter', 'allow-create',
          'validate-on-blur', 'validate-on-input', 'input-mode', 'autocomplete'
        ];
      }

      constructor() {
        super();

        // Multi-value state
        this._values = [];
        this._originalValues = [];

        this._debouncedValidate = debounce(this._validateInput.bind(this), 300);
      }

      // Additional getters
      get multiple() {
        return this.hasAttribute('multiple');
      }

      set multiple(val) {
        if (val) {
          this.setAttribute('multiple', '');
        } else {
          this.removeAttribute('multiple');
        }
      }

      get type() {
        return this.getAttribute('type') || 'text';
      }

      get separator() {
        return this.getAttribute('separator') || ',';
      }

      get maxLength() {
        const val = this.getAttribute('max-length');
        return val ? parseInt(val, 10) : null;
      }

      get minLength() {
        const val = this.getAttribute('min-length');
        return val ? parseInt(val, 10) : null;
      }

      get pattern() {
        return this.getAttribute('pattern');
      }

      get value() {
        if (this.multiple) {
          return this._values.join(this.separator);
        }
        return this._value;
      }

      set value(val) {
        if (this.multiple) {
          if (Array.isArray(val)) {
            this._values = [...val];
          } else if (typeof val === 'string') {
            this._values = val ? val.split(this.separator).map(v => v.trim()).filter(v => v) : [];
          } else {
            this._values = [];
          }
          this._value = '';
        } else {
          this._value = val || '';
        }
        this._render();
        this._updateFormValue();
      }

      get values() {
        return [...this._values];
      }

      // Override reset to handle multi-value
      reset() {
        if (this.multiple) {
          this._values = [...this._originalValues];
        }
        super.reset();
      }

      // Override clear
      clear() {
        this._values = [];
        super.clear();
      }

      // Add a value (for multi-value mode)
      addValue(val) {
        if (!this.multiple || !val) return;

        const trimmed = val.trim();
        if (trimmed && !this._values.includes(trimmed)) {
          this._values.push(trimmed);
          this._value = '';
          this._render();
          this._updateFormValue();
          this._emitEvent('add', { value: trimmed, values: this._values });
          this._emitEvent('change', { value: this.value, values: this._values });
        }
      }

      // Remove a value (for multi-value mode)
      removeValue(val) {
        if (!this.multiple) return;

        const index = this._values.indexOf(val);
        if (index > -1) {
          this._values.splice(index, 1);
          this._render();
          this._updateFormValue();
          this._emitEvent('remove', { value: val, values: this._values });
          this._emitEvent('change', { value: this.value, values: this._values });
        }
      }

      // Override focus handler
      _handleFocus() {
        this._isFocused = true;
        this._originalValue = this._value;
        if (this.multiple) {
          this._originalValues = [...this._values];
        }
        this._render();
        this._emitEvent('focus', { value: this.value });
      }

      // Override input handler
      _handleInput(e) {
        this._value = e.target.value;

        // Check for separator in multi-value mode
        if (this.multiple && this._value.includes(this.separator)) {
          const parts = this._value.split(this.separator);
          // Add all complete parts except the last one
          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i].trim();
            if (part) {
              this.addValue(part);
            }
          }
          // Keep the last part in the input
          this._value = parts[parts.length - 1];
          this._render();
        }

        this._emitEvent('input', { value: this._value, values: this._values });

        // Validate on input if enabled
        if (this.hasAttribute('validate-on-input')) {
          this._debouncedValidate();
        }

        // Call endpoint if configured
        const dataUrl = this.getAttribute('data-url');
        if (dataUrl) {
          this._debouncedEndpoint(this._value);
        }

        this._render();
      }

      // Override blur handler
      _handleBlur() {
        // Auto-add value on blur in multi-value mode
        if (this.multiple && this._value.trim()) {
          this.addValue(this._value);
        }

        // Validate on blur if enabled
        if (this.hasAttribute('validate-on-blur')) {
          this._validateInput();
        }

        super._handleBlur();
      }

      // Override keydown handler
      _handleKeyDown(e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.reset();
          this._emitEvent('cancel', { originalValue: this._originalValue, originalValues: this._originalValues });
          return;
        }

        if (this.multiple) {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (this._value.trim()) {
              this.addValue(this._value);
            }
            return;
          }

          if (e.key === 'Backspace' && !this._value && this._values.length > 0) {
            e.preventDefault();
            this.removeValue(this._values[this._values.length - 1]);
            return;
          }
        }
      }

      // Validation
      _validateInput() {
        const value = this.multiple ? this._values : this._value;
        let isValid = true;
        let message = '';

        // Required check
        if (this.required) {
          if (this.multiple && this._values.length === 0) {
            isValid = false;
            message = 'At least one value is required';
          } else if (!this.multiple && !this._value.trim()) {
            isValid = false;
            message = 'This field is required';
          }
        }

        // Min length check
        if (isValid && this.minLength !== null && !this.multiple) {
          if (this._value.length < this.minLength) {
            isValid = false;
            message = `Minimum ${this.minLength} characters required`;
          }
        }

        // Max length check
        if (isValid && this.maxLength !== null && !this.multiple) {
          if (this._value.length > this.maxLength) {
            isValid = false;
            message = `Maximum ${this.maxLength} characters allowed`;
          }
        }

        // Pattern check
        if (isValid && this.pattern && !this.multiple) {
          const regex = new RegExp(this.pattern);
          if (!regex.test(this._value)) {
            isValid = false;
            message = this.getAttribute('pattern-message') || 'Invalid format';
          }
        }

        // Type-specific validation
        if (isValid && !this.multiple) {
          const typeValidation = this._validateType();
          if (!typeValidation.valid) {
            isValid = false;
            message = typeValidation.message;
          }
        }

        this._validationState = isValid ? 'valid' : 'invalid';
        this._validationMessage = message;
        this._render();

        this._emitEvent('validate', {
          valid: isValid,
          message,
          value: this.value,
          values: this._values
        });

        return isValid;
      }

      _validateType() {
        const value = this._value;
        if (!value) return { valid: true };

        switch (this.type) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              return { valid: false, message: 'Please enter a valid email address' };
            }
            break;
          case 'tel':
            const telRegex = /^[\d\s\-+()]+$/;
            if (!telRegex.test(value)) {
              return { valid: false, message: 'Please enter a valid phone number' };
            }
            break;
          case 'number':
            if (isNaN(parseFloat(value))) {
              return { valid: false, message: 'Please enter a valid number' };
            }
            break;
        }

        return { valid: true };
      }

      // Handle endpoint response for validation
      _handleEndpointResponse(data) {
        if (data.valid !== undefined) {
          this._validationState = data.valid ? 'valid' : 'invalid';
          this._validationMessage = data.message || '';
        }
        if (data.suggestions) {
          // Could emit event with suggestions
          this._emitEvent('suggestions', { suggestions: data.suggestions });
        }
        this._render();
      }

      // Update form value
      _updateFormValue() {
        if (this._internals) {
          const value = this.multiple ? this._values.join(this.separator) : this._value;
          this._internals.setFormValue(value || '');
        }
      }

      // Render
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

        // Chip remove buttons
        const removeButtons = this.shadowRoot.querySelectorAll('.chip-remove');
        removeButtons.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = btn.getAttribute('data-remove');
            this.removeValue(value);
          });
        });

        // Click on control focuses input
        const control = this.shadowRoot.querySelector('.control');
        if (control) {
          control.addEventListener('click', () => {
            if (!this.disabled && !this.readonly) {
              this.focus();
            }
          });
        }
      }

      // Sync support
      _applySyncSnapshot(data) {
        if (Array.isArray(data)) {
          this._values = [...data];
        } else if (typeof data === 'string') {
          this._value = data;
        }
        this._render();
        this._updateFormValue();
      }
    }

    // Register the component
    if (!customElements.get(COMPONENT_NAME)) {
      customElements.define(COMPONENT_NAME, HybridInput);
    }

    // Export
    global.HybridInput = HybridInput;
  };

  // Initialize when HybridCore is available
  if (global.HybridCore) {
    initComponent();
  } else {
    // Wait for HybridCore
    const checkCore = setInterval(() => {
      if (global.HybridCore) {
        clearInterval(checkCore);
        initComponent();
      }
    }, 10);

    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkCore), 5000);
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
