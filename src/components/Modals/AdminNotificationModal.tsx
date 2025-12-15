import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Image from 'next/image';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

const AdminNotificationModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onUpdated,
}) => {

    const [activeTab, setActiveTab] = useState<'send' | 'auto'>('send');
    const [emailRecipients, setEmailRecipients] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    const [configurations, setConfigurations] = useState<any[]>([]);
    const [selectedConfig, setSelectedConfig] = useState('');
    const [configName, setConfigName] = useState('');
    const [autoEmailRecipients, setAutoEmailRecipients] = useState('');
    const [isAutoEnabled, setIsAutoEnabled] = useState(false);
    const [frequency, setFrequency] = useState('Daily');
    const [timesPerDay, setTimesPerDay] = useState('Twice per day');
    const [firstSendHour, setFirstSendHour] = useState('04');
    const [firstSendMinute, setFirstSendMinute] = useState('16');
    const [firstSendPeriod, setFirstSendPeriod] = useState('PM');
    const [secondSendHour, setSecondSendHour] = useState('04');
    const [secondSendMinute, setSecondSendMinute] = useState('26');
    const [secondSendPeriod, setSecondSendPeriod] = useState('PM');
    const [selectedVendors, setSelectedVendors] = useState<string[]>(['ABC VENDOR', 'ABC vendor']);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['NEED REVIEW', 'COMPLETE', 'FAIL', 'INCOMPLETE', 'OUT OF CYCLE (DELIVERED)']);

    // Mock data - replace with actual API call
    const inspections = [
        { id: 'SYC60805', status: 'COMPLETE', vendor: 'Stoughon', reviewCompleted: 'Pending' },
        { id: 'SYC60442', status: 'COMPLETE', vendor: 'Stoughon', reviewCompleted: 'Pending' },
        { id: 'HY2604785', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2604785', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603639', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603837', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2604776', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603829', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603829', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2604771', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603831', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
        { id: 'HY2603827', status: 'COMPLETE', vendor: 'Hyundai', reviewCompleted: 'Pending' },
    ];

    const totalResults = 2303;
    const startResult = (currentPage - 1) * rowsPerPage + 1;
    const endResult = Math.min(currentPage * rowsPerPage, totalResults);
    const totalPages = Math.ceil(totalResults / rowsPerPage);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUnits(inspections.map(i => i.id));
        } else {
            setSelectedUnits([]);
        }
    };

    const handleSelectUnit = (id: string) => {
        setSelectedUnits(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px]">
            <div className="flex flex-col max-h-[85vh] 2xl:max-h-full p-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-lg font-medium">Send Admin Notification</h2>

                </div>

                {/* Tab Navigation */}
                <div className="flex mt-4 gap-2 text-xs bg-purple-50 text-gray-600 hover:bg-purple-100 p-2">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex-1 py-1 px-2 rounded-lg font-medium transition-colors ${activeTab === 'send'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : ''
                            }`}
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
                                className="w-full px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                        className="w-full px-4 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                                <button className="flex items-center gap-2 px-4 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filter
                                </button>
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
                                                    checked={selectedUnits.length === inspections.length}
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
                                        {inspections.map((inspection, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
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
                                                <td className="px-4 py-3 text-sm text-gray-900">{inspection.reviewCompleted}</td>
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
                                {[1, 2, 3].map((tab) => (
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
                            <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                                Sent({selectedUnits.length})
                            </button>
                        </div>
                    </>
                )}

                {activeTab === "auto" && (
                    <div className="overflow-y-auto flex-1">
                        {/* Header with New Config button */}
                        <div className="flex items-center justify-between mt-6 mb-4">
                            <h3 className="text-sm font-medium text-gray-700">Email Automation Configurations</h3>
                            <button className="px-3 py-1.5 text-xs text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 font-medium">
                                + New Config
                            </button>
                        </div>

                        {/* Saved Configurations Dropdown */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Saved Configurations:
                            </label>
                            <select
                                value={selectedConfig}
                                onChange={(e) => setSelectedConfig(e.target.value)}
                                className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Select Configuration to load...</option>
                                <option value="config1">Config 1</option>
                                <option value="config2">Config 2</option>
                                <option value="config3">Config 3</option>
                            </select>
                        </div>

                        {/* Toggle and Buttons */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isAutoEnabled}
                                    onChange={(e) => setIsAutoEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                            <div className="flex gap-2">
                                <button className="px-6 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                                    Close
                                </button>
                                <button className="px-6 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">
                                    Delete
                                </button>
                            </div>
                        </div>

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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Add team member who should receive this notification
                            </p>
                        </div>

                        {/* Enable Automatic Notifications */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Enable Automatic Notifications</h4>
                                    <p className="text-xs text-gray-500">Automatically send email notification based on schedule and flows</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAutoEnabled}
                                        onChange={(e) => setIsAutoEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Frequency */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Frequency
                            </label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">How many times per day:</p>
                            <select
                                value={timesPerDay}
                                onChange={(e) => setTimesPerDay(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mt-2"
                            >
                                <option value="Once per day">Once per day</option>
                                <option value="Twice per day">Twice per day</option>
                                <option value="Three times per day">Three times per day</option>
                            </select>
                        </div>

                        {/* First Send Time */}
                        <div className="mb-4">
                            <label className="block text-xs text-gray-500 mb-2">
                                First send at (PDT):
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={firstSendHour}
                                    onChange={(e) => setFirstSendHour(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const val = String(i + 1).padStart(2, '0');
                                        return <option key={val} value={val}>{val}</option>;
                                    })}
                                </select>
                                <select
                                    value={firstSendMinute}
                                    onChange={(e) => setFirstSendMinute(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {Array.from({ length: 60 }, (_, i) => {
                                        const val = String(i).padStart(2, '0');
                                        return <option key={val} value={val}>{val}</option>;
                                    })}
                                </select>
                                <select
                                    value={firstSendPeriod}
                                    onChange={(e) => setFirstSendPeriod(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        {/* Second Send Time */}
                        <div className="mb-4">
                            <label className="block text-xs text-gray-500 mb-2">
                                Second send at (PDT):
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={secondSendHour}
                                    onChange={(e) => setSecondSendHour(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const val = String(i + 1).padStart(2, '0');
                                        return <option key={val} value={val}>{val}</option>;
                                    })}
                                </select>
                                <select
                                    value={secondSendMinute}
                                    onChange={(e) => setSecondSendMinute(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {Array.from({ length: 60 }, (_, i) => {
                                        const val = String(i).padStart(2, '0');
                                        return <option key={val} value={val}>{val}</option>;
                                    })}
                                </select>
                                <select
                                    value={secondSendPeriod}
                                    onChange={(e) => setSecondSendPeriod(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        {/* Apply to Vendors */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Apply to Vendors:
                            </label>
                            <div className="space-y-2">
                                {['ABC VENDOR', 'ABC vendor'].map((vendor) => (
                                    <label key={vendor} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedVendors.includes(vendor)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedVendors([...selectedVendors, vendor]);
                                                } else {
                                                    setSelectedVendors(selectedVendors.filter(v => v !== vendor));
                                                }
                                            }}
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">{vendor}</span>
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
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700">{status.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Update Configuration Button */}
                        <div className="flex justify-end pb-4">
                            <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                                Update Configuration
                            </button>
                        </div>
                    </div>
                )}


            </div>
        </Modal>
    );
};

export default AdminNotificationModal;