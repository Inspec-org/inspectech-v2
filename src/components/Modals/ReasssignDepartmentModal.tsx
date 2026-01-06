import React, { useEffect, useState } from 'react';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Modal } from '../ui/modal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  department: string;
  onDepartmentChange: (val: string) => void;
  selectedUnitIds: string[];
  onUpdated?: () => void;
};

type Department = {
  _id: string;
  name: string;
};

const ReassignDepartmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  department,
  onDepartmentChange,
  selectedUnitIds,
  onUpdated
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/departments/get-departments');
      const json = await res.json();

      if (!res.ok) {
        toast.error(json?.error || 'Failed to fetch departments');
        return;
      }

      setDepartments(json.departments || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const options = departments.map(dept => ({
    value: dept._id,
    label: dept.name,
  }));

  const handleReassign = async () => {
    try {
      if (!department) {
        toast.error('Please select a department');
        return;
      }

      const results = await Promise.allSettled(
        (selectedUnitIds || []).map((unitId: string) =>
          apiRequest('/api/inspections/update-inspection', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId, departmentId: department }),
          })
        )
      );

      const okCount = results.filter(r => r.status === 'fulfilled').length;
      if (okCount > 0) {
        const deptName = departments.find(d => d._id === department)?.name || department;
        toast.success(`Reassigned ${okCount} inspection(s) to ${deptName}`);
        if (onUpdated) onUpdated();
      }

      const failCount = results.length - okCount;
      if (failCount > 0) {
        toast.error(`Failed to reassign ${failCount} inspection(s)`);
      }

      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Server error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[400px] p-4">
      <div>
        <div className="flex gap-2 text-[#0075FF] items-center mb-2">
          <Briefcase className="w-6 h-6" />
          <h2 className="text-xl font-semibold">Reassign Department</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Choose a new department for the {selectedUnitIds?.length || 0} selected inspection(s)
        </p>

        <div className="flex flex-col justify-between gap-2 mb-5">
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <CustomDropdown
            options={options}
            width="w-full"
            value={department}
            onChange={(val) => onDepartmentChange(val)}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReassign}
            disabled={loading || !department}
            className="bg-[#447af9] text-white px-4 py-2 rounded-lg hover:bg-[#8FADF5] transition flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
            Reassign
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReassignDepartmentModal;