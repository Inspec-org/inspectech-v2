import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { TimePickerDropdown } from '../ui/TimePickerDropdown';
import Swal from "sweetalert2"
import { ModalDropdown } from '../ui/dropdown/ModalDropdown';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
    selectedUnitIds?: string[]; // Add this
    allInspections?: any[]; // Add this to receive full inspection data
};

const AdminNotificationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onUpdated,
    selectedUnitIds = [], // Add default
    allInspections = [],
}) => {

    const [activeTab, setActiveTab] = useState<'send' | 'auto'>(selectedUnitIds.length > 0 ? 'send' : 'auto');
    const [emailRecipients, setEmailRecipients] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState('');
    const isSendTabDisabled = selectedUnitIds.length === 0;

    const [configurations, setConfigurations] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [isCreatingConfig, setIsCreatingConfig] = useState(false);
    const [configName, setConfigName] = useState('');
    const [autoEmailRecipients, setAutoEmailRecipients] = useState('');
    const [isAutoEnabled, setIsAutoEnabled] = useState(false);
    const [frequency, setFrequency] = useState('Daily');
    const [timesPerDay, setTimesPerDay] = useState('Once per day');
    const [firstSendHour, setFirstSendHour] = useState('04');
    const [firstSendMinute, setFirstSendMinute] = useState('16');
    const [firstSendPeriod, setFirstSendPeriod] = useState('PM');
    const [secondSendHour, setSecondSendHour] = useState('04');
    const [secondSendMinute, setSecondSendMinute] = useState('26');
    const [secondSendPeriod, setSecondSendPeriod] = useState('PM');
    const [thirdSendHour, setThirdSendHour] = useState('04');
    const [thirdSendMinute, setThirdSendMinute] = useState('36');
    const [thirdSendPeriod, setThirdSendPeriod] = useState('PM');
    const [isFirstTimeOpen, setIsFirstTimeOpen] = useState(false);
    const [isSecondTimeOpen, setIsSecondTimeOpen] = useState(false);
    const [isThirdTimeOpen, setIsThirdTimeOpen] = useState(false);
    const [availableVendors, setAvailableVendors] = useState<any[]>([]);
    const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['NEED REVIEW', 'COMPLETE', 'FAIL', 'INCOMPLETE', 'OUT OF CYCLE (DELIVERED)']);
    const [isSavingConfig, setIsSavingConfig] = useState(false);
    const [initialConfigPayload, setInitialConfigPayload] = useState<any | null>(null);
    const currentConfigPayload = React.useMemo(() => ({
        name: configName || '',
        isAutoEnabled,
        frequency,
        timesPerDay,
        times: timesPerDay === 'Once per day'
            ? [{ hour: firstSendHour, minute: firstSendMinute, period: firstSendPeriod }]
            : [
                { hour: firstSendHour, minute: firstSendMinute, period: firstSendPeriod },
                { hour: secondSendHour, minute: secondSendMinute, period: secondSendPeriod },
            ],
        recipients: autoEmailRecipients.split(',').map(s => s.trim()).filter(Boolean),
        vendors: selectedVendors,
        statuses: selectedStatuses,
    }), [configName, isAutoEnabled, frequency, timesPerDay, firstSendHour, firstSendMinute, firstSendPeriod, secondSendHour, secondSendMinute, secondSendPeriod, autoEmailRecipients, selectedVendors, selectedStatuses]);
    const isDirty = React.useMemo(() => {
        if (!selectedConfig) return true;
        if (!initialConfigPayload) return false;
        return JSON.stringify(currentConfigPayload) !== JSON.stringify(initialConfigPayload);
    }, [selectedConfig, currentConfigPayload, initialConfigPayload]);

    const startResult = (currentPage - 1) * rowsPerPage + 1;


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUnits(prev => Array.from(new Set([...prev, ...paginatedInspections.map(i => i.id)])));
        } else {
            setSelectedUnits(prev => prev.filter(id => !paginatedInspections.some(i => i.id === id)));
        }
    };

    const handleSelectUnit = (id: string) => {
        setSelectedUnits(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };
    const filteredInspections = React.useMemo(() => {
        let filtered = selectedUnitIds.length > 0
            ? allInspections.filter(insp => selectedUnitIds.includes(insp.id))
            : [];
        if (searchQuery.trim()) {
            filtered = filtered.filter(insp =>
                String(insp.id).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return filtered;
    }, [selectedUnitIds, allInspections, searchQuery]);

    const paginatedInspections = React.useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        return filteredInspections.slice(startIndex, endIndex);
    }, [filteredInspections, currentPage, rowsPerPage]);

    useEffect(() => {
        if (isOpen && selectedUnitIds.length > 0) {
            setSelectedUnits(selectedUnitIds);
            setCurrentPage(1); // Reset to first page
        }
    }, [isOpen, selectedUnitIds]);

    useEffect(() => {
        if (isSendTabDisabled && activeTab === 'send') {
            setActiveTab('auto');
        }
    }, [isSendTabDisabled, activeTab]);

    const totalResults = filteredInspections.length;
    const endResult = Math.min(currentPage * rowsPerPage, totalResults);
    const totalPages = Math.ceil(totalResults / rowsPerPage);

    const handleSendNow = async () => {
        if (selectedUnits.length === 0) {
            toast.error('Please select at least one inspection');
            return;
        }
        const recipients = emailRecipients.split(',').map(s => s.trim()).filter(Boolean);
        if (recipients.length === 0) {
            toast.error('Please enter at least one email recipient');
            return;
        }
        setSending(true);
        setSendError('');
        try {
            const vendorName = Cookies.get('selectedVendor') || '';
            const vendorId = Cookies.get('selectedVendorId') || '';
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            const res = await apiRequest('/api/admin-notification/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients, unitIds: selectedUnits, vendorName, vendorId, departmentId })
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to send email');
            toast.success('Notification sent');
            setSelectedUnits([]);
            setEmailRecipients('');
            if (onUpdated) onUpdated();
            onClose();
        } catch (e: any) {
            setSendError(e?.message || 'Error sending notification');
            toast.error(e?.message || 'Error sending notification');
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        if (!isOpen) { setSelectedConfig(''); setIsCreatingConfig(false); }
    }, [isOpen]);

    useEffect(() => {
        const loadConfigs = async () => {
            try {
                const res = await apiRequest('/api/admin-notification/configurations');
                const json = await res.json();
                if (res.ok && json.success) setConfigurations(json.configurations || []);
            } catch { }
        };
        if (isOpen && activeTab === 'auto') loadConfigs();
    }, [isOpen, activeTab]);

    useEffect(() => {
        const loadVendors = async () => {
            try {
                const vRes = await apiRequest('/api/vendors/get-vendors');
                const j = await vRes.json();
                if (vRes.ok) setAvailableVendors(j.vendors || []);
            } catch { }
        };
        if (isOpen && activeTab === 'auto') loadVendors();
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (!selectedConfig) return;
        const cfg = configurations.find((c: any) => c._id === selectedConfig);
        if (!cfg) return;
        setConfigName(cfg.name || '');
        setIsAutoEnabled(!!cfg.isAutoEnabled);
        setFrequency(cfg.frequency || 'Daily');
        setTimesPerDay(cfg.timesPerDay || 'Once per day');
        const t = cfg.times || [];
        const f = t[0] || {};
        setFirstSendHour(f.hour || firstSendHour);
        setFirstSendMinute(f.minute || firstSendMinute);
        setFirstSendPeriod(f.period || firstSendPeriod);
        const s = t[1] || {};
        setSecondSendHour(s.hour || secondSendHour);
        setSecondSendMinute(s.minute || secondSendMinute);
        setSecondSendPeriod(s.period || secondSendPeriod);
        setAutoEmailRecipients((cfg.recipients || []).join(','));
        setSelectedVendors(cfg.vendors || []);
        setSelectedStatuses(cfg.statuses || []);
        setInitialConfigPayload({
            name: cfg.name || '',
            isAutoEnabled: !!cfg.isAutoEnabled,
            frequency: cfg.frequency || 'Daily',
            timesPerDay: cfg.timesPerDay || 'Once per day',
            times: (cfg.timesPerDay || 'Once per day') === 'Once per day'
                ? [{ hour: f.hour || firstSendHour, minute: f.minute || firstSendMinute, period: f.period || firstSendPeriod }]
                : [
                    { hour: f.hour || firstSendHour, minute: f.minute || firstSendMinute, period: f.period || firstSendPeriod },
                    { hour: s.hour || secondSendHour, minute: s.minute || secondSendMinute, period: s.period || secondSendPeriod },
                ],
            recipients: (cfg.recipients || []).map((x: any) => String(x).trim()).filter(Boolean),
            vendors: cfg.vendors || [],
            statuses: cfg.statuses || [],
        });
    }, [selectedConfig, configurations]);

    const handleSaveConfig = async () => {
        setIsSavingConfig(true);
        try {
            const payload: any = {
                configId: selectedConfig || undefined,
                name: configName || '',
                isAutoEnabled,
                frequency,
                timesPerDay,
                times: timesPerDay === 'Once per day'
                    ? [{ hour: firstSendHour, minute: firstSendMinute, period: firstSendPeriod }]
                    : [
                        { hour: firstSendHour, minute: firstSendMinute, period: firstSendPeriod },
                        { hour: secondSendHour, minute: secondSendMinute, period: secondSendPeriod },
                    ],
                recipients: autoEmailRecipients.split(',').map(s => s.trim()).filter(Boolean),
                vendors: selectedVendors,
                statuses: selectedStatuses,
            };
            const res = await apiRequest('/api/admin-notification/configurations', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to save configuration');
            toast.success('Configuration saved');
            setConfigurations((prev) => {
                const rest = prev.filter((c: any) => c._id !== json.configuration._id);
                return [json.configuration, ...rest];
            });
            setSelectedConfig(json.configuration._id);
            setIsCreatingConfig(false);
            setConfigName('');
            setIsAutoEnabled(true);
            setFrequency('Daily');
            setTimesPerDay('Once per day');
            // onClose();
        } catch (e: any) {
            toast.error(e?.message || 'Error saving configuration');
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleDeleteConfig = async () => {
        if (!selectedConfig) return;
        let ok = true;
        try {
            const result = await Swal.fire({
                title: 'Delete configuration?',
                text: 'This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
            });
            ok = result.isConfirmed;
        } catch {
            ok = typeof window !== 'undefined' ? window.confirm('Are you sure you want to delete this configuration? This action cannot be undone.') : true;
        }
        if (!ok) return;
        try {
            const res = await apiRequest(`/api/admin-notification/configurations/${selectedConfig}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete configuration');
            toast.success('Configuration deleted');
            setConfigurations(prev => prev.filter((c: any) => c._id !== selectedConfig));
            setSelectedConfig('');
            setIsCreatingConfig(false);
        } catch (e: any) {
            toast.error(e?.message || 'Error deleting configuration');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] p-5">
            <div className="flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-lg font-medium">Send Admin Notification</h2>

                </div>

                {/* Tab Navigation */}
                <div className="flex mt-4 gap-2 text-xs bg-purple-50 text-gray-600 hover:bg-purple-100 p-2">
                    <button
                        onClick={() => { if (isSendTabDisabled) return; setActiveTab('send'); }}
                        disabled={isSendTabDisabled}
                        aria-disabled={isSendTabDisabled}
                        className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${activeTab === 'send'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : ''
                            } ${isSendTabDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                        Send Now
                    </button>
                    <button
                        onClick={() => setActiveTab('auto')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${activeTab === 'auto'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : ''
                            }`}
                    >
                        Auto Email Setting
                    </button>
                </div>

                {activeTab === "send" && (
                    <>
                        {/* Email Recipients */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Recipients
                            </label>
                            <input
                                type="email"
                                value={emailRecipients}
                                onChange={(e) => setEmailRecipients(e.target.value)}
                                placeholder="Email@gmail.com"
                                className="w-full px-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Add team number who should receive notification
                            </p>
                        </div>

                        {/* Search and Filter */}
                        <div className="flex items-center justify-between gap-3 mt-6">
                            <div className='flex items-center gap-2'>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search Unit IDs..."
                                        className="w-full px-4 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                {/* <button className="flex items-center gap-2 px-4 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filter
                                </button> */}
                            </div>
                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                {totalResults} inspections
                            </span>
                        </div>

                        {/* Table */}
                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden flex-1 flex flex-col">
                            <div className="overflow-auto flex-1">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={paginatedInspections.length > 0 && paginatedInspections.every(i => selectedUnits.includes(i.id))}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 circle-checkbox"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vendor</th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Review Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedInspections.map((inspection) => (
                                            <tr key={inspection.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUnits.includes(inspection.id)}
                                                        onChange={() => handleSelectUnit(inspection.id)}
                                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 circle-checkbox"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{inspection.id}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{inspection.status}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{inspection.vendor}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{inspection.review_completed ?? inspection.reviewCompleted ?? ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex sm:flex-row flex-col-reverse justify-between items-center mt-4 bg-white sm:gap-0 gap-2 ">
                            {/* Left side: Showing results */}
                            <div className="flex sm:flex-row flex-col sm:items-center sm:gap-4">
                                <div className="text-sm text-gray-600">
                                    Showing {startResult} to {Math.min(endResult, totalResults)} of {totalResults} results
                                </div>
                                <div className="h-5 w-0.5 bg-black sm:block hidden" />
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>Row per page:</span>
                                    <select
                                        className="border rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white"
                                        value={rowsPerPage}
                                        onChange={(e) => {
                                            setRowsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        <option value={10}>10</option>
                                        <option value={15}>15</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>
                            </div>

                            {/* Right: Page navigation */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage <= 1}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                                >
                                    <ChevronsLeft className="w-4 h-4" color="#7522BB" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage <= 1}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                                >
                                    <ChevronLeft className="w-4 h-4" color="#7522BB" />
                                </button>
                                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                    const start = Math.max(1, Math.min(currentPage - 1, Math.max(1, totalPages - 2)));
                                    return start + i;
                                }).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setCurrentPage(tab)}
                                        className={`w-6 h-6 rounded text-xs font-medium ${currentPage === Number(tab)
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                                >
                                    <ChevronRight className="w-4 h-4" color="#7522BB" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage >= totalPages}
                                    className="w-6 h-6 flex items-center justify-center border rounded text-sm disabled:opacity-30 hover:bg-gray-100 bg-[#9333EA1A]"
                                >
                                    <ChevronsRight className="w-4 h-4" color="#7522BB" />
                                </button>
                            </div>
                        </div>

                        {/* Send Button */}
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={handleSendNow}
                                disabled={sending}
                                className={`px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium ${sending ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                                {sending ? 'Sending...' : `Send (${selectedUnits.length})`}
                            </button>
                        </div>
                    </>
                )}

                {activeTab === "auto" && (
                    <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {/* Header with New Config button */}
                        <div className="flex items-center justify-between mt-6 mb-4">
                            <h3 className="text-sm font-medium text-gray-700">Email Automation Configurations</h3>
                            <button onClick={() => { setIsCreatingConfig(true); setSelectedConfig(''); }} className="px-3 py-1.5 text-xs text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 font-medium">
                                + New Config
                            </button>
                        </div>

                        {/* Saved Configurations Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Saved Configurations:
                            </label>
                            <ModalDropdown
                                options={[
                                    { value: "", label: "Select Configuration to load..." },
                                    ...configurations.map((c: any) => {
                                        const vendorCount = Array.isArray(c.vendors) ? c.vendors.length : 0;
                                        const freq = String(c.frequency || 'Daily').toLowerCase();
                                        const isActive = c.isAutoEnabled;
                                        return {
                                            value: c._id,
                                            label: (
                                                <span className="flex items-center gap-2">
                                                    <span>{c.name}</span>
                                                    <span className="text-gray-500 text-xs">
                                                        ({vendorCount} vendor + {freq})
                                                    </span>
                                                    <span className={`text-xs ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                        {isActive ? '+ Active' : '- Inactive'}
                                                    </span>
                                                </span>
                                            )
                                        };
                                    })
                                ]}
                                width={"w-full"}
                                value={selectedConfig}
                                onChange={(e) => { setSelectedConfig(e); setIsCreatingConfig(false); }}
                            />
                        </div>

                        {/* Toggle and Buttons */}

                        <div className={`${(!selectedConfig && !isCreatingConfig) ? 'hidden' : ''}`}>
                            {!isCreatingConfig && (
                                <div className="flex flex-col gap-2 justify-between p-2 border rounded-xl">

                                    <div className="flex items-center gap-2 ">
                                        <label htmlFor="autoEnabled" className="inline-block text-sm font-medium text-gray-700">
                                            Active
                                        </label>
                                        <div
                                            className="relative inline-flex items-center cursor-pointer"
                                            onClick={() => setIsAutoEnabled(prev => !prev)}
                                            role="switch"
                                            aria-checked={isAutoEnabled}
                                        >
                                            <input
                                                id="autoEnabled"
                                                type="checkbox"
                                                checked={isAutoEnabled}
                                                onChange={(e) => setIsAutoEnabled(e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </div>
                                    </div>
                                    {(!isCreatingConfig && selectedConfig) && (
                                        <div className="flex gap-2 w-full">
                                            <button
                                                className="px-6 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium w-full"
                                                onClick={() => { setSelectedConfig(''); setIsCreatingConfig(false); }}
                                            >
                                                Close
                                            </button>
                                            <button
                                                className="px-6 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium w-full"
                                                onClick={handleDeleteConfig}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <hr className='my-6' />
                            {/* Edit Configuration Section */}
                            <h3 className="text-sm font-medium text-gray-700 mb-4">Edit Configuration</h3>

                            {/* Configuration Name */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Configuration Name:
                                </label>
                                <input
                                    type="text"
                                    value={configName}
                                    onChange={(e) => setConfigName(e.target.value)}
                                    placeholder="Test Fail Config"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none bg-[#FAF7FF]"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Give the automation configuration a description name
                                </p>
                            </div>

                            {/* Email Recipients */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Recipients:
                                </label>
                                <input
                                    type="email"
                                    value={autoEmailRecipients}
                                    onChange={(e) => setAutoEmailRecipients(e.target.value)}
                                    placeholder="inspecttech@gmail.com"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none  bg-[#FAF7FF]"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Add team member who should receive this notification
                                </p>
                            </div>

                            {/* Enable Automatic Notifications */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency:</label>
                                <ModalDropdown
                                    options={[
                                        { value: 'Daily', label: 'Daily' },
                                        { value: 'Weekly', label: 'Weekly' },
                                        { value: 'Monthly', label: 'Monthly' },
                                    ]}
                                    width={"w-full"}
                                    value={frequency}
                                    onChange={(e) => setFrequency(e)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">How many times per day:</label>
                                <ModalDropdown
                                    options={[
                                        { value: 'Once per day', label: 'Once per day' },
                                        { value: 'Twice per day', label: 'Twice per day' },
                                        { value: 'Three times per day', label: 'Three times per day' },
                                    ]}
                                    width={"w-full"}
                                    value={timesPerDay}
                                    onChange={(e) => setTimesPerDay(e)}
                                />
                            </div>
                            <TimePickerDropdown
                                isOpen={isFirstTimeOpen}
                                onClose={() => setIsFirstTimeOpen(false)}
                                onOpen={() => setIsFirstTimeOpen(true)}
                                hour={firstSendHour}
                                minute={firstSendMinute}
                                period={firstSendPeriod as 'AM' | 'PM'}
                                onTimeChange={(h, m, p) => {
                                    setFirstSendHour(h);
                                    setFirstSendMinute(m);
                                    setFirstSendPeriod(p);
                                }}
                                label={timesPerDay === 'Once per day' ? 'Send at (PDT):' : 'First send at (PDT):'}
                            />
                            {/* Second Send Time */}
                            <div className={timesPerDay === 'Twice per day' || timesPerDay === 'Three times per day' ? '' : 'hidden'}>
                                <TimePickerDropdown
                                    isOpen={isSecondTimeOpen}
                                    onClose={() => setIsSecondTimeOpen(false)}
                                    onOpen={() => setIsSecondTimeOpen(true)}
                                    hour={secondSendHour}
                                    minute={secondSendMinute}
                                    period={secondSendPeriod as 'AM' | 'PM'}
                                    onTimeChange={(h, m, p) => {
                                        setSecondSendHour(h);
                                        setSecondSendMinute(m);
                                        setSecondSendPeriod(p);
                                    }}
                                    label="Second send at (PDT):"
                                />
                            </div>

                            <div className={timesPerDay === 'Three times per day' ? '' : 'hidden'}>
                                <TimePickerDropdown
                                    isOpen={isThirdTimeOpen}
                                    onClose={() => setIsThirdTimeOpen(false)}
                                    onOpen={() => setIsThirdTimeOpen(true)}
                                    hour={thirdSendHour}
                                    minute={thirdSendMinute}
                                    period={thirdSendPeriod as 'AM' | 'PM'}
                                    onTimeChange={(h, m, p) => {
                                        setThirdSendHour(h);
                                        setThirdSendMinute(m);
                                        setThirdSendPeriod(p);
                                    }}
                                    label="Third send at (PDT):"
                                />
                            </div>

                            {/* Apply to Vendors */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Apply to Vendors:
                                </label>
                                <div className="space-y-2">
                                    {availableVendors.map((vendor: any) => (
                                        <label key={vendor._id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedVendors.includes(String(vendor._id))}
                                                onChange={(e) => {
                                                    const id = String(vendor._id);
                                                    if (e.target.checked) {
                                                        setSelectedVendors([...selectedVendors, id]);
                                                    } else {
                                                        setSelectedVendors(selectedVendors.filter(v => v !== id));
                                                    }
                                                }}
                                                className="circle-checkbox"
                                            />
                                            <span className="text-sm text-gray-700">{vendor.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                    Select which vendors this automatic configuration apply to
                                </p>
                            </div>

                            {/* Include Inspection With Status */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Include Inspection With Status:
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'Pass', label: 'Pass' },
                                        { value: 'NEED REVIEW', label: 'NEED REVIEW' },
                                        { value: 'COMPLETE', label: 'COMPLETE' },
                                        { value: 'FAIL', label: 'FAIL' },
                                        { value: 'INCOMPLETE', label: 'INCOMPLETE' },
                                        { value: 'OUT OF CYCLE (DELIVERED)', label: 'OUT OF CYCLE (DELIVERED)' }
                                    ].map((status) => (
                                        <label key={status.value} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedStatuses.includes(status.value)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedStatuses([...selectedStatuses, status.value]);
                                                    } else {
                                                        setSelectedStatuses(selectedStatuses.filter(s => s !== status.value));
                                                    }
                                                }}
                                                className="circle-checkbox"
                                            />
                                            <span className="text-sm text-gray-700">{status.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Update Configuration Button */}
                            <div className="flex justify-end pb-4">
                                <button onClick={handleSaveConfig} disabled={isSavingConfig || (selectedConfig ? !isDirty : false)} className={`px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium ${(isSavingConfig || (selectedConfig ? !isDirty : false)) ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                    {isSavingConfig
                                        ? (selectedConfig ? 'Updating...' : 'Saving...')
                                        : (selectedConfig ? 'Update Configuration' : 'Save Configuration')
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </Modal>
    );
};

export default AdminNotificationModal;