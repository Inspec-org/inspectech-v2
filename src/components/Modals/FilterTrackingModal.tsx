import React, { useEffect, useMemo, useState } from 'react';
import { Filter } from 'lucide-react';
import { Modal } from '../ui/modal';
import DatePickerDropdown from '../ui/dropdown/DatePickerDropdown';

// Types
interface FilterOption {
    label: string;
    key: string;
}

interface option {
    id: string;
    label: string;
}

// Filter options for Tracking Inspections
export const trackingFilterOptions: FilterOption[] = [
    { label: 'Unit ID', key: 'unitId' },
    { label: 'Inspection Status', key: 'inspectionStatus' },
    { label: 'Vendor', key: 'vendor' },
    { label: 'Department', key: 'department' },
    { label: 'Date Created', key: 'dateCreated' },
    { label: 'Review Requested', key: 'reviewRequested' },
    { label: 'Missing Data', key: 'missingData' },
    { label: 'Review Completed', key: 'reviewCompleted' },
    { label: 'Email Notification', key: 'emailNotification' },
];

// FilterSidebar Component
const FilterSidebar: React.FC<{
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}> = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="w-32 border-r border-gray-200">
            <div className="py-4 px-3">
                <p className="text-sm font-medium text-gray-600 mb-3">Filter by</p>
                <div className="space-y-1">
                    {trackingFilterOptions.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => onFilterChange(option.key)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                                activeFilter === option.key
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// SearchInput Component
const SearchInput: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}> = ({ value, onChange, placeholder }) => {
    return (
        <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
    );
};

// CheckboxOption Component
const CheckboxOption: React.FC<{
    id: string;
    label: string;
    checked: boolean;
    onChange: (id: string) => void;
}> = ({ id, label, checked, onChange }) => {
    return (
        <label className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded transition-colors">
            <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(id)}
                className="circle-checkbox"
            />
            <span className="ml-3 text-sm text-gray-700">{label}</span>
        </label>
    );
};

// Main FilterTrackingModal Component
const FilterTrackingModal: React.FC<{
    onClose: () => void;
    isOpen: boolean;
    onApply: (filters: { [key: string]: string[] }) => void;
    initialFilters: { [key: string]: string[] };
    trackingData: {
        id: string;
        status: string;
        vendor: string;
        department: string;
        date_created: string;
        review_requested: string;
        missing_data: string;
        review_completed: string;
        email_notifcation: string;
    }[];
    vendors: { _id: string; name: string }[];
    departments: { _id: string; name: string }[];
    fullOptions?: { [key: string]: string[] };
}> = ({ onClose, isOpen, onApply, initialFilters, trackingData, vendors, departments, fullOptions }) => {
    const [activeFilter, setActiveFilter] = useState('unitId');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>(initialFilters);
    const isDateFilter = ['dateCreated', 'reviewRequested', 'reviewCompleted'].includes(activeFilter);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setSelectedFilters(initialFilters);
        }
    }, [isOpen, initialFilters]);

    useEffect(() => {
        if (isDateFilter) {
            const current = selectedFilters[activeFilter] || [];
            setStartDate(current[0] || '');
            setEndDate(current[1] || '');
        } else {
            setStartDate('');
            setEndDate('');
        }
    }, [activeFilter, isDateFilter, selectedFilters]);

    const toOptions = (vals: string[]) =>
        Array.from(new Set(vals.filter(Boolean))).map(v => ({ id: v, label: v }));

    const dynamicOptionsMap: { [key: string]: option[] } = useMemo(() => ({
        unitId: (fullOptions?.unitId || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.id)),
        inspectionStatus: (fullOptions?.inspectionStatus || []).map(v => ({ id: v, label: v.toUpperCase() })) || toOptions(trackingData.map(i => i.status.toUpperCase())),
        vendor: Array.from(new Set(vendors.map(v => v.name))).map(n => ({ id: n, label: n })),
        department: Array.from(new Set(departments.map(d => d.name))).map(n => ({ id: n, label: n })),
        dateCreated: (fullOptions?.dateCreated || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.date_created)),
        reviewRequested: (fullOptions?.reviewRequested || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.review_requested)),
        missingData: (fullOptions?.missingData || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.missing_data)),
        reviewCompleted: (fullOptions?.reviewCompleted || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.review_completed)),
        emailNotification: (fullOptions?.emailNotification || []).map(v => ({ id: v, label: v })) || toOptions(trackingData.map(i => i.email_notifcation)),
    }), [trackingData, vendors, departments, fullOptions]);

    const handleToggleId = (id: string) => {
        setSelectedFilters(prev => {
            const current = prev[activeFilter] || [];
            const updated = current.includes(id)
                ? current.filter(i => i !== id)
                : [...current, id];

            return {
                ...prev,
                [activeFilter]: updated
            };
        });
    };

    const handleAddSelected = () => {
        if (isDateFilter) {
            if (!startDate || !endDate) return;
            const next = { ...selectedFilters, [activeFilter]: [startDate, endDate] };
            onApply(next);
            return;
        }
        onApply(selectedFilters);
    };

    const currentSelectedIds = selectedFilters[activeFilter] || [];
    const currentOptions = dynamicOptionsMap[activeFilter] || [];
    const filteredOptions = currentOptions.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filterLabel = trackingFilterOptions.find(f => f.key === activeFilter)?.label || '';
    const totalSelected = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-4">
            <div className="flex flex-col h-[90vh] max-h-[70vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Filter Tracking Inspections</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <FilterSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Filter Content Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Select values for {filterLabel}
                                </h3>
                                <button
                                    onClick={handleAddSelected}
                                    disabled={isDateFilter ? !(startDate && endDate) : totalSelected === 0}
                                    className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Add Selected ({isDateFilter ? ((startDate && endDate) ? 1 : 0) : totalSelected})
                                </button>
                            </div>
                            {!isDateFilter && (
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder={`Search ${filterLabel} values...`}
                                />
                            )}
                        </div>

                        {/* Scrollable Options List */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                            {isDateFilter ? (
                                <div className="space-y-4 px-3 py-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">From</p>
                                            <DatePickerDropdown value={startDate} onChange={(v) => setStartDate(v)} placeholder="Select date" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700 mb-2">To</p>
                                            <DatePickerDropdown value={endDate} onChange={(v) => setEndDate(v)} placeholder="Select date" min={startDate || undefined} />
                                        </div>
                                    </div>
                                </div>
                            ) : ((["unitId", "vendor", "department"].includes(activeFilter) && searchQuery.trim().length < 2) ? (
                                <p className="text-sm text-gray-500 px-3 py-2">write atleast 2 letters to search {activeFilter === 'unitId' ? 'ids' : activeFilter === 'vendor' ? 'vendors' : 'departments'}</p>
                            ) : (
                                (searchQuery.trim() && filteredOptions.length === 0) ? (
                                    <p className="text-sm text-gray-500 px-3 py-2">No matching {filterLabel.toLowerCase()} found for "{searchQuery}"</p>
                                ) : (
                                    filteredOptions.map((option) => (
                                        <CheckboxOption
                                            key={option.id}
                                            id={option.id}
                                            label={option.label}
                                            checked={currentSelectedIds.includes(option.id)}
                                            onChange={handleToggleId}
                                        />
                                    ))
                                )
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FilterTrackingModal;