'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, List, ArrowDownFromLine, ChevronsDown, MoreHorizontal } from 'lucide-react';

interface ComboBoxProps {
  id: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  fontSize?: string;
  allowCustomInput?: boolean;
  icon?: 'arrow-down' | 'list-bullet' | 'bars-arrow-down' | 'chevron-double-down' | 'ellipsis-horizontal';
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
}

const ComboBox: React.FC<ComboBoxProps> = ({ id, options, value, onChange, onBlur, fontSize, allowCustomInput = true, icon = 'arrow-down', iconClassName, iconStyle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const dropdown = document.getElementById(id);
        if (dropdown && dropdown.contains(event.target as Node)) {
            return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [id]);

  // Recalculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text); // Directly update parent state

    if (text) {
        setFilteredOptions(options.filter(option => option.label.toLowerCase().includes(text.toLowerCase())));
    } else {
        setFilteredOptions(options);
    }
    if (!isOpen) {
        setIsOpen(true);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setFilteredOptions(options);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (!allowCustomInput) {
        const isValid = options.some(opt => opt.label === value);
        if (!isValid) {
          onChange('');
        }
      }
      setIsOpen(false);
      if (onBlur) {
        onBlur();
      }
    }
  };

  const renderIcon = () => {
    let defaultStyle: React.CSSProperties = {};
    let iconElement: React.ReactNode;

    switch (icon) {
      case 'list-bullet':
        defaultStyle = { marginRight: '2px' };
        iconElement = <List size={13} />;
        break;
      case 'bars-arrow-down':
        defaultStyle = { padding: '1px' };
        iconElement = <ArrowDownFromLine size={16} />;
        break;
      case 'chevron-double-down':
        defaultStyle = { margin: '1px' };
        iconElement = <ChevronsDown size={16} />;
        break;
      case 'ellipsis-horizontal':
        defaultStyle = { marginLeft: '2px', marginRight: '2px' };
        iconElement = <MoreHorizontal size={16} />;
        break;
      case 'arrow-down':
      default:
        defaultStyle = {};
        iconElement = <ChevronDown size={16} />;
        break;
    }

    const finalStyle = { ...defaultStyle, ...iconStyle };

    return <span style={finalStyle}>{iconElement}</span>;
  };

  const dropdownContent = (
    <ul
      id={id}
      className="fixed z-[9999] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-b-md shadow-lg max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top - 1,
        left: dropdownPosition.left,
        minWidth: dropdownPosition.width,
        fontSize: fontSize,
        paddingLeft: '2px',
        paddingRight: '2px',
        paddingTop: '1px',
        paddingBottom: '1px',
        border: '1px solid var(--border-color)',
      }}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map(option => (
          <li
            key={option.value}
            onClick={() => handleOptionClick(option.label)}
            className="p-2 cursor-pointer hover:bg-[var(--hover-bg)] text-[var(--foreground)] rounded-sm"
            style={{
                paddingLeft: '2px'
            }}
          >
            {option.label || '\u00A0'}
          </li>
        ))
      ) : (
        <li className="p-2 text-gray-500">No options found</li>
      )}
    </ul>
  );

  return (
    <div className="relative" ref={containerRef} onBlur={handleBlur}>
      <div className="flex items-center">
        <input
          type="text"
          value={value} // Use value for a fully controlled component
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="w-full bg-transparent p-1"
          style={{
            background: 'var(--background-tertiary)',
            color: 'var(--foreground)',
            border: '1px solid var(--border-color)',
            fontSize: fontSize,
            paddingLeft: '3px',
            paddingRight: '20px',
          }}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute right-0 top-0 h-full px-2 ${iconClassName || ''}`}
          style={{borderLeft: '1px solid var(--border-color)', width: '1rem', marginRight: '2px'}}
        >
          {renderIcon()}
        </button>
      </div>
      {isOpen && typeof document !== 'undefined' && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default ComboBox;
