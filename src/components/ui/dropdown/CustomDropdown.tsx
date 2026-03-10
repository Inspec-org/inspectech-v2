'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface DropdownOption {
    value: string;
    label: string | React.ReactNode; // Change this
    disabled?: boolean
}

interface CustomDropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    width?: string
    icon?: React.ReactNode
    name?: string
    placement?: 'top' | 'bottom'
    searchable?: boolean
    searchPlaceholder?: string
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    disabled = false,
    width,
    icon,
    name,
    placement = 'bottom',
    searchable = false,
    searchPlaceholder = 'Search...'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState('');

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
        <div ref={dropdownRef} className="relative" data-name={name}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={width ? { width } : undefined}
                className={`px-3 py-2 text-left border rounded-lg flex items-center justify-between ${width ? width : 'w-full'
                    } ${disabled
                        ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                        : 'bg-[#FAF7FF] border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
            >
                <span className={`flex gap-2 items-center ${selectedOption ? 'text-gray-700' : 'text-gray-500'}`}>
                    {icon}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && !disabled && (
                <div
                    className={`absolute z-50 ${placement === 'top' ? 'bottom-full mb-1' : 'mt-1'} bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto ${width ? width : 'w-full'
                        }`}
                    style={width ? { width } : undefined}
                >
                    {searchable && (
                        <div className="sticky top-0 z-10 bg-[#FAF7FF] border-b border-gray-200 px-3 py-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder || 'Search...'}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                            />
                        </div>
                    )}
                    {(() => {
                        const filtered = options.filter((option) => {
                            if (!searchable) return true;
                            const q = searchQuery.trim().toLowerCase();
                            if (!q) return true;
                            const label = typeof option.label === 'string' ? option.label : '';
                            return label.toLowerCase().includes(q);
                        });

                        if (searchable && searchQuery.trim() && filtered.length === 0) {
                            return (
                                <div className="px-3 py-3 text-sm text-gray-500 text-center">No data</div>
                            );
                        }

                        return filtered.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-3 py-2 text-left  flex items-center  justify-between ${option.disabled ? 'cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-700'}`}
                                disabled={option.disabled}
                            >
                                <span className="">{option.label}</span>
                                {value === option.value && (
                                    <Check size={16} className="text-purple-600" />
                                )}
                            </button>
                        ));
                    })()}
                </div>
            )}
        </div>
    );
};