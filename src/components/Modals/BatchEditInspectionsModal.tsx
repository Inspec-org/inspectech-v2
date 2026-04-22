// /Users/mlb/Desktop/InspecTech/src/components/Modals/BatchEditInspectionsModal.tsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import CheckList from '../inspections/CheckLIst';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { set } from 'mongoose';
import { UserContext } from '@/context/authContext';



type Props = {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onChange: (field: string, value: string) => void;
  onDropdownChange: (name: string, value: string) => void;
  selectedUnitIds: string[];
  onUpdated?: () => void;
};

const BatchEditInspectionsModal: React.FC<Props> = ({ isOpen, onClose, formData, setFormData, onChange, onDropdownChange, selectedUnitIds, onUpdated }) => {
  const { user } = useContext(UserContext)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const canEditDate = user?.role === 'superadmin' || user?.role === 'owner';

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Save scroll position on scroll
      const handleScroll = () => {
        scrollPosition.current = container.scrollTop;
      };
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && scrollPosition.current > 0) {
      // Restore scroll position after re-render
      container.scrollTop = scrollPosition.current;
    }
  }, [formData]);
  const handleUpdate = async () => {
    const protectedStatuses = new Set([
      'pass',
      'out of cycle (delivered)',
      'no inspection (delivered)',
    ]);
    const selectedStatus = String(formData.status || '').trim().toLowerCase();
    if (selectedStatus && selectedStatus !== 'leave unchanged' && protectedStatuses.has(selectedStatus) && user?.role !== 'superadmin') {
      toast.error('Inspection marked as PASS / DELIVERED. Only notes can be edited.');
      return;
    }
    const updates: any = {};

    if (formData.status && formData.status !== 'Leave unchanged') updates.inspectionStatus = formData.status;
    if (formData.type) updates.type = formData.type;
    if (formData.inspector) updates.inspector = formData.inspector;
    if (formData.vendor) updates.vendor = formData.vendor;
    if (formData.location) updates.location = formData.location;
    if (formData.notes) updates.notes = formData.notes;
    if (formData.durationMin) updates.durationMin = formData.durationMin;
    if (formData.durationSec) updates.durationSec = formData.durationSec;
    if (formData.delivered_status) updates.delivered = formData.delivered_status;

    // Only include date fields in the payload for superadmin / owner
    if (canEditDate) {
      if (formData.dateDay) updates.dateDay = formData.dateDay;
      if (formData.dateMonth) updates.dateMonth = formData.dateMonth;
      if (formData.dateYear) updates.dateYear = formData.dateYear;
    }

    const excluded = new Set(['status', 'delivered_status', 'date', 'duration', 'dateMonth', 'dateDay', 'dateYear', 'createdAt', 'dateCreated', 'equipmentId', 'equipmentNumber', 'vin']);
    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val === '' || val === undefined || val === null) return;
      if (excluded.has(key) || key.startsWith('date')) return;
      if (!(key in updates)) {
        updates[key] = val;
      }
    });

    try {
      setIsUpdating(true);
      const results = await Promise.allSettled(
        (selectedUnitIds || []).map((unitId: string) =>
          apiRequest('/api/inspections/update-inspection', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updates, unitId }),
          })
        )
      );
      const successes: string[] = [];
      const failures: string[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const json = await r.value.json();
          if (r.value.ok && json.success) successes.push(json.inspection?.unitId || '');
          else failures.push(json.message || 'Failed');
        } else {
          failures.push(r.reason?.message || 'Network error');
        }
      }
      if (successes.length) {
        toast.success(`Updated ${successes.length} inspections`);
        if (onUpdated) onUpdated();
      }
      if (failures.length) {
        const unique = Array.from(new Set(failures.filter(Boolean)));
        if (unique.length === 1) {
          toast.error(unique[0]);
        } else {
          toast.error(`Failed ${failures.length} updates. ${unique[0] || ''}`);
        }
      }
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Server error');
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[490px] max-h-[90vh] p-0 flex flex-col">
      <div className="bg-white rounded-lg w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <div className='flex gap-2 items-center text-[#059669]'>
              <Edit3 className="w-4 h-4" />
              <h2 className="text-lg font-semibold  flex gap-2 items-center">Batch Edit</h2>
            </div>
            <p className="text-xs text-gray-600 mt-1">Update fields for {selectedUnitIds?.length || 0} selected inspection(s). Leave blank to keep existing values.</p>
          </div>
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto flex-1">
          <h2 className="text-md font-semibold flex gap-2 items-center pl-4 mt-2">General Information</h2>
          <div className="p-4 space-y-5 mb-4">
            {/* inspection status */}
            <div className="flex flex-col justify-between gap-4">
              <label className="w-32 text-gray-700 font-medium">Inspection Status</label>
              <CustomDropdown
                options={[
                  { value: "pass", label: `PASS${(user?.role === 'vendor' || user?.role === 'user') ? ' (Admin Only)' : ''}`, disabled: (user?.role === 'vendor' || user?.role === 'user') },
                  { value: "fail", label: `FAIL${(user?.role === 'vendor' || user?.role === 'user') ? ' (Admin Only)' : ''}`, disabled: (user?.role === 'vendor' || user?.role === 'user') },
                  { value: "needs review", label: `NEEDS REVIEW${(user?.role === 'vendor' || user?.role === 'user') ? ' (Admin Only)' : ''}`, disabled: (user?.role === 'vendor' || user?.role === 'user') },
                  { value: "out of cycle (delivered)", label: `OUT OF CYCLE (DELIVERED)${(user?.role === 'vendor' || user?.role === 'user') ? ' (Admin Only)' : ''}`, disabled: (user?.role === 'vendor' || user?.role === 'user') },
                  { value: "no inspection (delivered)", label: `NO INSPECTION (DELIVERED)${(user?.role === 'vendor' || user?.role === 'user') ? ' (Admin Only)' : ''}`, disabled: (user?.role === 'vendor' || user?.role === 'user') },
                  { value: "incomplete", label: "INCOMPLETE" },
                  { value: "complete", label: "COMPLETE" },
                ]}
                width='w-full'
                value={formData.status}
                onChange={(val) => onDropdownChange('status', val)}
              />
            </div>
            {/* Type */}
            <div className="flex flex-col justify-between gap-4">
              <label className="w-32 text-gray-700 font-medium">Type</label>
              <CustomDropdown
                options={[
                  { value: '53-foot-trailer', label: '53 Foot Trailer' }
                ]}
                width='w-full'
                value={formData.type}
                onChange={(val) => onDropdownChange('type', val)} />
            </div>
            {/* Inspector */}
            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Inspector</label>
              <input
                type="text"
                placeholder="Leave unchanged"
                value={formData.inspector}
                onChange={(e) => onChange('inspector', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
              />
            </div>
            {/* Vendor */}
            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Vendor</label>
              <input
                type="text"
                placeholder="Leave unchanged"
                value={formData.vendor}
                disabled
                onChange={(e) => onChange('vendor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 w-full cursor-not-allowed"
              />
            </div>
            {/* location */}
            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Location</label>
              <input
                type="text"
                placeholder="Leave unchanged"
                value={formData.location}
                onChange={(e) => onChange('location', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
              />
            </div>
            {/* duration */}
            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Duration</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={formData.durationMin}
                  min={0}
                  onChange={(e) => onChange('durationMin', e.target.value)}
                  className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                />
                <span className="text-sm text-gray-500">min</span>
                <input
                  type="number"
                  value={formData.durationSec}
                  min={0}
                  onChange={(e) => onChange('durationSec', e.target.value)}
                  className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                />
                <span className="text-sm text-gray-500">sec</span>
              </div>
            </div>
            {/* date */}
            <div className="flex flex-col items-start gap-4">
              <label className={`w-full text-sm font-medium ${canEditDate ? 'text-gray-700' : 'text-gray-400'}`}>
                <span>Date {!canEditDate && '(UnEditable)'}</span>
                {!canEditDate && (
                  <>
                    <br />
                    <span className="text-xs">Date field tracks initial database creation timestamp and remains inactive for data integrity preservation.</span>
                  </>
                )}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.dateMonth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const raw = Number(e.target.value);
                    const value = Math.min(12, Math.max(1, raw));
                    onChange("dateMonth", value.toString());
                  }}
                  disabled={!canEditDate}
                  className={`w-16 px-3 py-2 border border-gray-300 rounded-lg text-center ${canEditDate ? 'bg-[#FAF7FF] text-gray-700' : 'bg-[#FAF7FF] text-gray-400 cursor-not-allowed'}`}
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.dateDay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const raw = Number(e.target.value);
                    const value = Math.min(31, Math.max(1, raw));
                    onChange("dateDay", value.toString());
                  }}
                  disabled={!canEditDate}
                  className={`w-16 px-3 py-2 border border-gray-300 rounded-lg text-center ${canEditDate ? 'bg-[#FAF7FF] text-gray-700' : 'bg-[#FAF7FF] text-gray-400 cursor-not-allowed'}`}
                />
                <span className="text-gray-400">/</span>
                <input
                  type="number" min={2000}
                  value={formData.dateYear}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const currentYear = new Date().getFullYear();
                    const raw = Number(e.target.value);
                    const value = Math.min(currentYear, Math.max(2000, raw));
                    onChange("dateYear", value.toString());
                  }}
                  disabled={!canEditDate}
                  className={`w-20 px-3 py-2 border border-gray-300 rounded-lg text-center ${canEditDate ? 'bg-[#FAF7FF] text-gray-700' : 'bg-[#FAF7FF] text-gray-400 cursor-not-allowed'}`}
                />
              </div>
            </div>
            {/* delivered status */}
            <div className="flex flex-col justify-between gap-4">
              <label className="w-32 text-gray-700 font-medium">Delivered Status</label>
              <CustomDropdown
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                width='w-full'
                value={formData.delivered_status}
                onChange={(val) => onDropdownChange('delivered_status', val)}
              />
            </div>
          </div>
          <h2 className="text-md font-semibold flex gap-2 items-center pl-4 mb-2">Inspection Checklist</h2>
          <CheckList prop="batch" formData={formData as any} setFormData={setFormData} />
        </div>

        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className="px-6 py-2.5 text-white bg-[#059669] rounded-lg hover:bg-[#059669]/90 transition font-medium flex gap-2 items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Edit3 className="w-4 h-4" />
            )}
            {isUpdating ? 'Updating...' : 'Update'}
          </button>ƒ
        </div>
      </div>
    </Modal>
  );
};

export default BatchEditInspectionsModal;