'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

interface MultiSelectDropdownProps {
  options: DropdownOption[];
  selectedValues?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  icon?: React.ReactNode;
  name?: string;
  menuHeader?: React.ReactNode;
  safeRefs?: React.RefObject<HTMLElement>[];
  showDone?: boolean;
  onDone?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues = [],
  onChange,
  placeholder = 'Select options',
  disabled = false,
  width,
  icon,
  name,
  menuHeader,
  safeRefs = [],
  showDone = false,
  onDone,
  searchable = false,
  searchPlaceholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, placement: 'bottom' as 'top' | 'bottom' });
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCount = selectedValues.length;
  const labelText = selectedCount === 0 ? placeholder : `${selectedCount} selected`;

  useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const t = e.target as Node;
    const insideDropdown = dropdownRef.current?.contains(t);
    const insideMenu = menuRef.current?.contains(t);
    const insideSafe = (safeRefs || []).some(ref => ref.current?.contains(t));
    if (!insideDropdown && !insideMenu && !insideSafe) setIsOpen(false);
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [safeRefs]);

  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < 250;
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top,
        placement: shouldFlip ? 'top' : 'bottom',
      });
    };
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    left: coords.left,
    width: coords.width,
    ...(coords.placement === 'top' ? { bottom: coords.bottom + 4, top: 'auto' } : { top: coords.top + 4, bottom: 'auto' }),
  };

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange?.(selectedValues.filter((v) => v !== val));
    } else {
      onChange?.([...selectedValues, val]);
    }
  };

  return (
    <div ref={dropdownRef} className="relative" data-name={name}>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`px-3 py-2 text-left border rounded-lg flex items-center justify-between ${width ? width : 'w-full'} ${
          disabled ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed' : 'bg-[#FAF7FF] border-gray-300 text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className={`flex gap-2 items-center ${selectedCount ? 'text-gray-700' : 'text-gray-500'}`}>
          {icon}
          {labelText}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            className="z-[100000] bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
            style={dropdownStyle}
          >
            {(menuHeader || showDone || searchable) && (
              <div className="sticky top-0 z-10 bg-[#FAF7FF] border-b border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  {searchable ? (
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder || 'Search...'}
                      className="flex-1 min-w-0 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                    />
                  ) : <div className="flex-1" />}
                  <div className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap">
                    {menuHeader}
                    {showDone && (
                      <button
                        type="button"
                        onClick={() => { onDone?.(); setIsOpen(false); }}
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {options
              .filter((option) => {
                if (!searchable) return true;
                const q = searchQuery.trim().toLowerCase();
                if (!q) return true;
                const label = typeof option.label === 'string' ? option.label : '';
                return label.toLowerCase().includes(q);
              })
              .map((option) => {
                const checked = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleValue(option.value)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between ${
                      option.disabled ? 'cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    disabled={option.disabled}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="w-4 h-4 text-[#7C3AED] border-gray-300 rounded circle-checkbox"
                      />
                      {option.label}
                    </span>
                  </button>
                );
              })}
          </div>,
          document.body
        )}
    </div>
  );
}