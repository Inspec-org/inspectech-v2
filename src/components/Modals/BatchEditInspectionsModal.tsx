// /Users/mlb/Desktop/InspecTech/src/components/Modals/BatchEditInspectionsModal.tsx
import React, { useContext } from 'react';
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
  const handleUpdate = async () => {
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

    Object.keys(formData).forEach((key) => {
      const val = formData[key];
      if (val !== '' && val !== undefined && val !== null) {
        if (!(key in updates) && !['status', 'delivered_status', 'date', 'duration'].includes(key)) {
          updates[key] = val;
        }
      }
    });

    try {
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
      if (failures.length) toast.error(`Failed ${failures.length} updates`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Server error');
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

        <div className="overflow-y-auto flex-1">
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
              <label className="w-full text-gray-400 text-sm font-medium">
                <span>Date (UnEditable)</span>
                <br />
                <span className="text-xs">Date field tracks initial database creation timestamp and remains inactive for data integrity preservation.</span>
              </label>
              <div className="flex gap-2 items-center">
                <input type="number" min={0} placeholder="MM" value={formData.dateDay} onChange={(e) => onChange('dateDay', e.target.value)} disabled className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
                <span className="text-gray-400">/</span>
                <input type="number" min={0} placeholder="DD" value={formData.dateMonth} onChange={(e) => onChange('dateMonth', e.target.value)} disabled className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
                <span className="text-gray-400">/</span>
                <input type="number" min={0} placeholder="YYYY" value={formData.dateYear} onChange={(e) => onChange('dateYear', e.target.value)} disabled className="w-20 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
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
          <button onClick={handleUpdate} className="px-6 py-2.5 text-white bg-[#059669] rounded-lg hover:bg-[#059669]/90 transition font-medium flex gap-2 items-center">
            <Edit3 className="w-4 h-4" />
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BatchEditInspectionsModal;
