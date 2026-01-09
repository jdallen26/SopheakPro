'use client';
import React, { useEffect, useRef } from 'react';

export type HybridSelectValue = string | number | (string | number)[] | null;

export interface HybridSelectOption {
    id: string | number;
    label: string;
    value?: string | number;
    icon?: string;
    image?: string;
    description?: string;
    badge?: string;
    badgeColor?: string;
    group?: string;
    [key: string]: unknown;
}

interface HybridSelectElement extends HTMLElement {
    options: HybridSelectOption[];
    value: HybridSelectValue;
}

export interface HybridSelectWrapperProps {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    options: HybridSelectOption[];
    value?: HybridSelectValue;
    onChange?: (value: HybridSelectValue, option: HybridSelectOption | HybridSelectOption[] | null) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onInput?: (searchValue: string) => void;
    onLoad?: (options: HybridSelectOption[], searchTerm: string) => void;
    onError?: (error: unknown) => void;
    onCreate?: (label: string, option: HybridSelectOption) => void;
    required?: boolean;
    disabled?: boolean;
    searchable?: boolean;
    clearable?: boolean;
    multiple?: boolean;
    allowCreate?: boolean;
    showRecent?: boolean;
    darkMode?: boolean;
    lightMode?: boolean;
    mode?: string;
    use_fa?: boolean;
    data_url?: string;
    id_field?: string;
    group_field?: string;
    size?: string;
    className?: string;
    styles?: React.CSSProperties;
}

export const HybridSelectWrapper: React.FC<HybridSelectWrapperProps> = (props) => {
    const ref = useRef<HTMLElement>(null);
    const { 
        id,
        options, 
        value, 
        onChange,
        onOpen,
        onClose,
        onInput,
        onLoad,
        onError,
        onCreate,
        className, 
        styles,
        label,
        name,
        placeholder,
        required,
        disabled,
        searchable = true,
        clearable = true,
        multiple,
        allowCreate,
        showRecent,
        darkMode,
        lightMode,
        mode,
        use_fa = false,
        data_url,
        id_field,
        group_field,
        size
    } = props;

    // Dynamically import the web component to avoid SSR "HTMLElement is not defined" error
    useEffect(() => {
        import('@/assets/controls/js/hs/hybrid-select.js');
    }, []);

    // Update options when prop changes
    useEffect(() => {
        const el = ref.current as HybridSelectElement | null;
        if (el) {
            customElements.whenDefined('hybrid-select').then(() => {
                el.options = options;
            });
        }
    }, [options]);

    // Update value when prop changes
    useEffect(() => {
        const el = ref.current as HybridSelectElement | null;
        if (el && value !== undefined) {
            customElements.whenDefined('hybrid-select').then(() => {
                el.value = value;
            });
        }
    }, [value]);

    // Handle events from the custom element
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleChange = (e: Event) => {
            const customEvent = e as CustomEvent<{
                value: HybridSelectValue;
                selectedOption: HybridSelectOption | null;
                selectedOptions: HybridSelectOption[];
            }>;
            if (onChange) {
                const detail = customEvent.detail;
                onChange(detail.value, multiple ? detail.selectedOptions : detail.selectedOption);
            }
        };

        const handleOpen = () => {
            if (onOpen) onOpen();
        };

        const handleClose = () => {
            if (onClose) onClose();
        };

        const handleInput = (e: Event) => {
            const customEvent = e as CustomEvent<{ searchValue: string }>;
            if (onInput) onInput(customEvent.detail.searchValue);
        };

        const handleLoad = (e: Event) => {
            const customEvent = e as CustomEvent<{ options: HybridSelectOption[], searchTerm: string }>;
            if (onLoad) onLoad(customEvent.detail.options, customEvent.detail.searchTerm);
        };

        const handleError = (e: Event) => {
            const customEvent = e as CustomEvent<{ error: unknown }>;
            if (onError) onError(customEvent.detail.error);
        };

        const handleCreate = (e: Event) => {
            const customEvent = e as CustomEvent<{ label: string, option: HybridSelectOption }>;
            if (onCreate) onCreate(customEvent.detail.label, customEvent.detail.option);
        };

        el.addEventListener('hybrid-select:change', handleChange);
        el.addEventListener('hybrid-select:open', handleOpen);
        el.addEventListener('hybrid-select:close', handleClose);
        el.addEventListener('hybrid-select:input', handleInput);
        el.addEventListener('hybrid-select:load', handleLoad);
        el.addEventListener('hybrid-select:error', handleError);
        el.addEventListener('hybrid-select:create', handleCreate);

        return () => {
            el.removeEventListener('hybrid-select:change', handleChange);
            el.removeEventListener('hybrid-select:open', handleOpen);
            el.removeEventListener('hybrid-select:close', handleClose);
            el.removeEventListener('hybrid-select:input', handleInput);
            el.removeEventListener('hybrid-select:load', handleLoad);
            el.removeEventListener('hybrid-select:error', handleError);
            el.removeEventListener('hybrid-select:create', handleCreate);
        };
    }, [onChange, onOpen, onClose, onInput, onLoad, onError, onCreate, multiple]);

    // Manually handle theme attributes to ensure they are applied correctly
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (darkMode) {
            el.setAttribute('dark-mode', '');
        } else {
            el.removeAttribute('dark-mode');
        }

        if (lightMode) {
            el.setAttribute('light-mode', '');
        } else {
            el.removeAttribute('light-mode');
        }

        // Handle properties that only have getters in the custom element (name, mode)
        // React tries to set these as properties, which causes a TypeError
        if (name) {
            el.setAttribute('name', name);
        } else {
            el.removeAttribute('name');
        }

        if (mode) {
            el.setAttribute('mode', 'combobox');
        } else {
            el.removeAttribute('mode');
        }
    }, [darkMode, lightMode, name, mode]);

    return React.createElement('hybrid-select', {
        ref,
        id,
        label,
        placeholder,
        required: required ? '' : undefined,
        disabled: disabled ? '' : undefined,
        searchable: searchable ? '' : undefined,
        clearable: clearable ? '' : undefined,
        multiple: multiple ? '' : undefined,
        'allow-create': allowCreate ? '' : undefined,
        'show-recent': showRecent ? '' : undefined,
        'use-fa': use_fa ? false : undefined,
        'data-url': data_url ? '' : undefined,
        'id-field': id_field ? '' : undefined,
        'group-field': group_field ? '' : undefined,
        size: size ? 'lg' : undefined,
        class: className,
        styles
    });
};