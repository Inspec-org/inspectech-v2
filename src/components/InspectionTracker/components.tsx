import { Edit3, FileText, Filter, Mail, Trash2, X } from 'lucide-react';
import React from 'react'
interface ActionButton {
    icon: React.ReactNode;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'danger';
    onClick: () => void;
}
export const Header: React.FC<{
    title: string;
    description: string;
    onFilterClick: () => void;
    onGenerateReport: () => void;
    onBatchEdit: () => void;
    onSendNotification: () => void;
    onRemoveFromHistory: () => void;
    selectedCount: number;
    onClearSelection: () => void;
    hasActiveFilters: boolean;
    filterCount: number;
}> = ({
    title,
    description,
    onFilterClick,
    onGenerateReport,
    onBatchEdit,
    onSendNotification,
    onRemoveFromHistory,
    selectedCount,
    onClearSelection,
    hasActiveFilters = false,
    filterCount = 0,
}) => {
        return (
            <div className="rounded-lg p-4">
                {/* Title and Description */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    <ActionButton
                        icon={<Filter className="w-4 h-4" />}
                        label={filterCount > 0 ? `Filter (${filterCount})` : "Filter"}
                        variant={hasActiveFilters ? "primary" : "filter"}
                        onClick={onFilterClick}
                    />
                    <ActionButton
                        icon={<FileText className="w-4 h-4" />}
                        label="Generate Report"
                        variant="secondary"
                        onClick={onGenerateReport}
                    />
                    <ActionButton
                        icon={<Edit3 className="w-4 h-4" />}
                        label="Batch Edit"
                        variant="secondary"
                        onClick={onBatchEdit}
                        disabled={selectedCount === 0}
                    />
                    <ActionButton
                        icon={<Mail className="w-4 h-4" />}
                        label="Send Admin Notification"
                        variant="success"
                        onClick={onSendNotification}
                    />
                    <ActionButton
                        icon={<Trash2 className="w-4 h-4" />}
                        label="Remove from Status History"
                        variant="danger"
                        onClick={onRemoveFromHistory}
                    />

                    {selectedCount > 0 && (
                        <SelectionBadge count={selectedCount} onClear={onClearSelection} />
                    )}
                </div>
            </div>
        );
    };

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    variant: 'primary' | 'secondary' | 'success' | 'danger' | 'filter';
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, label, variant, onClick, disabled }) => {
    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300',
        success: 'bg-green-500 text-white hover:bg-green-600',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        filter: 'bg-[#F3EBFF66] text-gray-700 hover:bg-[#F3EBFF] border border-gray-300',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {icon}
            {label}
        </button>
    );
};

// Selection Badge Component
const SelectionBadge: React.FC<{
    count: number;
    onClear: () => void;
}> = ({ count, onClear }) => {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md">
            <span className="text-sm text-gray-700">Vendor + {count} selected</span>
            <button
                onClick={onClear}
                className="text-gray-500 hover:text-gray-700 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};
