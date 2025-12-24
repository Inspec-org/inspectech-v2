import React, { useContext } from 'react';
import { Edit3, Calendar, X } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { UserContext } from '@/context/authContext';
import { ReportDropdown } from '../ui/dropdown/reportsDropdown';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onChange: (field: string, value: string) => void;
  onDropdownChange: (name: string, value: string) => void;
  selectedUnitIds: string[];
  onUpdated?: () => void;
  selectedUnitsData?: any[];
};

const BatchEditReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onChange,
  onDropdownChange,
  selectedUnitIds,
  selectedUnitsData,
  onUpdated
}) => {
  const { user } = useContext(UserContext);

  const missingDataOptions = [
    { label: 'Select type', value: '' },
    { label: 'Incomplete Data', value: 'incomplete' },
    { label: 'Missing Information', value: 'missing' },
    { label: 'Pending Review', value: 'pending' },
  ];

  const handleUpdate = async () => {
    const updates: any = {};

    if (formData.reviewCompletedAt) updates.reviewCompletedAt = formData.reviewCompletedAt;
    if (formData.missingData) updates.missingData = formData.missingData;

    if (!updates.reviewCompletedAt && !updates.missingData) {
      toast.error('Please fill at least one field to update');
      return;
    }

    try {
      const results = await Promise.allSettled(
        (selectedUnitsData || []).map((unit) =>
          apiRequest('/api/reviews/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...updates,
              unitId: unit.id,
              vendorId: unit.vendorId,
              departmentId: unit.departmentId,
            }),
          })
        )
      );

      const successes: string[] = [];
      const failures: string[] = [];

      for (const r of results) {
        if (r.status === 'fulfilled') {
          const json = await r.value.json();
          if (r.value.ok && json.success) {
            successes.push(json.inspection?.unitId || '');
          } else {
            failures.push(json.message || 'Failed');
          }
        } else {
          failures.push(r.reason?.message || 'Network error');
        }
      }

      if (successes.length) {
        toast.success(`Updated ${successes.length} inspections`);
        if (onUpdated) onUpdated();
      }
      if (failures.length) {
        toast.error(`Failed ${failures.length} updates`);
      }

      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Server error');
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-0 flex flex-col">
      <div className="bg-white rounded-lg w-full flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-semibold  flex gap-2 items-center">Batch Edits</h2>
            <p className="text-xs text-gray-600 mt-2">
              Update completion dates and/or missing data types for {selectedUnitIds?.length || 0} selected units.
            </p>
          </div>

        </div>

        {/* Form Content */}
        <div className="p-4 space-y-4">
          {/* Completion Date */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">
              Completion Date
            </label>
            <div>
              {(() => {
                const t = new Date();
                const CY = t.getFullYear();
                const CM = t.getMonth() + 1;
                const CD = t.getDate();
                const cur = formData.reviewCompletedAt || '';
                const [yy, mm, dd] = cur ? cur.split('-').map((n: any) => parseInt(n)) : [CY, CM, CD];
                return (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={mm}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const m = Math.min(12, Math.max(1, raw));
                        const cm = yy === CY ? Math.min(m, CM) : m;
                        const maxDay = yy === CY && cm === CM ? CD : new Date(yy, cm, 0).getDate();
                        const nd = Math.min(dd, maxDay);
                        const s = `${String(yy)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                        onChange('reviewCompletedAt', s);
                      }}
                      className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dd}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const maxDay = yy === CY && mm === CM ? CD : new Date(yy, mm, 0).getDate();
                        const d = Math.min(maxDay, Math.max(1, raw));
                        const s = `${String(yy)}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        onChange('reviewCompletedAt', s);
                      }}
                      className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                    />
                    <span className="text-gray-400">/</span>
                    <input
                      type="number"
                      min={2000}
                      max={CY}
                      value={yy}
                      onChange={(e) => {
                        const raw = Number(e.target.value);
                        const y = Math.min(CY, Math.max(2000, raw));
                        const cm = y === CY ? Math.min(mm, CM) : mm;
                        const maxDay = y === CY && cm === CM ? CD : new Date(y, cm, 0).getDate();
                        const nd = Math.min(dd, maxDay);
                        const s = `${String(y)}-${String(cm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`;
                        onChange('reviewCompletedAt', s);
                      }}
                      className="w-20 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Missing Data Type */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">
              Missing Data Type
            </label>
            <CustomDropdown
              options={[
                { value: "None", label: "None" },
                { value: "Incomplete Image File", label: "Incomplete Image File" },
                { value: "Incomplete DOT Form", label: "Incomplete DOT Form" },
                { value: "Incomplete Checklist", label: "Incomplete Checklist" },
              ]}
              value={formData.missingData || ''}
              onChange={(value) => onDropdownChange('missingData', value)}
              placeholder="Select type"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="px-6 py-2.5 text-white bg-[#059669] rounded-lg hover:bg-[#059669]/90 transition font-medium flex gap-2 items-center"
          >
            <Edit3 className="w-4 h-4" />
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BatchEditReviewModal;