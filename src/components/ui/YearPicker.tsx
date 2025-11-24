import { useState, useRef, useEffect } from 'react';

interface YearPickerProps {
    value: string;
    onChange: (year: string) => void;
    minYear?: number;
    maxYear?: number;
}

const YearPicker: React.FC<YearPickerProps> = ({ 
    value, 
    onChange, 
    minYear = 1980, 
    maxYear = new Date().getFullYear() 
}) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [displayYears, setDisplayYears] = useState<number[]>([]);
    const [startYear, setStartYear] = useState<number>(maxYear - 11);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const years = Array.from({ length: 12 }, (_, i) => startYear + i).filter(
            year => year >= minYear && year <= maxYear
        );
        setDisplayYears(years);
    }, [startYear, minYear, maxYear]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrevious = (): void => {
        setStartYear(prev => Math.max(minYear, prev - 12));
    };

    const handleNext = (): void => {
        setStartYear(prev => Math.min(maxYear - 11, prev + 12));
    };

    return (
        <div className="relative" ref={ref}>
            <input
                type="text"
                value={value || ''}
                readOnly
                onClick={() => setIsOpen(!isOpen)}
                placeholder="Select year"
                className="w-full xl:w-[230px] bg-[#FAF7FF] border border-gray-300 rounded-lg px-3 py-2 text-gray-700 cursor-pointer"
            />
            
            {isOpen && (
                <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-[230px]">
                    <div className="flex justify-between items-center mb-3">
                        <button
                            type="button"
                            onClick={handlePrevious}
                            disabled={startYear <= minYear}
                            className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ◀
                        </button>
                        <span className="font-medium text-gray-700">
                            {displayYears[0]} - {displayYears[displayYears.length - 1]}
                        </span>
                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={startYear + 12 > maxYear}
                            className="px-2 py-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ▶
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                        {displayYears.map(year => (
                            <button
                                key={year}
                                type="button"
                                onClick={() => {
                                    onChange(year.toString());
                                    setIsOpen(false);
                                }}
                                className={`px-3 py-2 rounded hover:bg-blue-100 transition-colors ${
                                    value === year.toString()
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-50 text-gray-700'
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default YearPicker;