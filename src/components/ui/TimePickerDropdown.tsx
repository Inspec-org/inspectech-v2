import React, { useEffect, useRef } from 'react';

type TimePickerProps = {
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void; // Add this
    hour: string;
    minute: string;
    period: 'AM' | 'PM';
    onTimeChange: (hour: string, minute: string, period: 'AM' | 'PM') => void;
    label: string;
};

export const TimePickerDropdown: React.FC<TimePickerProps> = ({
    isOpen,
    onClose,
    onOpen, // Add this
    hour,
    minute,
    period,
    onTimeChange,
    label
}) => {
    const [tempHour, setTempHour] = React.useState(hour);
    const [tempMinute, setTempMinute] = React.useState(minute);
    const [tempPeriod, setTempPeriod] = React.useState(period);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const hours = React.useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), []);
    const minutes = React.useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    useEffect(() => {
        setTempHour(hour);
        setTempMinute(minute);
        setTempPeriod(period);
    }, [hour, minute, period, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const handleSet = () => {
        onTimeChange(tempHour, tempMinute, tempPeriod);
        onClose();
    };

    return (
        <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-2">
                {label}
            </label>
            <div className="relative w-full" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => !isOpen ? onOpen() : onClose()}
                    className="px-3 py-2 text-left border rounded-lg bg-[#FAF7FF] border-gray-300 text-gray-700 hover:border-gray-400 w-full"
                >
                    {`${hour}:${minute} ${period}`}
                </button>
                {isOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-[#FAF7FF] border border-gray-200 rounded-xl shadow-lg p-4">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {hours.map((h) => (
                                    <button
                                        type="button"
                                        key={h}
                                        onClick={() => setTempHour(h)}
                                        className={tempHour === h ? "w-full text-left px-3 py-2 bg-[#F0F7FF] text-[#3EA4F6] text-sm" : "w-full text-left px-3 py-2 text-sm"}
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {minutes.map((m) => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setTempMinute(m)}
                                        className={tempMinute === m ? "w-full text-left px-3 py-2 bg-[#F0F7FF] text-[#3EA4F6] text-sm" : "w-full text-left px-3 py-2 text-sm"}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {["AM", "PM"].map((p) => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setTempPeriod(p as "AM" | "PM")}
                                        className={tempPeriod === p ? "w-full text-left px-3 py-2 bg-[#F0F7FF] text-[#3EA4F6] text-sm" : "w-full text-left px-3 py-2 text-sm"}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSet}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};