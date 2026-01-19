'use client'
import React, { useEffect, useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import { Modal } from '../ui/modal';
import { MultiSelectDropdown } from '../ui/dropdown/MultiSelectDropdown';

import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
  vendors?: Vendor[];
  departments?: Department[];
};

type Department = {
  _id: string;
  name: string;
};

type Vendor = {
  _id: string;
  name: string;
};

const AddAdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onUpdated,
  vendors = [],
  departments = [],
}) => {
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);





  const handleSubmit = async () => {
    if (!adminName.trim()) {
      toast.error('Please enter admin name');
      return;
    }
    const emailTrim = email.trim().toLowerCase();
    if (!emailTrim || !emailTrim.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    if (selectedVendors.length === 0 || selectedDepartments.length === 0) {
      toast.error('Select at least one vendor and one department');
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'admin',
          name: adminName.trim(),
          email: emailTrim,
          vendorAccess: selectedVendors,
          departmentAccess: selectedDepartments,
        }),
      });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        toast.success(`Invitation sent to email`);
        onUpdated?.();
        setAdminName('');
        setEmail('');
        setSelectedVendors([]);
        setSelectedDepartments([]);
        onClose();
      } else {
        toast.error(data.message || 'Failed to send invitation');
      }
    } catch (error: any) {
      const message = error?.message || 'Failed to send invitation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-[700px] max-h-[90vh] overflow-auto">
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
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Onboard Admin Account Manager</h2>
            <p className="text-sm text-white/90 mt-0.5">Configure administrative access and permissions</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-5">
        {/* Admin Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Admin Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Enter admin manager name"
            className="w-full px-4 py-2.5 bg-[#FAF7FF] border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Admin Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Admin Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter admin email"
            className="w-full px-4 py-2.5 border bg-[#FAF7FF] border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {/* Select Vendors */}
        <div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-900">
              Select Vendors<span className="text-red-500">*</span>
            </label>
          </div>
          <MultiSelectDropdown
            options={vendors.map(v => ({ value: v._id, label: v.name }))}
            selectedValues={selectedVendors}
            onChange={(vals) => setSelectedVendors(vals)}
            placeholder="Select one or more vendors"
            width="w-full"
            menuHeader={(
              <>
                <button
                  onClick={() => setSelectedVendors(vendors.map(v => String(v._id)))}
                  className="text-sm text-[#7C3AED] hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Check size={16} />
                  Select All
                </button>
                <button
                  onClick={() => setSelectedVendors([])}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  <X size={16} />
                  Clear All
                </button>
              </>
            )}
            searchable
            searchPlaceholder="Search vendors..."
            showDone
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Select Departments */}
        <div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-900">
              Select Departments<span className="text-red-500">*</span>
            </label>
          </div>
          <MultiSelectDropdown
            options={departments.map(d => ({ value: d._id, label: d.name }))}
            selectedValues={selectedDepartments}
            onChange={(vals) => setSelectedDepartments(vals)}
            placeholder="Select one or more departments"
            width="w-full"
            menuHeader={(
              <>
                <button
                  onClick={() => setSelectedDepartments(departments.map(d => String(d._id)))}
                  className="text-sm text-[#7C3AED] hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Check size={16} />
                  Select All
                </button>
                <button
                  onClick={() => setSelectedDepartments([])}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                >
                  <X size={16} />
                  Clear All
                </button>
              </>
            )}
            searchable
            searchPlaceholder="Search departments..."
            showDone
          />
          <p className="text-xs text-gray-500 mt-1.5">
            {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''} selected
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Admin Access Configuration
              </h4>
              <p className="text-sm text-blue-800 lea">
                The admin account manager will have access to manage the selected vendors and departments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 pb-6 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-6 py-2.5 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !adminName.trim() || !email.trim() || selectedVendors.length === 0 || selectedDepartments.length === 0}
          className="px-6 py-2.5 bg-gradient-to-r from-[#6B46C1] to-[#8B5CF6] text-white font-medium rounded-lg hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          <UserPlus size={18} />
          Onboard Admin
        </button>
      </div>
    </Modal>
  );
};

export default AddAdminModal;