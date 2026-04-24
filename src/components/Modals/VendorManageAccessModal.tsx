'use client'
import React, { useEffect, useState } from 'react';
import { Building2, Plus, UserCog, UserPlus, X, Check, Search } from 'lucide-react';
import { Modal } from '../ui/modal';
import { ClipLoader } from 'react-spinners';

import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: (payload?: { selectedDepartments?: string[]; departmentNames?: string[] }) => void;
    vendorId?: string;
    vendorName?: string;
};



const VendorManageAccessModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onUpdated,
    vendorId,
    vendorName,
}) => {
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [deptSearch, setDeptSearch] = useState('');

    useEffect(() => {
        if (isOpen && vendorId) {
            setFetching(true);
            (async () => {
                try {
                    const limit = 250;
                    const fetchAllDepartments = async (): Promise<{ _id: string; name: string }[]> => {
                        const res = await apiRequest(`/api/departments/get-all-departments?pagination=false`);
                        if (!res.ok) return [];
                        const json = await res.json().catch(() => ({}));
                        const list = Array.isArray(json.data) ? json.data : [];
                        return list.map((d: any) => ({ _id: String(d._id), name: d.name }));
                    };

                    const [deptList, vRes] = await Promise.all([
                        fetchAllDepartments(),
                        apiRequest(`/api/vendors/details?vendorId=${encodeURIComponent(vendorId)}`),
                    ]);

                    setDepartments(deptList);

                    if (vRes.ok) {
                        const vjson = await vRes.json().catch(() => ({}));
                        const ids = Array.isArray(vjson.vendor?.departmentAccess)
                            ? vjson.vendor.departmentAccess.map((id: any) => String(id))
                            : [];
                        setSelectedDepartments(ids);
                    } else {
                        setSelectedDepartments([]);
                    }
                } catch {
                    setDepartments([]);
                    setSelectedDepartments([]);
                } finally {
                    setFetching(false);
                }
            })();
        }
    }, [isOpen, vendorId]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId) {
            toast.error('Missing vendor');
            return;
        }
        setLoading(true);
        try {
            const res = await apiRequest('/api/vendors/update_access', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId, departmentIds: selectedDepartments })
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
                const selectedDepartmentNames = departments
                    .filter((d) => selectedDepartments.includes(String(d._id)))
                    .map((d) => d.name);
                toast.success('Vendor access updated');
                onUpdated?.({
                    selectedDepartments,
                    departmentNames: selectedDepartmentNames,
                });
                onClose();
            } else {
                toast.error(json.error || json.message || 'Failed to update access');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-[700px] max-h-[90vh]">
            {/* Purple Header */}
            <div className="bg-gradient-to-b from-[#6D28D9] to-[#3730A3] px-6 py-4 rounded-t-lg relative">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
                >
                    <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <UserCog size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">Manage Vendor Access</h2>
                        <p className="text-sm text-white/90 mt-0.5">Add or remove department permissions</p>
                    </div>
                </div>
            </div>
            <div className="px-6 pt-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold">
                        {(vendorName || '').trim().charAt(0).toUpperCase() || 'V'}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-900">{vendorName || '—'}</div>
                    </div>
                </div>
                {/* <div className="mt-4 flex items-center gap-6 border-b w-full justify-around">
                    <button
                        className={`${activeTab === 'department' ? 'text-[#7C3AED] border-b-2 border-[#7C3AED] bg-[#7C3AED]/15' : 'text-gray-600'} py-3 text-sm font-medium w-full`}
                        onClick={() => setActiveTab('department')}
                    >
                        Department
                    </button>
                    <button
                        className={`${activeTab === 'vendor' ? 'text-[#7C3AED] border-b-2 border-[#7C3AED] bg-[#7C3AED]/15' : 'text-gray-600'} py-3 text-sm font-medium w-full`}
                        onClick={() => setActiveTab('vendor')}
                    >
                        Vendor
                    </button>
                </div> */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-sm text-gray-900">Department Access</h3>
                            <p className="text-xs text-gray-500">Select departments this vendor can access</p>
                        </div>
                        <div className="text-xs text-gray-500">{selectedDepartments.length} of {departments.length} selected</div>
                    </div>
                    <div className="mb-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={deptSearch}
                            onChange={(e) => setDeptSearch(e.target.value)}
                            placeholder="Search departments..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                        />
                    </div>
                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                        {(() => {
                            if (fetching) {
                                return <div className="flex justify-center items-center py-10"><ClipLoader color="#7C3AED" size={24} /></div>;
                            }
                            const q = deptSearch.trim().toLowerCase();
                            const filtered = (departments || []).filter(d => !q || String(d.name).toLowerCase().includes(q));
                            if (!filtered.length) {
                                return <div className="text-center text-sm text-gray-500">No departments found</div>;
                            }
                            return filtered.map((d) => {
                                const checked = selectedDepartments.includes(String(d._id));
                                return (
                                    <label key={String(d._id)} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${checked ? 'border-[#7C3AED] bg-purple-50' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 circle-checkbox"
                                                checked={checked}
                                                onChange={(e) => {
                                                    const id = String(d._id);
                                                    setSelectedDepartments((prev) => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                                                }}
                                            />
                                            <span className="text-sm text-gray-900">{d.name}</span>
                                        </div>
                                    </label>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>



            {/* Footer Actions */}
            <div className="px-6 pb-6 flex items-center justify-end gap-3 mt-4">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                    {loading ? <ClipLoader color="#fff" size={16} /> : <Plus size={18} />}
                    <span>Save Changes</span>
                </button>
            </div>
        </Modal>
    );
};

export default VendorManageAccessModal