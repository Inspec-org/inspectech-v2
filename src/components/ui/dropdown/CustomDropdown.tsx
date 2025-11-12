'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface DropdownOption {
    value: string;
    label: string;
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    width?: string
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    disabled = false,
    width
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange?.(optionValue);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className="relative ">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ width: width }}
                className={`px-3 py-2 text-left border rounded-lg flex items-center justify-between ${disabled
                    ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                    : 'bg-[#FAF7FF] border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
            >
                <span className={selectedOption ? 'text-gray-700' : 'text-gray-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && !disabled && (
                <div
                    className="absolute z-50 mt-1 bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                    style={{ width: width }}
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleSelect(option.value)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                            <span className="text-gray-700">{option.label}</span>
                            {value === option.value && (
                                <Check size={16} className="text-purple-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};