'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DropdownOption {
  value: string;
  label: string | React.ReactNode;
  disabled?: boolean;
}

interface ModalDropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  icon?: React.ReactNode;
}

export const ModalDropdown: React.FC<ModalDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  disabled = false,
  width,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyles, setMenuStyles] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDropdown = dropdownRef.current?.contains(target);
      const clickedInsideMenu = menuRef.current?.contains(target);
      if (!clickedInsideDropdown && !clickedInsideMenu) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyles({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
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

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen((prev) => !prev);
        }}
        className={`px-3 py-2 text-left border rounded-lg flex items-center justify-between ${
          width ? width : 'w-full'
        } ${
          disabled
            ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
            : 'bg-[#FAF7FF] border-gray-300 text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className={`flex gap-2 items-center ${selectedOption ? 'text-gray-700' : 'text-gray-500'}`}>
          {icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={menuRef}
            className={`z-[100000] bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto ${
              width ? width : 'w-full'
            }`}
            style={{ position: 'fixed', top: menuStyles.top, left: menuStyles.left, width: menuStyles.width }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between ${
                  option.disabled ? 'cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-700'
                }`}
                disabled={option.disabled}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={16} className="text-purple-600" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}