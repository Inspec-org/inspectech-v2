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
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1100px]">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-xl font-semibold">Send Admin Notification</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex mt-4 gap-2">
                    <button
                        onClick={() => setActiveTab('send')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${activeTab === 'send'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'bg-purple-50 text-gray-600 hover:bg-purple-100'
                            }`}
                    >
                        Send Now
                    </button>
                    <button
                        onClick={() => setActiveTab('auto')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${activeTab === 'auto'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'bg-purple-50 text-gray-600 hover:bg-purple-100'
                            }`}
                    >
                        Auto Email Setting
                    </button>
                </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Add team number who should receive notification
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center gap-3 mt-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Unit IDs..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
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
                                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
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
                                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Showing {startResult} to {endResult} of {totalResults} results</span>
                        <div className="flex items-center gap-2">
                            <span>Row per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                                className="border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => {
                                    const page = Number(e.target.value);
                                    if (page >= 1 && page <= totalPages) {
                                        setCurrentPage(page);
                                    }
                                }}
                                className="w-12 px-2 py-1 text-center border border-gray-300 rounded"
                                min={1}
                                max={totalPages}
                            />
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronsRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Send Button */}
                <div className="flex justify-end mt-6">
                    <button className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
                        Sent({selectedUnits.length})
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AdminNotificationModal;