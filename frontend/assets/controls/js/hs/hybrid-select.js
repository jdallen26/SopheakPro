/**
 * HybridSelect - A robust, framework-agnostic input+select Web Component
 *
 * @version 2.0.0
 * @license MIT
 *
 * Features:
 * - Async/Remote data loading with debounced search
 * - Create new option capability
 * - Recently selected tracking
 * - Option groups with headers
 * - Font Awesome icon support
 * - Custom option templates (images, descriptions)
 * - Search text highlighting
 * - Bootstrap form control sizing
 * - Full keyboard navigation
 * - Multi-select with chips
 * - Dark mode support
 *
 * Usage:
 *   <hybrid-select
 *     name="myField"
 *     label="Select an option"
 *     placeholder="Type to search..."
 *     searchable
 *     allow-create
 *     show-recent
 *   ></hybrid-select>
 */

(function (global) {
    "use strict";

    const COMPONENT_NAME = "hybrid-select";
    const RECENT_STORAGE_KEY = "hybrid-select-recent";
    const MAX_RECENT = 5;
    const DEBOUNCE_MS = 300;

    // SyncRegistry: Global registry for sync-group management
    const SyncRegistry = {
        _groups: new Map(), // Map<groupName, Set<HybridSelectElement>>
        _snapshots: new Map(), // Map<groupName, { version: number, options: Array }>
        _broadcasting: new Set(), // Set of groupNames currently broadcasting (prevent re-entry)

        register(element, groupName) {
            if (!groupName) return;
            if (!this._groups.has(groupName)) {
                this._groups.set(groupName, new Set());
            }
            this._groups.get(groupName).add(element);

            // Apply the existing snapshot if available
            const snapshot = this._snapshots.get(groupName);
            if (snapshot && snapshot.options.length > 0) {
                element._applySyncSnapshot(snapshot.options);
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

        publish(groupName, options, sourceElement) {
            if (!groupName || this._broadcasting.has(groupName)) return;

            this._broadcasting.add(groupName);

            // Store snapshot
            const currentVersion = (this._snapshots.get(groupName)?.version || 0) + 1;
            this._snapshots.set(groupName, {
                version: currentVersion,
                options: [...options],
            });

            // Broadcast to all members except source
            const group = this._groups.get(groupName);
            if (group) {
                group.forEach((element) => {
                    if (element !== sourceElement) {
                        element._applySyncSnapshot(options);
                    }
                });
            }

            this._broadcasting.delete(groupName);
        },

        refresh(groupName, payload = null) {
            const group = this._groups.get(groupName);
            if (!group) return;

            group.forEach((element) => {
                if (payload) {
                    // Apply provided payload
                    element._applySyncSnapshot(payload);
                } else if (element.getAttribute("data-url")) {
                    // Re-fetch from async URL
                    if (typeof element._fetchRemoteData === "function") {
                        element._fetchRemoteData("");
                    }
                } else {
                    // For static, apply stored snapshot
                    const snapshot = this._snapshots.get(groupName);
                    if (snapshot) {
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
        },
    };

    // Utility: Generate unique ID
    function generateId() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return (
            "id-" +
            Math.random().toString(36).substr(2, 9) +
            "-" +
            Date.now().toString(36)
        );
    }

    // Utility: Debounce function
    function debounce(fn, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // Utility: Normalize option data
    function normalizeOption(
        option,
        idField = "id",
        labelField = "label",
        valueField = "value",
    ) {
        const id = option[idField] || option.id || generateId();
        const label =
            option[labelField] ||
            option.label ||
            option.name ||
            option.text ||
            String(option[valueField] || option.value || id);
        const value =
            option[valueField] !== undefined
                ? option[valueField]
                : option.value !== undefined
                    ? option.value
                    : id;

        return {
            id: String(id),
            label: label,
            value: value,
            disabled: Boolean(option.disabled),
            icon: option.icon || null, // Font Awesome class or icon name
            image: option.image || null, // Image URL
            description: option.description || null,
            badge: option.badge || null, // Badge text
            badgeColor: option.badgeColor || null,
            group: option.group || null, // Group name for grouping
            meta: option.meta || null,
            _original: option,
        };
    }

    // Component Styles
    const styles = `
    :host {
      --hs-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      --hs-font-size: 16px;
      --hs-font-size-label: 14px;
      --hs-font-size-helper: 12px;
      --hs-font-size-item: 15px;
      --hs-font-size-description: 13px;

      --hs-bg: #ffffff;
      --hs-bg-hover: #f8f9fa;
      --hs-bg-selected: #e9ecef;
      --hs-bg-dropdown: #ffffff;
      --hs-bg-disabled: #f1f3f4;
      --hs-bg-group: #f8f9fa;
      --hs-bg-recent: #fff8e6;

      --hs-text: #1a1a1a;
      --hs-text-secondary: #6c757d;
      --hs-text-placeholder: #9ca3af;
      --hs-text-disabled: #9ca3af;
      --hs-text-highlight: #1a73e8;

      --hs-border: #d1d5db;
      --hs-border-hover: #9ca3af;
      --hs-border-focus: #3b82f6;
      --hs-border-error: #ef4444;

      --hs-ring: rgba(59, 130, 246, 0.15);
      --hs-ring-error: rgba(239, 68, 68, 0.15);

      --hs-radius: 8px;
      --hs-height: 48px;
      --hs-height-sm: 40px;
      --hs-height-lg: 56px;

      --hs-padding-x: 16px;
      --hs-padding-y: 12px;
      --hs-gap: 8px;

      --hs-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      --hs-transition: 0.2s ease;

      --hs-icon-size: 18px;
      --hs-avatar-size: 32px;

      --hs-dropdown-z-index: 99999;

      display: block;
      font-family: var(--hs-font-family);
      font-size: var(--hs-font-size);
      position: relative;
      width: 100%;
    }

    :host([hidden]) {
      display: none;
    }

    /* Bootstrap-compatible sizing */
    :host([size="small"]), :host([size="sm"]) {
      --hs-height: var(--hs-height-sm);
      --hs-font-size: 14px;
      --hs-padding-x: 12px;
      --hs-padding-y: 8px;
      --hs-icon-size: 16px;
      --hs-avatar-size: 24px;
    }

    :host([size="large"]), :host([size="lg"]) {
      --hs-height: var(--hs-height-lg);
      --hs-font-size: 18px;
      --hs-padding-x: 20px;
      --hs-padding-y: 14px;
      --hs-icon-size: 20px;
      --hs-avatar-size: 40px;
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
      cursor: pointer;
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

    .selected-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--hs-icon-size);
      height: var(--hs-icon-size);
      color: var(--hs-text-secondary);
      flex-shrink: 0;
    }

    .selected-image {
      width: var(--hs-avatar-size);
      height: var(--hs-avatar-size);
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
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

    .input[readonly] {
      cursor: pointer;
    }

    .display-value {
      flex: 1;
      min-width: 0;
      padding: var(--hs-padding-y) 0;
      margin: 0;
      color: var(--hs-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1.4;
    }

    .display-value.placeholder {
      color: var(--hs-text-placeholder);
    }

    .clear-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border: none;
      background: var(--hs-bg-hover);
      border-radius: 50%;
      cursor: pointer;
      color: var(--hs-text-secondary);
      font-size: 14px;
      line-height: 1;
      padding: 0;
      margin-right: 8px;
      transition: background-color var(--hs-transition), color var(--hs-transition);
      flex-shrink: 0;
    }

    .clear-btn:hover {
      background: var(--hs-bg-selected);
      color: var(--hs-text);
    }

    .clear-btn:focus {
      outline: 2px solid var(--hs-border-focus);
      outline-offset: 2px;
    }

    .chevron {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 100%;
      color: var(--hs-text-secondary);
      transition: transform var(--hs-transition);
      flex-shrink: 0;
      cursor: pointer;
    }

    .chevron:hover {
      color: var(--hs-text);
    }

    .chevron.open {
      transform: rotate(180deg);
    }

    .chevron svg {
      width: 20px;
      height: 20px;
    }

    /* Loading spinner */
    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 100%;
      flex-shrink: 0;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid var(--hs-border);
      border-top-color: var(--hs-border-focus);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .dropdown {
      position: fixed;
      width: auto;
      z-index: var(--hs-dropdown-z-index);
      background: var(--hs-bg-dropdown);
      border: 1px solid var(--hs-border);
      border-radius: var(--hs-radius);
      box-shadow: var(--hs-shadow);
      max-height: 360px;
      overflow: hidden;
      display: none;
      flex-direction: column;
    }

    .dropdown.open {
      display: flex;
    }

    .dropdown.above {
      top: auto;
      bottom: calc(100% + 4px);
    }

    .search-box {
      position: sticky;
      top: 0;
      display: flex;
      align-items: center;
      padding: 12px var(--hs-padding-x);
      border-bottom: 1px solid var(--hs-border);
      background: var(--hs-bg-dropdown);
      gap: 8px;
    }

    .search-box svg, .search-box i {
      width: 18px;
      height: 18px;
      color: var(--hs-text-secondary);
      flex-shrink: 0;
      font-size: 16px;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-family: inherit;
      font-size: var(--hs-font-size);
      color: var(--hs-text);
      outline: none;
      min-width: 0;
    }

    .search-input::placeholder {
      color: var(--hs-text-placeholder);
    }

    .options-list {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    /* Group headers */
    .group-header {
      display: flex;
      align-items: center;
      padding: 10px var(--hs-padding-x) 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--hs-text-secondary);
      background: var(--hs-bg-group);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .group-header-icon {
      margin-right: 8px;
      font-size: 12px;
    }

    /* Recent section */
    .recent-section {
      border-bottom: 1px solid var(--hs-border);
    }

    .recent-header {
      display: flex;
      align-items: center;
      padding: 8px var(--hs-padding-x);
      font-size: 11px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--hs-text-secondary);
      background: var(--hs-bg-recent);
    }

    .recent-header i, .recent-header svg {
      margin-right: 6px;
      font-size: 12px;
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: var(--hs-padding-y) var(--hs-padding-x);
      cursor: pointer;
      font-size: var(--hs-font-size-item);
      color: var(--hs-text);
      transition: background-color var(--hs-transition);
    }

    .option:hover:not(.disabled),
    .option.highlighted:not(.disabled) {
      background: var(--hs-bg-hover);
    }

    .option.selected {
      background: var(--hs-bg-selected);
    }

    .option.disabled {
      color: var(--hs-text-disabled);
      cursor: not-allowed;
    }

    .option.recent-item {
      background: var(--hs-bg-recent);
    }

    .option.recent-item:hover:not(.disabled) {
      background: #fff3cc;
    }

    /* Option content with icon/image */
    .option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--hs-icon-size);
      height: var(--hs-icon-size);
      color: var(--hs-text-secondary);
      flex-shrink: 0;
    }

    .option-icon i {
      font-size: var(--hs-icon-size);
    }

    .option-image {
      width: var(--hs-avatar-size);
      height: var(--hs-avatar-size);
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: var(--hs-bg-hover);
    }

    .option-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .option-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .option-description {
      font-size: var(--hs-font-size-description);
      color: var(--hs-text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .option-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 500;
      border-radius: 10px;
      background: var(--hs-bg-selected);
      color: var(--hs-text-secondary);
      flex-shrink: 0;
    }

    .option-badge.primary { background: #dbeafe; color: #1e40af; }
    .option-badge.success { background: #dcfce7; color: #166534; }
    .option-badge.warning { background: #fef3c7; color: #92400e; }
    .option-badge.danger { background: #fee2e2; color: #991b1b; }

    .option-check {
      width: 18px;
      height: 18px;
      color: var(--hs-border-focus);
      flex-shrink: 0;
    }

    /* Search highlight */
    .highlight {
      background: #fef08a;
      color: inherit;
      font-weight: 600;
      border-radius: 2px;
      padding: 0 1px;
    }

    /* Create new option */
    .create-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: var(--hs-padding-y) var(--hs-padding-x);
      border-top: 1px solid var(--hs-border);
      cursor: pointer;
      color: var(--hs-border-focus);
      font-weight: 500;
      transition: background-color var(--hs-transition);
    }

    .create-option:hover {
      background: var(--hs-bg-hover);
    }

    .create-option i, .create-option svg {
      font-size: 16px;
    }

    /* Loading state in dropdown */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px var(--hs-padding-x);
      color: var(--hs-text-secondary);
      gap: 12px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px var(--hs-padding-x);
      color: var(--hs-text-secondary);
      text-align: center;
      gap: 8px;
    }

    .empty-state svg, .empty-state i {
      width: 40px;
      height: 40px;
      opacity: 0.5;
      font-size: 40px;
    }

    .helper-text {
      font-size: var(--hs-font-size-helper);
      color: var(--hs-text-secondary);
      margin-top: 4px;
    }

    .helper-text.error {
      color: var(--hs-border-error);
    }

    .error-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      color: var(--hs-border-error);
      margin-right: 4px;
      flex-shrink: 0;
    }

    /* Multi-select chips */
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

    .chip-icon {
      font-size: 12px;
      color: var(--hs-text-secondary);
    }

    .chip-image {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      object-fit: cover;
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

    /* Responsive: Mobile bottom sheet */
    @media (max-width: 640px) {
      :host([mobile-sheet]) .dropdown {
        position: fixed;
        top: auto;
        left: 0;
        right: 0;
        bottom: 0;
        max-height: 70vh;
        border-radius: var(--hs-radius) var(--hs-radius) 0 0;
        z-index: 10000;
      }

      :host([mobile-sheet]) .dropdown::before {
        content: '';
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: -1;
      }

      :host([mobile-sheet]) .dropdown .drag-handle {
        display: flex;
        justify-content: center;
        padding: 12px;
      }

      :host([mobile-sheet]) .dropdown .drag-handle::after {
        content: '';
        width: 40px;
        height: 4px;
        background: var(--hs-border);
        border-radius: 2px;
      }
    }

    @media (min-width: 641px) {
      .drag-handle {
        display: none;
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :host(:not([light-mode])) {
        --hs-bg: #1f2937;
        --hs-bg-hover: #374151;
        --hs-bg-selected: #4b5563;
        --hs-bg-dropdown: #1f2937;
        --hs-bg-disabled: #374151;
        --hs-bg-group: #374151;
        --hs-bg-recent: #3d3a1f;

        --hs-text: #f9fafb;
        --hs-text-secondary: #9ca3af;
        --hs-text-placeholder: #6b7280;
        --hs-text-disabled: #6b7280;

        --hs-border: #4b5563;
        --hs-border-hover: #6b7280;
      }

      :host(:not([light-mode])) .highlight {
        background: #854d0e;
      }

      :host(:not([light-mode])) .option.recent-item {
        background: #3d3a1f;
      }

      :host(:not([light-mode])) .option.recent-item:hover:not(.disabled) {
        background: #4d4a2a;
      }
    }

    :host([dark-mode]) {
      --hs-bg: #1f2937;
      --hs-bg-hover: #374151;
      --hs-bg-selected: #4b5563;
      --hs-bg-dropdown: #1f2937;
      --hs-bg-disabled: #374151;
      --hs-bg-group: #374151;
      --hs-bg-recent: #3d3a1f;

      --hs-text: #f9fafb;
      --hs-text-secondary: #9ca3af;
      --hs-text-placeholder: #6b7280;
      --hs-text-disabled: #6b7280;

      --hs-border: #4b5563;
      --hs-border-hover: #6b7280;
    }

    :host([dark-mode]) .highlight {
      background: #854d0e;
    }

    :host([dark-mode]) .option.recent-item {
      background: #3d3a1f;
    }

    :host([dark-mode]) .option.recent-item:hover:not(.disabled) {
      background: #4d4a2a;
    }
  `;

    // Icons (SVG fallbacks when Font Awesome not available)
    const icons = {
        chevron: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        search: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        empty: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
        error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
    };

    class HybridSelect extends HTMLElement {
        static get observedAttributes() {
            return [
                "name",
                "label",
                "placeholder",
                "disabled",
                "required",
                "readonly",
                "searchable",
                "clearable",
                "multiple",
                "error",
                "helper",
                "size",
                "id-field",
                "label-field",
                "value-field",
                "empty-text",
                "search-placeholder",
                "dark-mode",
                "light-mode",
                "mobile-sheet",
                "allow-create",
                "create-text",
                "show-recent",
                "data-url",
                "min-search-length",
                "use-fa",
                "group-field",
                "mode",
                "sync-group",
                "dropdown-z-index",
                "padding-x",
                "padding-y",
            ];
        }

        // Static API for sync operations
        static syncAll(groupName, payload = null) {
            SyncRegistry.refresh(groupName, payload);
        }

        static getSyncGroups() {
            return SyncRegistry.getGroups();
        }

        static formAssociated = true;

        constructor() {
            super();
            this.attachShadow({mode: "open"});

            // Internal state
            this._options = [];
            this._normalizedOptions = new Map();
            this._selectedIds = new Set();
            this._highlightedIndex = -1;
            this._isOpen = false;
            this._searchValue = "";
            this._filteredOptions = [];
            this._groupedOptions = new Map();
            this._isLoading = false;
            this._recentIds = [];
            this._abortController = null;
            this._isSearching = false; // Track if user is actively searching in combobox mode

            // Form association
            if ("ElementInternals" in window) {
                try {
                    this._internals = this.attachInternals();
                } catch (e) {
                    // Form association not supported
                }
            }

            // Bound methods
            this._handleDocumentClick = this._handleDocumentClick.bind(this);
            this._handleKeyDown = this._handleKeyDown.bind(this);
            this._debouncedFetch = debounce(
                this._fetchRemoteData.bind(this),
                DEBOUNCE_MS,
            );

            // Load recent from storage
            this._loadRecent();

            this._render();
        }

        // Lifecycle
        connectedCallback() {
            document.addEventListener("click", this._handleDocumentClick);
            this._setupEventListeners();
            this._updateFormValue();

            // Apply dropdown z-index if specified
            const zIndex = this.getAttribute("dropdown-z-index");
            if (zIndex) {
                this.style.setProperty("--hs-dropdown-z-index", zIndex);
            }

            // Apply padding if specified
            const paddingX = this.getAttribute("padding-x");
            if (paddingX) {
                this.style.setProperty("--hs-padding-x", paddingX);
            }
            const paddingY = this.getAttribute("padding-y");
            if (paddingY) {
                this.style.setProperty("--hs-padding-y", paddingY);
            }

            // Register with sync group if specified
            const syncGroup = this.getAttribute("sync-group");
            if (syncGroup) {
                SyncRegistry.register(this, syncGroup);
            }

            // If data-url is set and no options, fetch initial data
            if (this.getAttribute("data-url") && this._options.length === 0) {
                this._fetchRemoteData("");
            }
        }

        disconnectedCallback() {
            document.removeEventListener("click", this._handleDocumentClick);
            if (this._abortController) {
                this._abortController.abort();
            }

            // Unregister from sync group
            const syncGroup = this.getAttribute("sync-group");
            if (syncGroup) {
                SyncRegistry.unregister(this, syncGroup);
            }
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue !== newValue) {
                if (name === "data-url" && newValue) {
                    this._fetchRemoteData("");
                }
                if (name === "sync-group") {
                    SyncRegistry.migrate(this, oldValue, newValue);
                }
                if (name === "dropdown-z-index") {
                    if (newValue && newValue.trim() !== "") {
                        this.style.setProperty("--hs-dropdown-z-index", newValue);
                    } else {
                        this.style.removeProperty("--hs-dropdown-z-index");
                    }
                }
                if (name === "padding-x") {
                    if (newValue && newValue.trim() !== "") {
                        this.style.setProperty("--hs-padding-x", newValue);
                    } else {
                        this.style.removeProperty("--hs-padding-x");
                    }
                }
                if (name === "padding-y") {
                    if (newValue && newValue.trim() !== "") {
                        this.style.setProperty("--hs-padding-y", newValue);
                    } else {
                        this.style.removeProperty("--hs-padding-y");
                    }
                }
                this._render();
            }
        }

        // Public API
        get options() {
            return this._options;
        }

        set options(value) {
            if (Array.isArray(value)) {
                this._options = value;
                this._normalizeOptions();
                this._render();
                this._publishToSyncGroup();
            } else if (typeof value === "string") {
                try {
                    this._options = JSON.parse(value);
                    this._normalizeOptions();
                    this._render();
                    this._publishToSyncGroup();
                } catch (e) {
                    console.error("HybridSelect: Invalid JSON for options", e);
                }
            }
        }

        // Sync group methods
        _publishToSyncGroup() {
            const syncGroup = this.getAttribute("sync-group");
            if (syncGroup) {
                SyncRegistry.publish(syncGroup, this._options, this);
            }
        }

        _applySyncSnapshot(options) {
            // Preserve current selection
            const currentSelection = new Set(this._selectedIds);

            // Update options without triggering another publish
            this._options = options;
            this._normalizeOptions();

            // Restore selection if options still exist
            this._selectedIds.clear();
            for (const id of currentSelection) {
                if (this._normalizedOptions.has(id)) {
                    this._selectedIds.add(id);
                }
            }

            this._render();
            this._updateFormValue();
        }

        // Public method to manually refresh from sync group or async source
        refresh() {
            const syncGroup = this.getAttribute("sync-group");
            const dataUrl = this.getAttribute("data-url");

            if (dataUrl) {
                this._fetchRemoteData("");
            } else if (syncGroup) {
                // Request refresh from registry
                const snapshot = SyncRegistry._snapshots.get(syncGroup);
                if (snapshot && snapshot.options) {
                    this._applySyncSnapshot(snapshot.options);
                }
            }
        }

        // Getter for sync-group attribute
        get syncGroup() {
            return this.getAttribute("sync-group");
        }

        set syncGroup(value) {
            if (value) {
                this.setAttribute("sync-group", value);
            } else {
                this.removeAttribute("sync-group");
            }
        }

        get value() {
            if (this.multiple) {
                return Array.from(this._selectedIds)
                    .map((id) => {
                        const opt = this._normalizedOptions.get(id);
                        return opt ? opt.value : null;
                    })
                    .filter((v) => v !== null);
            }
            const firstId = Array.from(this._selectedIds)[0];
            const opt = this._normalizedOptions.get(firstId);
            return opt ? opt.value : null;
        }

        set value(val) {
            this._selectedIds.clear();
            if (val === null || val === undefined) {
                this._render();
                this._updateFormValue();
                return;
            }

            const values = Array.isArray(val) ? val : [val];
            for (const v of values) {
                for (const [id, opt] of this._normalizedOptions) {
                    if (opt.value === v || opt.id === v) {
                        this._selectedIds.add(id);
                        if (!this.multiple) break;
                    }
                }
            }
            this._render();
            this._updateFormValue();
        }

        get selectedOption() {
            if (this.multiple) {
                return Array.from(this._selectedIds)
                    .map((id) => this._normalizedOptions.get(id))
                    .filter(Boolean);
            }
            const firstId = Array.from(this._selectedIds)[0];
            return this._normalizedOptions.get(firstId) || null;
        }

        get selectedOptions() {
            return Array.from(this._selectedIds)
                .map((id) => this._normalizedOptions.get(id))
                .filter(Boolean);
        }

        get multiple() {
            return this.hasAttribute("multiple");
        }

        set multiple(val) {
            if (val) {
                this.setAttribute("multiple", "");
            } else {
                this.removeAttribute("multiple");
            }
        }

        get disabled() {
            return this.hasAttribute("disabled");
        }

        set disabled(val) {
            if (val) {
                this.setAttribute("disabled", "");
            } else {
                this.removeAttribute("disabled");
            }
        }

        get searchable() {
            return this.hasAttribute("searchable");
        }

        set searchable(val) {
            if (val) {
                this.setAttribute("searchable", "");
            } else {
                this.removeAttribute("searchable");
            }
        }

        get clearable() {
            return this.hasAttribute("clearable");
        }

        set clearable(val) {
            if (val) {
                this.setAttribute("clearable", "");
            } else {
                this.removeAttribute("clearable");
            }
        }

        get allowCreate() {
            return this.hasAttribute("allow-create");
        }

        set allowCreate(val) {
            if (val) {
                this.setAttribute("allow-create", "");
            } else {
                this.removeAttribute("allow-create");
            }
        }

        get showRecent() {
            return this.hasAttribute("show-recent");
        }

        set showRecent(val) {
            if (val) {
                this.setAttribute("show-recent", "");
            } else {
                this.removeAttribute("show-recent");
            }
        }

        get required() {
            return this.hasAttribute("required");
        }

        set required(val) {
            if (val) {
                this.setAttribute("required", "");
            } else {
                this.removeAttribute("required");
            }
        }

        get mode() {
            return this.getAttribute("mode") || "combobox";
        }

        get isEnhancedMode() {
            return this.mode === "enhanced";
        }

        get name() {
            return this.getAttribute("name");
        }

        get loading() {
            return this._isLoading;
        }

        // Public methods
        open() {
            if (!this.disabled && !this.hasAttribute("readonly")) {
                this._isOpen = true;
                this._searchValue = "";
                this._filterOptions();
                // Initialize highlighted index to first option for keyboard navigation
                this._highlightedIndex = this._filteredOptions.length > 0 ? 0 : -1;
                this._render();
                this._emitEvent("open");

                // Position dropdown
                requestAnimationFrame(() => this._positionDropdown());

                // Close on scroll to prevent detachment
                this._boundClose = this.close.bind(this);
                window.addEventListener("scroll", this._boundClose, {
                    capture: true,
                    passive: true,
                });
                window.addEventListener("resize", this._boundClose, {passive: true});
            }
        }

        close() {
            if (this._isOpen) {
                this._isOpen = false;
                this._searchValue = "";
                this._isSearching = false;
                this._filterOptions();
                this._render();
                this._emitEvent("close");

                if (this._boundClose) {
                    window.removeEventListener("scroll", this._boundClose, {
                        capture: true,
                    });
                    window.removeEventListener("resize", this._boundClose);
                    this._boundClose = null;
                }
            }
        }

        toggle() {
            if (this._isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        clear() {
            this._selectedIds.clear();
            this._searchValue = "";
            this._isSearching = false;
            this._filterOptions();
            this._render();
            this._updateFormValue();
            this._emitEvent("change", {
                value: null,
                selectedOption: null,
                cleared: true,
            });
        }

        reset() {
            this.clear();
            this._searchValue = "";
            this.close();
        }

        focus() {
            const input = this.shadowRoot.querySelector(".input, .search-input");
            if (input) input.focus();
        }

        blur() {
            const input = this.shadowRoot.querySelector(".input, .search-input");
            if (input) input.blur();
        }

        refresh() {
            if (this.getAttribute("data-url")) {
                this._fetchRemoteData(this._searchValue);
            }
        }

        // Private methods
        _loadRecent() {
            try {
                const stored = localStorage.getItem(
                    RECENT_STORAGE_KEY + "-" + this.name,
                );
                if (stored) {
                    this._recentIds = JSON.parse(stored);
                }
            } catch (e) {
                // Ignore storage errors
            }
        }

        _saveRecent(id) {
            if (!this.showRecent || !this.name) return;

            // Add to front, remove duplicates, limit to MAX_RECENT
            this._recentIds = [id, ...this._recentIds.filter((i) => i !== id)].slice(
                0,
                MAX_RECENT,
            );

            try {
                localStorage.setItem(
                    RECENT_STORAGE_KEY + "-" + this.name,
                    JSON.stringify(this._recentIds),
                );
            } catch (e) {
                // Ignore storage errors
            }
        }

        _normalizeOptions() {
            this._normalizedOptions.clear();
            this._groupedOptions.clear();

            const idField = this.getAttribute("id-field") || "id";
            const labelField = this.getAttribute("label-field") || "label";
            const valueField = this.getAttribute("value-field") || "value";
            const groupField = this.getAttribute("group-field") || "group";

            for (const opt of this._options) {
                const normalized = normalizeOption(
                    opt,
                    idField,
                    labelField,
                    valueField,
                );
                normalized.group = opt[groupField] || opt.group || null;
                this._normalizedOptions.set(normalized.id, normalized);

                // Group options
                if (normalized.group) {
                    if (!this._groupedOptions.has(normalized.group)) {
                        this._groupedOptions.set(normalized.group, []);
                    }
                    this._groupedOptions.get(normalized.group).push(normalized);
                }
            }

            this._filterOptions();
        }

        _filterOptions() {
            const search = this._searchValue.toLowerCase().trim();

            if (!search) {
                this._filteredOptions = Array.from(this._normalizedOptions.values());
            } else {
                this._filteredOptions = Array.from(
                    this._normalizedOptions.values(),
                ).filter(
                    (opt) =>
                        opt.label.toLowerCase().includes(search) ||
                        (opt.description && opt.description.toLowerCase().includes(search)),
                );
            }
        }

        async _fetchRemoteData(searchTerm) {
            const url = this.getAttribute("data-url");
            if (!url) return;

            const minLength = parseInt(
                this.getAttribute("min-search-length") || "0",
                10,
            );
            if (searchTerm.length < minLength) {
                return;
            }

            // Cancel previous request
            if (this._abortController) {
                this._abortController.abort();
            }
            this._abortController = new AbortController();

            this._isLoading = true;
            this._renderPreservingCursor();

            try {
                const fetchUrl = new URL(url, window.location.origin);
                if (searchTerm) {
                    fetchUrl.searchParams.set("q", searchTerm);
                    fetchUrl.searchParams.set("search", searchTerm);
                }

                const response = await fetch(fetchUrl.toString(), {
                    signal: this._abortController.signal,
                });

                if (!response.ok) throw new Error("Network response was not ok");

                const data = await response.json();
                this._options = Array.isArray(data)
                    ? data
                    : data.results || data.items || data.data || [];
                this._normalizeOptions();

                this._emitEvent("load", {options: this._options, searchTerm});
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error("HybridSelect: Failed to fetch data", e);
                    this._emitEvent("error", {error: e});
                }
            } finally {
                this._isLoading = false;
                // After loading, if we're not actively searching, reset search state
                if (!this._isOpen) {
                    this._isSearching = false;
                }
                this._renderPreservingCursor();
            }
        }

        _renderPreservingCursor() {
            const activeEl = this.shadowRoot.activeElement;
            const cursorPos = activeEl?.selectionStart ?? null;

            this._render();

            if (cursorPos !== null && this._isOpen) {
                requestAnimationFrame(() => {
                    const newInput =
                        this.shadowRoot.querySelector("[data-search-input]") ||
                        this.shadowRoot.querySelector("[data-input]");
                    if (newInput) {
                        newInput.focus();
                        newInput.setSelectionRange(cursorPos, cursorPos);
                    }
                });
            }
        }

        _selectOption(id) {
            const option = this._normalizedOptions.get(id);
            if (!option || option.disabled) return;

            if (this.multiple) {
                if (this._selectedIds.has(id)) {
                    this._selectedIds.delete(id);
                } else {
                    this._selectedIds.add(id);
                }
                // Multi-select stays open (per user request)
            } else {
                this._selectedIds.clear();
                this._selectedIds.add(id);
                this.close();
            }

            // Clear search value and reset search mode after selection
            this._searchValue = "";
            this._isSearching = false;
            this._filterOptions();

            // Save to recent
            this._saveRecent(id);

            this._render();
            this._updateFormValue();

            this._emitEvent("change", {
                value: this.value,
                selectedOption: this.selectedOption,
                selectedOptions: this.selectedOptions,
            });
        }

        _createNewOption() {
            const label = this._searchValue.trim();
            if (!label) return;

            const newOption = {
                id: generateId(),
                label: label,
                value: label,
                _isNew: true,
            };

            // Emit event so parent can handle creation
            this._emitEvent("create", {
                label: label,
                option: newOption,
            });

            // Add to options and select
            this._options.push(newOption);
            this._normalizeOptions();
            this._selectOption(newOption.id);

            // Publish to sync group so all controls get the new option
            this._publishToSyncGroup();
        }

        _removeChip(id, e) {
            e.stopPropagation();
            this._selectedIds.delete(id);
            this._render();
            this._updateFormValue();

            this._emitEvent("change", {
                value: this.value,
                selectedOption: this.selectedOption,
                selectedOptions: this.selectedOptions,
            });
        }

        _positionDropdown() {
            const dropdown = this.shadowRoot.querySelector(".dropdown");
            const control = this.shadowRoot.querySelector(".control");
            if (!dropdown || !control) return;

            const rect = control.getBoundingClientRect();

            // Set dimensions and position based on the control's screen location
            dropdown.style.width = `${rect.width}px`;
            dropdown.style.left = `${rect.left}px`;

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            if (spaceBelow < 360 && spaceAbove > spaceBelow) {
                dropdown.classList.add("above");
                dropdown.style.top = "auto";
                dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
            } else {
                dropdown.classList.remove("above");
                dropdown.style.top = `${rect.bottom + 4}px`;
                dropdown.style.bottom = "auto";
            }
        }

        _handleDocumentClick(e) {
            if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
                this.close();
            }
        }

        _handleKeyDown(e) {
            // Always prevent arrow keys from scrolling the page
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
            }

            if (!this._isOpen) {
                if (
                    e.key === "Enter" ||
                    e.key === " " ||
                    e.key === "ArrowDown" ||
                    e.key === "ArrowUp"
                ) {
                    this.open();
                }
                return;
            }

            switch (e.key) {
                case "Escape":
                    e.preventDefault();
                    this.close();
                    break;
                case "ArrowDown":
                    if (this._filteredOptions.length > 0) {
                        this._highlightedIndex = Math.min(
                            this._highlightedIndex + 1,
                            this._filteredOptions.length - 1,
                        );
                    }
                    this._render();
                    this._scrollToHighlighted();
                    break;
                case "ArrowUp":
                    this._highlightedIndex = Math.max(this._highlightedIndex - 1, 0);
                    this._render();
                    this._scrollToHighlighted();
                    break;
                case "Enter":
                    e.preventDefault();
                    if (this._highlightedIndex >= 0) {
                        const opt = this._filteredOptions[this._highlightedIndex];
                        if (opt) this._selectOption(opt.id);
                    } else if (this.allowCreate && this._searchValue.trim()) {
                        this._createNewOption();
                    }
                    break;
                case "Tab":
                    // Tab selects highlighted option and moves focus to next control
                    if (this._highlightedIndex >= 0) {
                        const opt = this._filteredOptions[this._highlightedIndex];
                        if (opt) {
                            this._selectOption(opt.id);
                            // Close dropdown and blur to allow natural tab navigation
                            this.close();
                            this.blur();
                        }
                    }
                    // Don't prevent default - allow natural tab navigation
                    break;
                case "Home":
                    e.preventDefault();
                    this._highlightedIndex = 0;
                    this._render();
                    this._scrollToHighlighted();
                    break;
                case "End":
                    e.preventDefault();
                    this._highlightedIndex = this._filteredOptions.length - 1;
                    this._render();
                    this._scrollToHighlighted();
                    break;
            }
        }

        _scrollToHighlighted() {
            const list = this.shadowRoot.querySelector(".options-list");
            const highlighted = this.shadowRoot.querySelector(".option.highlighted");
            if (list && highlighted) {
                highlighted.scrollIntoView({block: "nearest"});
            }
        }

        _updateFormValue() {
            if (this._internals) {
                const value = this.value;
                this._internals.setFormValue(
                    Array.isArray(value) ? value.join(",") : value || "",
                );
            }
        }

        _emitEvent(name, detail = {}) {
            this.dispatchEvent(
                new CustomEvent(`hybrid-select:${name}`, {
                    bubbles: true,
                    composed: true,
                    detail: {
                        ...detail,
                        target: this,
                        name: this.name,
                    },
                }),
            );
        }

        _setupEventListeners() {
            // Attach keydown to the host element with capture phase - ensures we catch events from shadow DOM
            this.addEventListener("keydown", this._handleKeyDown, {capture: true});
        }

        _getDisplayValue() {
            if (this._selectedIds.size === 0) {
                return null;
            }

            if (this.multiple) {
                return null; // Chips will be rendered
            }

            const firstId = Array.from(this._selectedIds)[0];
            const opt = this._normalizedOptions.get(firstId);
            return opt || null;
        }

        _highlightText(text, search) {
            if (!search || !text) return this._escapeHtml(text);

            const escaped = this._escapeHtml(text);
            const searchEscaped = this._escapeHtml(search);
            const regex = new RegExp(
                `(${searchEscaped.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
                "gi",
            );

            return escaped.replace(regex, '<span class="highlight">$1</span>');
        }

        _renderIcon(iconClass) {
            const useFa = this.hasAttribute("use-fa");
            if (useFa && iconClass) {
                // Check if it's already a full FA class
                if (iconClass.startsWith("fa")) {
                    return `<i class="${iconClass}"></i>`;
                }
                // Assume it's just the icon name
                return `<i class="fa-solid fa-${iconClass}"></i>`;
            }
            return "";
        }

        _render() {
            // Preserve focus state before DOM update
            const activeElement = this.shadowRoot.activeElement;
            const hadFocus =
                activeElement &&
                (activeElement.matches(".input") ||
                    activeElement.matches(".search-input") ||
                    activeElement.matches("[data-control]"));
            const selectionStart = activeElement?.selectionStart;
            const selectionEnd = activeElement?.selectionEnd;
            const wasSearchInput =
                activeElement?.matches(".search-input") ||
                activeElement?.matches("[data-search-input]");

            const label = this.getAttribute("label");
            const placeholder =
                this.getAttribute("placeholder") || "Select an option...";
            const helper = this.getAttribute("helper");
            const error = this.getAttribute("error");
            const emptyText =
                this.getAttribute("empty-text") || "No options available";
            const searchPlaceholder =
                this.getAttribute("search-placeholder") || "Search...";
            const createText = this.getAttribute("create-text") || "Create";
            const isDisabled = this.disabled;
            const isRequired = this.hasAttribute("required");
            const isSearchable = this.searchable;
            const isClearable = this.clearable && this._selectedIds.size > 0;
            const isMultiple = this.multiple;
            const allowCreate = this.allowCreate;
            const showRecent = this.showRecent;
            const useFa = this.hasAttribute("use-fa");

            const displayOption = this._getDisplayValue();
            const hasValue = this._selectedIds.size > 0;

            // Build chips for multi-select
            let chipsHtml = "";
            if (isMultiple && hasValue) {
                const chips = Array.from(this._selectedIds)
                    .map((id) => {
                        const opt = this._normalizedOptions.get(id);
                        if (!opt) return "";

                        let chipIcon = "";
                        if (opt.icon) {
                            chipIcon = `<span class="chip-icon">${this._renderIcon(opt.icon)}</span>`;
                        } else if (opt.image) {
                            chipIcon = `<img class="chip-image" src="${this._escapeHtml(opt.image)}" alt="">`;
                        }

                        return `
            <span class="chip" data-id="${opt.id}">
              ${chipIcon}
              <span class="chip-label">${this._escapeHtml(opt.label)}</span>
              <button type="button" class="chip-remove" data-chip-remove="${opt.id}" tabindex="-1">
                ${icons.close}
              </button>
            </span>
          `;
                    })
                    .join("");
                chipsHtml = `<div class="chips-container">${chips}</div>`;
            }

            // Build recent section
            let recentHtml = "";
            if (showRecent && this._recentIds.length > 0 && !this._searchValue) {
                const recentOptions = this._recentIds
                    .map((id) => this._normalizedOptions.get(id))
                    .filter((opt) => opt && !opt.disabled);

                if (recentOptions.length > 0) {
                    const recentItems = recentOptions
                        .map((opt) => {
                            const isSelected = this._selectedIds.has(opt.id);
                            let optionIcon = "";
                            if (opt.icon) {
                                optionIcon = `<span class="option-icon">${this._renderIcon(opt.icon)}</span>`;
                            } else if (opt.image) {
                                optionIcon = `<img class="option-image" src="${this._escapeHtml(opt.image)}" alt="">`;
                            }

                            return `
              <div class="option recent-item ${isSelected ? "selected" : ""}" 
                   data-id="${opt.id}" role="option" aria-selected="${isSelected}">
                ${optionIcon}
                <span class="option-content">
                  <span class="option-label">${this._escapeHtml(opt.label)}</span>
                </span>
                ${isSelected ? `<span class="option-check">${icons.check}</span>` : ""}
              </div>
            `;
                        })
                        .join("");

                    recentHtml = `
            <div class="recent-section">
              <div class="recent-header">
                ${useFa ? '<i class="fa-regular fa-clock"></i>' : icons.clock}
                Recent
              </div>
              ${recentItems}
            </div>
          `;
                }
            }

            // Build options list with groups
            let optionsHtml = "";
            if (this._isLoading) {
                optionsHtml = `
          <div class="loading-state">
            <div class="spinner"></div>
            <span>Loading...</span>
          </div>
        `;
            } else if (this._filteredOptions.length === 0) {
                optionsHtml = `
          <div class="empty-state">
            ${useFa ? '<i class="fa-regular fa-folder-open"></i>' : icons.empty}
            <span>${this._escapeHtml(emptyText)}</span>
          </div>
        `;
            } else {
                // Check if we have groups
                const hasGroups = this._groupedOptions.size > 0;

                if (hasGroups && !this._searchValue) {
                    // Render grouped options
                    const ungrouped = this._filteredOptions.filter((opt) => !opt.group);

                    // Render ungrouped first
                    if (ungrouped.length > 0) {
                        optionsHtml += ungrouped
                            .map((opt, index) => this._renderOption(opt, index))
                            .join("");
                    }

                    // Render each group
                    for (const [groupName, groupOptions] of this._groupedOptions) {
                        const filteredGroupOptions = groupOptions.filter((opt) =>
                            this._filteredOptions.some((f) => f.id === opt.id),
                        );

                        if (filteredGroupOptions.length > 0) {
                            optionsHtml += `<div class="group-header">${this._escapeHtml(groupName)}</div>`;
                            optionsHtml += filteredGroupOptions
                                .map((opt, index) => this._renderOption(opt, index))
                                .join("");
                        }
                    }
                } else {
                    // Render flat list
                    optionsHtml = this._filteredOptions
                        .map((opt, index) => this._renderOption(opt, index))
                        .join("");
                }
            }

            // Create option
            let createHtml = "";
            if (
                allowCreate &&
                this._searchValue.trim() &&
                !this._filteredOptions.some(
                    (opt) => opt.label.toLowerCase() === this._searchValue.toLowerCase(),
                )
            ) {
                createHtml = `
          <div class="create-option" data-create>
            ${useFa ? '<i class="fa-solid fa-plus"></i>' : icons.plus}
            <span>${this._escapeHtml(createText)} "<strong>${this._escapeHtml(this._searchValue)}</strong>"</span>
          </div>
        `;
            }

            // Search box (only in enhanced mode)
            const searchBoxHtml =
                isSearchable && this.isEnhancedMode
                    ? `
        <div class="search-box">
          ${useFa ? '<i class="fa-solid fa-magnifying-glass"></i>' : icons.search}
          <input type="text" class="search-input" 
                 placeholder="${this._escapeHtml(searchPlaceholder)}"
                 value="${this._escapeHtml(this._searchValue)}"
                 data-search-input>
        </div>
      `
                    : "";

            // Clear button
            const clearBtnHtml = isClearable
                ? `
        <button type="button" class="clear-btn" data-clear tabindex="-1" aria-label="Clear selection">
          ${icons.close}
        </button>
      `
                : "";

            // Error icon
            const errorIconHtml = error
                ? `
        <span class="error-icon">${icons.error}</span>
      `
                : "";

            // Selected option icon/image in control
            let selectedIconHtml = "";
            if (!isMultiple && displayOption) {
                if (displayOption.icon) {
                    selectedIconHtml = `<span class="selected-icon">${this._renderIcon(displayOption.icon)}</span>`;
                } else if (displayOption.image) {
                    selectedIconHtml = `<img class="selected-image" src="${this._escapeHtml(displayOption.image)}" alt="">`;
                }
            }

            // Loading spinner in control
            const loadingHtml = this._isLoading
                ? `
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
      `
                : "";

            this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="wrapper">
          ${label ? `<label class="label${isRequired ? " required" : ""}">${this._escapeHtml(label)}</label>` : ""}

          <div class="control ${this._isOpen ? "focused" : ""} ${isDisabled ? "disabled" : ""} ${error ? "error" : ""}"
               tabindex="${isDisabled ? "-1" : "0"}"
               role="combobox"
               aria-expanded="${this._isOpen}"
               aria-haspopup="listbox"
               aria-disabled="${isDisabled}"
               data-control>

            <div class="input-wrapper">
              ${selectedIconHtml}
              ${isMultiple && hasValue ? chipsHtml : ""}
              ${
                !isMultiple || !hasValue
                    ? `
                ${
                        !this.isEnhancedMode
                            ? `
                  <input type="text" class="input" 
                         placeholder="${this._escapeHtml(placeholder)}"
                         value="${this._escapeHtml(this._isSearching ? this._searchValue : hasValue && displayOption ? displayOption.label : "")}"
                         ${isDisabled ? "disabled" : ""}
                         data-input>
                `
                            : isSearchable && this._isOpen
                                ? `
                  <input type="text" class="input" 
                         placeholder="${hasValue ? "" : this._escapeHtml(placeholder)}"
                         value="${this._escapeHtml(this._searchValue)}"
                         ${isDisabled ? "disabled" : ""}
                         data-input>
                `
                                : `
                  <span class="display-value ${!hasValue ? "placeholder" : ""}">
                    ${hasValue && displayOption ? this._escapeHtml(displayOption.label) : this._escapeHtml(placeholder)}
                  </span>
                `
                    }
              `
                    : ""
            }
            </div>

            ${errorIconHtml}
            ${clearBtnHtml}
            ${loadingHtml}

            ${
                !this._isLoading
                    ? `
              <div class="chevron ${this._isOpen ? "open" : ""}" data-chevron>
                ${icons.chevron}
              </div>
            `
                    : ""
            }
          </div>

          <div class="dropdown ${this._isOpen ? "open" : ""}" role="listbox" aria-label="${label || "Options"}">
            <div class="drag-handle"></div>
            ${searchBoxHtml}
            ${recentHtml}
            <div class="options-list">
              ${optionsHtml}
            </div>
            ${createHtml}
          </div>

          ${
                helper || error
                    ? `
            <span class="helper-text ${error ? "error" : ""}">${this._escapeHtml(error || helper)}</span>
          `
                    : ""
            }
        </div>
      `;

            this._attachDomEvents();

            // Restore focus after DOM update
            if (hadFocus) {
                requestAnimationFrame(() => {
                    let elementToFocus;
                    if (wasSearchInput) {
                        elementToFocus =
                            this.shadowRoot.querySelector("[data-search-input]") ||
                            this.shadowRoot.querySelector(".search-input");
                    }
                    if (!elementToFocus) {
                        elementToFocus =
                            this.shadowRoot.querySelector("[data-input]") ||
                            this.shadowRoot.querySelector(".input") ||
                            this.shadowRoot.querySelector("[data-control]");
                    }
                    if (elementToFocus) {
                        elementToFocus.focus();
                        // Restore cursor position for text inputs
                        if (
                            selectionStart !== undefined &&
                            elementToFocus.setSelectionRange
                        ) {
                            try {
                                elementToFocus.setSelectionRange(selectionStart, selectionEnd);
                            } catch (e) {
                                // Ignore if selection can't be set
                            }
                        }
                    }
                });
            }
        }

        _renderOption(opt, index) {
            const isSelected = this._selectedIds.has(opt.id);
            const isHighlighted = index === this._highlightedIndex;
            const classes = ["option"];
            if (isSelected) classes.push("selected");
            if (isHighlighted) classes.push("highlighted");
            if (opt.disabled) classes.push("disabled");

            let optionIcon = "";
            if (opt.icon) {
                optionIcon = `<span class="option-icon">${this._renderIcon(opt.icon)}</span>`;
            } else if (opt.image) {
                optionIcon = `<img class="option-image" src="${this._escapeHtml(opt.image)}" alt="">`;
            }

            const labelHtml = this._searchValue
                ? this._highlightText(opt.label, this._searchValue)
                : this._escapeHtml(opt.label);

            let descriptionHtml = "";
            if (opt.description) {
                descriptionHtml = `<span class="option-description">${
                    this._searchValue
                        ? this._highlightText(opt.description, this._searchValue)
                        : this._escapeHtml(opt.description)
                }</span>`;
            }

            let badgeHtml = "";
            if (opt.badge) {
                const badgeClass = opt.badgeColor
                    ? `option-badge ${opt.badgeColor}`
                    : "option-badge";
                badgeHtml = `<span class="${badgeClass}">${this._escapeHtml(opt.badge)}</span>`;
            }

            return `
        <div class="${classes.join(" ")}" data-id="${opt.id}" data-index="${index}"
             role="option" aria-selected="${isSelected}" id="option-${opt.id}">
          ${optionIcon}
          <span class="option-content">
            <span class="option-label">${labelHtml}</span>
            ${descriptionHtml}
          </span>
          ${badgeHtml}
          ${isSelected ? `<span class="option-check">${icons.check}</span>` : ""}
        </div>
      `;
        }

        _attachDomEvents() {
            const control = this.shadowRoot.querySelector("[data-control]");
            const input = this.shadowRoot.querySelector("[data-input]");
            const searchInput = this.shadowRoot.querySelector("[data-search-input]");
            const clearBtn = this.shadowRoot.querySelector("[data-clear]");
            const chevron = this.shadowRoot.querySelector("[data-chevron]");
            const options = this.shadowRoot.querySelectorAll(".option");
            const chipRemoves =
                this.shadowRoot.querySelectorAll("[data-chip-remove]");
            const createOption = this.shadowRoot.querySelector("[data-create]");

            // Control click behavior depends on mode
            control?.addEventListener("click", (e) => {
                if (
                    e.target.closest("[data-clear]") ||
                    e.target.closest("[data-chip-remove]")
                )
                    return;
                if (e.target.closest("[data-chevron]")) return; // Chevron has its own handler

                if (this.isEnhancedMode) {
                    // Enhanced mode: clicking control opens dropdown
                    this.toggle();
                } else {
                    // Combobox mode: clicking control focuses input, does NOT open dropdown
                    if (input && !this._isOpen) {
                        input.focus();
                    } else if (this._isOpen) {
                        // If already open, clicking control closes it
                        this.close();
                    }
                }
            });

            // Keydown is handled at the host element level in _setupEventListeners

            // Chevron always toggles dropdown
            chevron?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggle();
            });

            const handleInput = (e) => {
                const cursorPos = e.target.selectionStart;
                this._searchValue = e.target.value;
                this._isSearching = true; // User is actively searching
                this._filterOptions();
                this._highlightedIndex = -1;

                // In combobox mode, typing opens the dropdown
                if (
                    !this.isEnhancedMode &&
                    !this._isOpen &&
                    this._searchValue.length > 0
                ) {
                    this._isOpen = true;
                    this._emitEvent("open");
                }

                // Trigger remote search if data-url is set
                if (this.getAttribute("data-url")) {
                    this._debouncedFetch(this._searchValue);
                } else {
                    this._render();
                    // Restore cursor position after render
                    requestAnimationFrame(() => {
                        const newInput =
                            this.shadowRoot.querySelector("[data-search-input]") ||
                            this.shadowRoot.querySelector("[data-input]");
                        if (newInput) {
                            newInput.focus();
                            newInput.setSelectionRange(cursorPos, cursorPos);
                        }
                    });
                }

                this._emitEvent("input", {searchValue: this._searchValue});
            };

            input?.addEventListener("input", handleInput);
            input?.addEventListener("click", (e) => e.stopPropagation()); // Prevent control click handler
            input?.addEventListener("blur", () => {
                // Reset search mode on blur if no dropdown is open
                if (!this._isOpen) {
                    this._isSearching = false;
                    this._searchValue = "";
                    this._filterOptions();
                    this._render();
                }
            });
            searchInput?.addEventListener("input", handleInput);
            searchInput?.addEventListener("click", (e) => e.stopPropagation());

            clearBtn?.addEventListener("click", (e) => {
                e.stopPropagation();
                this.clear();
            });

            options.forEach((opt) => {
                opt.addEventListener("click", () => {
                    const id = opt.dataset.id;
                    this._selectOption(id);
                });
            });

            chipRemoves.forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const id = btn.dataset.chipRemove;
                    this._removeChip(id, e);
                });
            });

            createOption?.addEventListener("click", () => {
                this._createNewOption();
            });

            // Focus the search input when dropdown opens
            if (this._isOpen && searchInput) {
                setTimeout(() => searchInput.focus(), 10);
            }
        }

        _escapeHtml(str) {
            if (!str) return "";
            const div = document.createElement("div");
            div.textContent = str;
            return div.innerHTML;
        }
    }

    // Register the component
    if (!customElements.get(COMPONENT_NAME)) {
        customElements.define(COMPONENT_NAME, HybridSelect);
    }

    // Export for module systems
    if (typeof module !== "undefined" && module.exports) {
        module.exports = HybridSelect;
    }

    if (typeof global !== "undefined") {
        global.HybridSelect = HybridSelect;
    }
})(typeof window !== "undefined" ? window : this);
