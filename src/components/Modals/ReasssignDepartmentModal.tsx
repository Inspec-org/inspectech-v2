// /Users/mlb/Desktop/InspecTech/src/components/Modals/ReassignDepartmentModal.tsx
import React from 'react';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  onDepartmentChange: (val: string) => void;
};

const ReassignDepartmentModal: React.FC<Props> = ({ isOpen, onClose, department, onDepartmentChange }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-4 ">
      <div>
        <div className="flex gap-2 text-[#0075FF] items-center mb-2">
          <Briefcase className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Reassign Department</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm">Choose a new department for the 1 selected inspection</p>

        <div className="flex flex-col justify-between gap-4 items-start mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <CustomDropdown
            options={[
              { value: 'us', label: 'US Purchase Trailers' },
              { value: 'canadian', label: 'Canadian Trailers' },
            ]}
            width="400px"
            value={department}
            onChange={(val) => onDepartmentChange(val)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
            Cancel
          </button>
          <button onClick={onClose} className="bg-[#8FADF5] text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition flex gap-2 items-center">
            <ArrowRight className="w-4 h-4" />
            Reassign
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReassignDepartmentModal;