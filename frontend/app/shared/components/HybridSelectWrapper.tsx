'use client';
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

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
    selectedOption: HybridSelectOption | HybridSelectOption[] | null;
}

export interface HybridSelectWrapperProps {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    options: HybridSelectOption[];
    value?: HybridSelectValue;
    onBlur?: (value: HybridSelectValue, option: HybridSelectOption | HybridSelectOption[] | null) => void;
    onChange?: (value: HybridSelectValue, option: HybridSelectOption | HybridSelectOption[] | null) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onOpen?: () => void;
    onClose?: () => void;
    onInput?: (searchValue: string) => void;
    onLoad?: (options: HybridSelectOption[], searchTerm: string) => void;
    onError?: (error: unknown) => void;
    onCreate?: (label: string, option: HybridSelectOption) => void;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
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
    
    errorText?: string;
    helperText?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    createText?: string;
    minSearchLength?: number;
    labelField?: string;
    valueField?: string;
    syncGroup?: string;
    dropdownZIndex?: string | number;
    paddingX?: string;
    paddingY?: string;
    gap?: string;
    lineHeight?: string;
    lineHeightItem?: string;
    chevronSeparator?: boolean;
    chevronBorderColor?: string;
    focusBorderColor?: string;
    focusBorderWidth?: string;
    mobileSheet?: boolean;
}

export const HybridSelectWrapper = forwardRef<HybridSelectElement, HybridSelectWrapperProps>((props, forwardedRef) => {
    const innerRef = useRef<HybridSelectElement>(null);
    
    useImperativeHandle(forwardedRef, () => innerRef.current as HybridSelectElement);

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
        onBlur,
        onFocus,
        className, 
        styles,
        label,
        name,
        placeholder,
        required,
        disabled,
        readonly,
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
        size,
        
        errorText,
        helperText,
        emptyText,
        searchPlaceholder,
        createText,
        minSearchLength,
        labelField,
        valueField,
        syncGroup,
        dropdownZIndex,
        paddingX,
        paddingY,
        gap,
        lineHeight,
        lineHeightItem,
        chevronSeparator,
        chevronBorderColor,
        focusBorderColor,
        focusBorderWidth,
        mobileSheet
    } = props;

    const onBlurRef = useRef(onBlur);
    const onChangeRef = useRef(onChange);
    const onFocusRef = useRef(onFocus);
    const onOpenRef = useRef(onOpen);
    const onCloseRef = useRef(onClose);
    const onInputRef = useRef(onInput);
    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    const onCreateRef = useRef(onCreate);

    useEffect(() => {
        onBlurRef.current = onBlur;
        onChangeRef.current = onChange;
        onFocusRef.current = onFocus;
        onOpenRef.current = onOpen;
        onCloseRef.current = onClose;
        onInputRef.current = onInput;
        onLoadRef.current = onLoad;
        onErrorRef.current = onError;
        onCreateRef.current = onCreate;
    });

    useEffect(() => {
        import('@/assets/controls/js/hs/hybrid-select.js');
    }, []);

    useEffect(() => {
        const el = innerRef.current;
        if (el) {
            customElements.whenDefined('hybrid-select').then(() => {
                el.options = options;
                if (value !== undefined) {
                    el.value = value;
                }
            });
        }
    }, [options, value]);

    useEffect(() => {
        const el = innerRef.current;
        if (!el) return;

        const handleChange = (e: Event) => {
            const customEvent = e as CustomEvent<{
                value: HybridSelectValue;
                selectedOption: HybridSelectOption | null;
                selectedOptions: HybridSelectOption[];
            }>;
            if (onChangeRef.current) {
                const detail = customEvent.detail;
                onChangeRef.current(detail.value, multiple ? detail.selectedOptions : detail.selectedOption);
            }
        };

        const handleOpen = () => {
            if (onOpenRef.current) onOpenRef.current();
        };

        const handleClose = () => {
            if (onCloseRef.current) onCloseRef.current();
        };

        const handleInput = (e: Event) => {
            const customEvent = e as CustomEvent<{ searchValue: string }>;
            if (onInputRef.current) onInputRef.current(customEvent.detail.searchValue);
        };

        const handleLoad = (e: Event) => {
            const customEvent = e as CustomEvent<{ options: HybridSelectOption[], searchTerm: string }>;
            if (onLoadRef.current) onLoadRef.current(customEvent.detail.options, customEvent.detail.searchTerm);
        };

        const handleError = (e: Event) => {
            const customEvent = e as CustomEvent<{ error: unknown }>;
            if (onErrorRef.current) onErrorRef.current(customEvent.detail.error);
        };

        const handleCreate = (e: Event) => {
            const customEvent = e as CustomEvent<{ label: string, option: HybridSelectOption }>;
            if (onCreateRef.current) onCreateRef.current(customEvent.detail.label, customEvent.detail.option);
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
    }, [multiple]);

    const handleWrapperFocus = (event: React.FocusEvent<HybridSelectElement>) => {
        const controlDiv = event.currentTarget.shadowRoot?.querySelector('.control');
        controlDiv?.classList.add('focused');
        if (onFocusRef.current) {
            onFocusRef.current(event);
        }
    };

    const handleWrapperBlur = (event: React.FocusEvent<HybridSelectElement>) => {
        const hostElement = event.currentTarget;
        const newlyFocusedElement = event.relatedTarget;

        if (hostElement && !hostElement.contains(newlyFocusedElement as Node)) {
            const controlDiv = hostElement.shadowRoot?.querySelector('.control');
            controlDiv?.classList.remove('focused');

            if (onBlurRef.current) {
                onBlurRef.current(hostElement.value, hostElement.selectedOption);
            }
        }
    };

    useEffect(() => {
        const el = innerRef.current;
        if (!el) return;

        if (darkMode) el.setAttribute('dark-mode', '');
        else el.removeAttribute('dark-mode');

        if (lightMode) el.setAttribute('light-mode', '');
        else el.removeAttribute('light-mode');
        
        if (name) el.setAttribute('name', name);
        else el.removeAttribute('name');

        if (mode) el.setAttribute('mode', mode);
        else el.removeAttribute('mode');

        if (focusBorderColor) {
            el.style.setProperty('--hs-border-focus', focusBorderColor);
        }
        if (focusBorderWidth) {
            el.style.setProperty('--hs-focus-border-width', focusBorderWidth);
        }

    }, [darkMode, lightMode, name, mode, focusBorderColor, focusBorderWidth]);

    return React.createElement('hybrid-select', {
        ref: innerRef,
        id,
        label,
        placeholder,
        onFocus: handleWrapperFocus,
        onBlur: handleWrapperBlur,
        required: required ? '' : undefined,
        disabled: disabled ? '' : undefined,
        readonly: readonly ? '' : undefined,
        searchable: searchable ? '' : undefined,
        clearable: clearable ? '' : undefined,
        multiple: multiple ? '' : undefined,
        'allow-create': allowCreate ? '' : undefined,
        'show-recent': showRecent ? '' : undefined,
        'use-fa': use_fa ? '' : undefined,
        'data-url': data_url,
        'id-field': id_field,
        'group-field': group_field,
        size: size,
        class: className,
        styles,
        
        error: errorText,
        helper: helperText,
        'empty-text': emptyText,
        'search-placeholder': searchPlaceholder,
        'create-text': createText,
        'min-search-length': minSearchLength,
        'label-field': labelField,
        'value-field': valueField,
        'sync-group': syncGroup,
        'dropdown-z-index': dropdownZIndex,
        'padding-x': paddingX,
        'padding-y': paddingY,
        gap: gap,
        'line-height': lineHeight,
        'line-height-item': lineHeightItem,
        'chevron-separator': chevronSeparator ? '' : undefined,
        'chevron-border-color': chevronBorderColor,
        'focus-border-color': focusBorderColor,
        'focus-border-width': focusBorderWidth,
        mobileSheet: mobileSheet ? '' : undefined
    });
});

HybridSelectWrapper.displayName = 'HybridSelectWrapper';