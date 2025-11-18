import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Filter } from 'lucide-react';
import { Modal } from '../ui/modal';

// Types
interface FilterOption {
    label: string;
    key: string;
}

interface option {
    id: string;
    label: string;
}

interface filterOptionsMap {
    [key: string]: option[];
}

// Filter options data
export const filterOptions: FilterOption[] = [
    { label: 'Unit ID', key: 'unitId' },
    { label: 'Inspection Status', key: 'inspectionStatus' },
    { label: 'Type', key: 'type' },
    { label: 'Inspector', key: 'inspector' },
    { label: 'Vendor', key: 'vendor' },
    { label: 'Location', key: 'location' },
    { label: 'Duration', key: 'duration' },
    { label: 'Date', key: 'date' },
    { label: 'Delivered', key: 'delivered' },
];

export const unitIdOptions: option[] = [
    { id: '1', label: 'New4' },
    { id: '2', label: 'New_000001A' },
    { id: '3', label: 'New_0001' },
    { id: '4', label: 'New_0002' },
    { id: '5', label: 'New_0003' },
    { id: '6', label: 'New4' },
    { id: '7', label: 'New_000001A' },
    { id: '8', label: 'New_0001' },
    { id: '9', label: 'New_0002' },
];

export const inspectionStatusOptions: option[] = [
    { label: 'COMPLETE', id: '1' },
    { label: 'INCOMPLETE', id: '2' },
    { label: 'NEED REVIEW', id: '3' },
    { label: 'NO INSPECTION (DELIVERED)', id: '4' },
    { label: 'PASS', id: '5' },
];

export const typeOptions: option[] = [
    { label: '53 Foot Trailer', id: '1' },
];

export const inspectorOptions: option[] = [
    { label: 'John Doe', id: '1' },
    { label: 'Jane Doe', id: '2' },
    { label: 'John Smith', id: '3' },
    { label: 'Jane Smith', id: '4' },
];

export const vendorOptions: option[] = [
    { label: 'ABC vencodr', id: '1' },
    { label: 'North Bay', id: '4' },
];

export const locationOptions: option[] = [
    { label: 'North Bay', id: '1' },
    { label: 'South Bay', id: '2' },
    { label: 'East Bay', id: '3' },
    { label: 'West Bay', id: '4' },
];

export const durationOptions: option[] = [
    { label: '10m 0s', id: '1' },
    { label: '12m 0s', id: '2' },
];

export const dateOptions: option[] = [
    { label: '4/20/2024', id: '1' },
    { label: '4/21/2024', id: '2' },
    { label: '4/22/2024', id: '3' },
    { label: '4/23/2024', id: '4' },
];

export const deliveredOptions: option[] = [
    { label: 'Yes', id: '1' },
    { label: 'No', id: '2' },
]

export const filterOptionsMap: filterOptionsMap = {
    unitId: unitIdOptions,
    inspectionStatus: inspectionStatusOptions,
    type: typeOptions,
    inspector: inspectorOptions,
    vendor: vendorOptions,
    location: locationOptions,
    duration: durationOptions,
    date: dateOptions,
    delivered: deliveredOptions
};

// FilterSidebar Component
const FilterSidebar: React.FC<{
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}> = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="w-32 border-r border-gray-200 ">
            <div className="py-4 px-3">
                <p className="text-sm font-medium text-gray-600 mb-3">Filter by</p>
                <div className="space-y-1">
                    {filterOptions.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => onFilterChange(option.key)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${activeFilter === option.key
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

// Main FilterInspections Component
const FilterInspectionsModal: React.FC<{
    onClose: () => void;
    isOpen: boolean;
    onApply: (filters: { [key: string]: string[] }) => void;
    initialFilters: { [key: string]: string[] };
    inspections: { id: string; status: string; type: string; inspector: string; vendor: string; location: string; duration: string; date: string; delivered: string; }[];
}> = ({ onClose, isOpen, onApply, initialFilters, inspections }) => {
    const [activeFilter, setActiveFilter] = useState('unitId');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>(initialFilters);


    useEffect(() => {
        if (isOpen) {
            setSelectedFilters(initialFilters);
        }
    }, [isOpen, initialFilters]);

    const toOptions = (vals: string[]) =>
        Array.from(new Set(vals.filter(Boolean))).map(v => ({ id: v, label: v }));

    const dynamicOptionsMap: { [key: string]: option[] } = useMemo(() => ({
        unitId: toOptions(inspections.map(i => i.id)),
        inspectionStatus: toOptions(inspections.map(i => i.status)),
        type: toOptions(inspections.map(i => i.type)),
        inspector: toOptions(inspections.map(i => i.inspector)),
        vendor: toOptions(inspections.map(i => i.vendor)),
        location: toOptions(inspections.map(i => i.location)),
        duration: toOptions(inspections.map(i => i.duration)),
        date: toOptions(inspections.map(i => i.date)),
        delivered: toOptions(inspections.map(i => i.delivered)),
    }), [inspections]);

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
        onApply(selectedFilters);
    };

    const currentSelectedIds = selectedFilters[activeFilter] || [];
    const currentOptions = dynamicOptionsMap[activeFilter] || [];
    const filteredOptions = currentOptions.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filterLabel = filterOptions.find(f => f.key === activeFilter)?.label || '';
    const totalSelected = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-4 ">
            <div className="flex flex-col h-[90vh] max-h-[70vh]"> {/* give modal a bounded height */}
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Filter Inspections</h2>
                    </div>

                </div>

                {/* Content - note `flex-1 min-h-0` so children can scroll */}
                <div className="flex flex-1 min-h-0 overflow-hidden">
                    <FilterSidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Filter Content Header - fixed height (flex-shrink-0) */}
                        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-gray-700">
                                    Select values for {filterLabel}
                                </h3>
                                <button
                                    onClick={handleAddSelected}
                                    disabled={totalSelected === 0}
                                    className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-md hover:bg-purple-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Add Selected ({totalSelected})
                                </button>
                            </div>
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder={`Search ${filterLabel} values...`}
                            />
                        </div>

                        {/* Scrollable Options List */}
                        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                            {filteredOptions.map((option) => (
                                <CheckboxOption
                                    key={option.id}
                                    id={option.id}
                                    label={option.label}
                                    checked={currentSelectedIds.includes(option.id)}
                                    onChange={handleToggleId}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </Modal>
    );
};

export default FilterInspectionsModal;