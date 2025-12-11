'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

export const ReportDropdown: React.FC<CustomDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    disabled = false,
    width
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, placement: 'bottom' });

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const updatePosition = () => {
            if (isOpen && dropdownRef.current) {
                const rect = dropdownRef.current.getBoundingClientRect();
                const spaceBelow = window.innerHeight - rect.bottom;
                const shouldFlip = spaceBelow < 250;

                setCoords({
                    top: rect.bottom,
                    left: rect.left,
                    width: rect.width,
                    bottom: window.innerHeight - rect.top,
                    placement: shouldFlip ? 'top' : 'bottom'
                });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        
        if (isOpen) {
            window.addEventListener('scroll', updatePosition, { capture: true });
            window.addEventListener('resize', updatePosition);
            updatePosition();
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, { capture: true });
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange?.(optionValue);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        if (disabled) return;
        
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const shouldFlip = spaceBelow < 250;

            setCoords({
                top: rect.bottom,
                left: rect.left,
                width: rect.width,
                bottom: window.innerHeight - rect.top,
                placement: shouldFlip ? 'top' : 'bottom'
            });
        }
        setIsOpen(!isOpen);
    };

    const dropdownStyle: React.CSSProperties = {
        position: 'fixed',
        left: coords.left,
        width: width || coords.width,
        zIndex: 9999,
        ...(coords.placement === 'top' 
            ? { bottom: coords.bottom + 4, top: 'auto' } 
            : { top: coords.top + 4, bottom: 'auto' }
        )
    };

    return (
        <div ref={dropdownRef} className="relative"> {/* Add 'relative' here */}
            <button
                type="button"
                disabled={disabled}
                onClick={toggleDropdown}
                style={width ? { width } : undefined}
                className={`px-3 py-2 text-left rounded-lg flex items-center justify-between ${width ? '' : 'w-full'
                    } ${disabled
                        ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed'
                        : ' text-gray-700 hover:border-gray-400'
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

            {isOpen && !disabled && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[9999] mt-1 bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                    style={dropdownStyle}
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
                </div>,
                document.body
            )}
        </div>
    );
};