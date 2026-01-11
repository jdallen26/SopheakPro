'use client';
import React, { useEffect, useRef } from 'react';

interface HybridInputElement extends HTMLElement {
    value: string;
}

interface HybridInputWrapperProps {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
    onInput?: (value: string) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    type?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    pattern?: string;
    maxlength?: number;
    minlength?: number;
    size?: string;
    helper?: string;
    error?: string;
    prependIcon?: string;
    appendIcon?: string;
    clearable?: boolean;
    loading?: boolean;
    autofocus?: boolean;
    darkMode?: boolean;
    lightMode?: boolean;
    use_fa?: boolean;
    className?: string;
    style?: React.CSSProperties;
    multiple?: boolean;
    separator?: string;
    prefix?: string;
    suffix?: string;
    showCounter?: boolean;
    allowCreate?: boolean;
    validateOnBlur?: boolean;
    validateOnInput?: boolean;
    inputMode?: string;
    autocomplete?: string;
    dataUrl?: string;
    minSearchLength?: number;
    focusBorderColor?: string;
    focusBorderWidth?: string;
}

export const HybridInputWrapper: React.FC<HybridInputWrapperProps> = (props) => {
    const ref = useRef<HTMLElement>(null);
    const { 
        id,
        name,
        label,
        placeholder,
        value,
        onChange,
        onInput,
        onBlur,
        onFocus,
        required,
        disabled,
        readonly,
        type,
        min,
        max,
        step,
        pattern,
        maxlength,
        minlength,
        size,
        helper,
        error,
        prependIcon,
        appendIcon,
        clearable,
        loading,
        autofocus,
        darkMode,
        lightMode,
        use_fa,
        className,
        style,
        multiple,
        separator,
        prefix,
        suffix,
        showCounter,
        allowCreate,
        validateOnBlur,
        validateOnInput,
        inputMode,
        autocomplete,
        dataUrl,
        minSearchLength,
        focusBorderColor,
        focusBorderWidth
    } = props;

    const onChangeRef = useRef(onChange);
    const onInputRef = useRef(onInput);
    const onBlurRef = useRef(onBlur);
    const onFocusRef = useRef(onFocus);

    useEffect(() => {
        onChangeRef.current = onChange;
        onInputRef.current = onInput;
        onBlurRef.current = onBlur;
        onFocusRef.current = onFocus;
    });

    useEffect(() => {
        import('@/assets/controls/js/hs/hybrid-input.js');
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleInput = (e: Event) => {
            const customEvent = e as CustomEvent<{ value: string }>;
            const newValue = customEvent.detail.value;
            
            if (onChangeRef.current) {
                onChangeRef.current(newValue);
            }
            if (onInputRef.current) {
                onInputRef.current(newValue);
            }
        };

        el.addEventListener('hybrid-input:input', handleInput);

        return () => {
            el.removeEventListener('hybrid-input:input', handleInput);
        };
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        if (darkMode) el.setAttribute('dark-mode', '');
        else el.removeAttribute('dark-mode');

        if (lightMode) el.setAttribute('light-mode', '');
        else el.removeAttribute('light-mode');

        if (focusBorderColor) {
            el.style.setProperty('--hi-border-focus', focusBorderColor);
        }
        if (focusBorderWidth) {
            el.style.setProperty('--hi-focus-border-width', focusBorderWidth);
        }

    }, [darkMode, lightMode, focusBorderColor, focusBorderWidth]);

    const handleWrapperFocus = (event: React.FocusEvent<HTMLElement>) => {
        if (onFocusRef.current) {
            onFocusRef.current(event);
        }
    };

    const handleWrapperBlur = (event: React.FocusEvent<HTMLElement>) => {
        const hostElement = event.currentTarget;
        const newlyFocusedElement = event.relatedTarget;

        if (hostElement && !hostElement.contains(newlyFocusedElement as Node)) {
            if (onBlurRef.current) {
                onBlurRef.current(event);
            }
        }
    };

    return React.createElement('hybrid-input', {
        ref,
        id,
        name,
        label,
        placeholder,
        value,
        onFocus: handleWrapperFocus,
        onBlur: handleWrapperBlur,
        type,
        min,
        max,
        step,
        pattern,
        maxlength,
        minlength,
        helper,
        error,
        'prepend-icon': prependIcon,
        'append-icon': appendIcon,
        required: required ? '' : undefined,
        disabled: disabled ? '' : undefined,
        readonly: readonly ? '' : undefined,
        clearable: clearable ? '' : undefined,
        loading: loading ? '' : undefined,
        autofocus: autofocus ? '' : undefined,
        'use-fa': use_fa ? '' : undefined,
        size: size,
        class: className,
        style,
        multiple: multiple ? '' : undefined,
        separator,
        prefix,
        suffix,
        'show-counter': showCounter ? '' : undefined,
        'allow-create': allowCreate ? '' : undefined,
        'validate-on-blur': validateOnBlur ? '' : undefined,
        'validate-on-input': validateOnInput ? '' : undefined,
        'input-mode': inputMode,
        autocomplete,
        'data-url': dataUrl,
        'min-search-length': minSearchLength
    });
};