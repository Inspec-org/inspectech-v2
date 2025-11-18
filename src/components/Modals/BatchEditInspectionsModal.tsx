// /Users/mlb/Desktop/InspecTech/src/components/Modals/BatchEditInspectionsModal.tsx
import React from 'react';
import { Edit3 } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import CheckList from '../inspections/CheckLIst';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  onChange: (field: string, value: string) => void;
  onDropdownChange: (name: string, value: string) => void;
};

const BatchEditInspectionsModal: React.FC<Props> = ({ isOpen, onClose, formData, onChange, onDropdownChange }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[450px] max-h-[90vh] p-0 flex flex-col">
      <div className="bg-white rounded-lg w-full flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#059669] flex gap-2 items-center">Batch Edit</h2>
            <p className="text-xs text-gray-600 mt-1">Update fields for 1 selected inspection. Leave blank to existing values.</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <h2 className="text-md font-semibold flex gap-2 items-center pl-4">General Information</h2>
          <div className="p-4 space-y-5">
            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Status</label>
              <CustomDropdown
                options={[
                  { value: 'pass', label: 'PASS' },
                  { value: 'fail', label: 'FAIL' },
                  { value: 'need_review', label: 'NEEDS REVIEW' },
                  { value: 'out_of_cycle', label: 'OUT OF CYCLE (DELIVERED)' },
                  { value: 'no_inspection', label: 'NO INSPECTION(DELIVERED)' },
                  { value: 'incomplete', label: 'INCOMPLETE' },
                  { value: 'complete', label: 'COMPLETE' },
                ]}
                value={formData.status}
                onChange={(val) => onDropdownChange('status', val)}
              />
            </div>

            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Type</label>
              <CustomDropdown options={[{ value: '53-foot-trailer', label: '53 Foot Trailer' }]} value={formData.type} onChange={(val) => onDropdownChange('type', val)} />
            </div>

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

            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Vendor</label>
              <input
                type="text"
                placeholder="Leave unchanged"
                value={formData.vendor}
                onChange={(e) => onChange('vendor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] w-full"
              />
            </div>

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

            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Duration</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={formData.durationMin}
                  onChange={(e) => onChange('durationMin', e.target.value)}
                  className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                />
                <span className="text-sm text-gray-500">min</span>
                <input
                  type="number"
                  value={formData.durationSec}
                  onChange={(e) => onChange('durationSec', e.target.value)}
                  className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                />
                <span className="text-sm text-gray-500">sec</span>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <label className="w-full text-gray-400 font-medium">
                <span>Date (UnEditable)</span>
                <br />
                <span className="text-xs">Date field tracks initial database creation timestamp and remains inactive for data integrity preservation.</span>
              </label>
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="Leave unchanged" value={formData.dateDay} onChange={(e) => onChange('dateDay', e.target.value)} disabled className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
                <span className="text-gray-400">/</span>
                <input type="text" placeholder="Leave unchanged" value={formData.dateMonth} onChange={(e) => onChange('dateMonth', e.target.value)} disabled className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
                <span className="text-gray-400">/</span>
                <input type="text" placeholder="Leave unchanged" value={formData.dateYear} onChange={(e) => onChange('dateYear', e.target.value)} disabled className="w-20 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-400 text-center" />
              </div>
            </div>

            <div className="flex flex-col items-start gap-4">
              <label className="w-32 text-gray-700 font-medium">Delivered Status</label>
              <CustomDropdown
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
                value={formData.delivered_status}
                onChange={(val) => onDropdownChange('delivered_status', val)}
              />
            </div>
          </div>
          <CheckList prop="batch" formData={formData as any} setFormData={() => {}} />
        </div>

        <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium">
            Cancel
          </button>
          <button className="px-6 py-2.5 text-white bg-[#059669] rounded-lg hover:bg-[#059669]/90 transition font-medium flex gap-2 items-center">
            <Edit3 className="w-4 h-4" />
            Update
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BatchEditInspectionsModal;