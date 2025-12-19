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
        <div className="p-4">
          {/* Completion Date */}
          <div>
            <label className="block text-base font-medium text-gray-900 mb-3">
              Completion Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.reviewCompletedAt || ''}
                onChange={(e) => onChange('reviewCompletedAt', e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
              />
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500 pointer-events-none" />
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