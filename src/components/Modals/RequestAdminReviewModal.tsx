import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Home } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Image from 'next/image';
import Cookies from 'js-cookie';
import { useSearchParams } from 'next/navigation';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

type Department = {
    _id: string;
    name: string;
};

const RequestAdminReviewModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onUpdated,
}) => {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [tableLoading, setTableLoading] = useState(false);
    const [selectedInspections, setSelectedInspections] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [inspections, setInspections] = useState<{ unitId: string; inspectionStatus: string }[]>([]);
    const [totalInspections, setTotalInspections] = useState(0);
    const [recipientsInput, setRecipientsInput] = useState('');
    const [err, setErr] = useState('');

    const totalPages = Math.ceil(totalInspections / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalInspections);

    const pageTabs = useMemo(() => {
        const totalPages = Math.ceil(totalInspections / rowsPerPage);
        return Array.from({ length: totalPages }, (_, i) => (i + 1));
    }, [totalInspections, rowsPerPage]);

    const fetchInspections = async () => {
        setTableLoading(true);
        try {
            const vendorId = Cookies.get('selectedVendorId') || '';
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            const res = await apiRequest('/api/inspections/get-inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page: currentPage,
                    limit: rowsPerPage,
                    department: departmentId,
                    vendorId,
                    filter: { inspectionStatuses: ['complete', 'completed'], search: searchQuery }
                })
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to load inspections');
            const list = (json.inspections || []).map((i: any) => ({ unitId: i.unitId, inspectionStatus: i.inspectionStatus || 'complete' }));
            setInspections(list);
            setTotalInspections(json.total || list.length);

        } catch (e: any) {
            toast.error(e?.message || 'Error fetching inspections');
            setInspections([]);
            setTotalInspections(0);
        } finally {
            setTableLoading(false);
        }
    };


    useEffect(() => { if (isOpen) { setCurrentPage(1); fetchInspections(); } }, [isOpen]);
    useEffect(() => { if (isOpen) { fetchInspections(); } }, [currentPage, rowsPerPage]);
    useEffect(() => { if (isOpen) { const t = setTimeout(fetchInspections, 300); return () => clearTimeout(t); } }, [searchQuery]);

    const toggleInspection = (id: string) => {
        setSelectedInspections(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleProcessRequest = async () => {
        if (selectedInspections.length === 0) {
            toast.error('Please select at least one inspection');
            return;
        }
        const recipients = recipientsInput.split(',').map(s => s.trim()).filter(Boolean);
        if (!recipients.length) {
            setErr('Please enter at least one email recipient');
            return;
        }
        setLoading(true);
        try {
            const vendorName = Cookies.get('selectedVendor') || '';
            const vendorId = Cookies.get('selectedVendorId') || '';
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            const res = await apiRequest('/api/admin-review/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipients, unitIds: selectedInspections, vendorName, vendorId, departmentId })
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Failed to send email');
            toast.success('Admin review request sent');
            setSelectedInspections([]);
            setRecipientsInput('');
            if (onUpdated) onUpdated();
            onClose();
        } catch (e: any) {
            setErr(e?.message || 'Error sending email');
        } finally {
            setLoading(false);
            setErr('');
        }
    };
    const goToPage = (page: number) => {
        setCurrentPage(page);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-[1100px]">
            <div className="p-6 bg-[#F9F6FE]">
                <h2 className="text-2xl font-semibold mb-6">Request Admin Review</h2>

                {/* Email Recipients */}
                <div className="mb-6 border bg-white p-4">
                    <label className="block text-base font-medium mb-2">Email Recipients</label>
                    <input
                        type="text"
                        placeholder="Enter comma-separated emails (e.g. a@b.com, c@d.com)"
                        value={recipientsInput}
                        onChange={(e) => setRecipientsInput(e.target.value)}
                        className="w-full bg-[#F9F6FE] rounded-lg p-3 text-sm text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">Add team members who should receive this review request</p>
                </div>

                {/* Search */}
                <div className="mb-4 flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search Unit IDs...."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                        {totalInspections} inspections
                    </span>
                </div>


                {/* Inspections List */}
                <div className="border border-gray-200 rounded-lg mb-4">
                    {inspections.map((inspection, index) => (
                        <div
                            key={`${inspection.unitId}-${index}`}
                            className={`flex items-center justify-between px-4 py-4 ${index !== inspections.length - 1 ? 'border-b border-gray-200' : ''
                                } hover:bg-gray-50 transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedInspections.includes(inspection.unitId)}
                                    onChange={() => toggleInspection(inspection.unitId)}
                                    className="circle-checkbox"
                                />
                                <span className="text-sm font-medium">{inspection.unitId}</span>
                            </div>
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                                {(inspection.inspectionStatus || 'complete').toUpperCase()}
                            </span>
                            <div></div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex sm:flex-row flex-col-reverse justify-between items-center mt-4 bg-white p-4 sm:gap-0 gap-2 mb-6">
                    {/* Left side: Showing results */}
                    <div className="flex sm:flex-row flex-col sm:items-center sm:gap-4">
                        <div className="text-sm text-gray-600">
                            Showing {startIndex + 1} to {endIndex} of {totalInspections} results
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
                        {pageTabs.map((tab, index) => (
                            <button
                                key={index}
                                onClick={() => goToPage(Number(tab))}
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

                {/* Process Button */}
                <div>
                    {err && <div className="text-red-500 text-sm mb-2">{err}</div>}
                    <button
                        onClick={handleProcessRequest}
                        disabled={loading || selectedInspections.length === 0}
                        className={`w-full bg-green-400 hover:bg-green-500 text-white font-medium py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 ${selectedInspections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-lg">🚀</span>
                        {loading ? 'Processing...' : `Process & Send Request (${selectedInspections.length})`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RequestAdminReviewModal;