import React from 'react';
import { Department, DepartmentCard } from './DepartmentCard';
import { RefreshCcwIcon } from 'lucide-react';
import Image from 'next/image';

interface DepartmentSelectorProps {
  company: string;
  departments: Department[];
  onDepartmentSelect?: (department: Department) => void;
  getDepartments: () => void;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  company,
  departments,
  onDepartmentSelect,
  getDepartments
}) => {
  return (
    <div className=" ">
      <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
        {/* Header */}
        <div className="bg-purple-100 p-4 flex items-start justify-between mb-8 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 rounded-lg">
              <Image src="/images/departments/logo.svg" alt="Department" width={48} height={48} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-purple-900 ">
                Select Department
              </h1>
              <p className="text-sm text-purple-800 mt-1">
                Choose a department to access its dashboard
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={getDepartments}>
            <Image src="/images/departments/refresh.svg" alt="Refresh" width={16} height={16} />
            Refresh Page
          </button>
        </div>

        {/* Company Label */}
        <div className="mb-6">
          <div className="inline-block border-l-4 border-purple-600 pl-3">
            <p className="text-sm font-semibold text-gray-900">{company}</p>
          </div>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {departments?.map((department) => (
            <DepartmentCard
              key={department.id}
              department={department}
              onClick={onDepartmentSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};