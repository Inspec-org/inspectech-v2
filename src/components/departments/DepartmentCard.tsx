// components/DepartmentCard.tsx
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

export interface Department {
  _id?: string;
  id: string;
  name: string;
  description: string;
  color: string;
  isActive?: boolean;
}


interface DepartmentCardProps {
  department: Department;
  onClick?: (department: Department) => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onClick
}) => {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-emerald-500',
  };
  const textClasses: Record<string, string> = {
    purple: 'text-purple-800',
    blue: 'text-blue-500',
    red: 'text-red-500',
    green: 'text-emerald-500',
  };
  const borderClasses: Record<string, string> = {
    purple: 'border-purple-800',
    blue: 'border-blue-500',
    red: 'border-red-500',
    green: 'border-emerald-500',
  };



  return (
    <div
      onClick={() => onClick?.(department)}
      className={`group relative border ${borderClasses[department.color]} rounded-xl p-6 transition-shadow transform hover:-translate-y-2 hover:shadow-lg cursor-pointer`}
      style={{
        background: `linear-gradient(137deg, white 0%, #FAF5FF 100%)`,
      }}
    >
      {department.isActive && (
        <span
          className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full"
        >
          ACTIVE
        </span>
      )}

      {/* Icon */}
      <div
        className={`${colorClasses[department.color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform duration-2000 group-hover:scale-110`}
      >
        <Image
          width={24}
          height={24}
          src="/images/departments/van.svg"
          alt="Icon"
        />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 flex flex-col">
        <span className={`${textClasses[department.color]}`}>
          {department.name}
        </span>
        <span
          className={`h-[3px] rounded-full ${colorClasses[department.color]}`}
          style={{ width: "25%" }}
        />
      </h3>

      {/* Bottom row */}
      <div className="flex items-center justify-between text-sm">
        <span className={`${textClasses[department.color]} font-medium uppercase tracking-wide`}>
          ACCESS DASHBOARD
        </span>

        <ArrowRight
          className="w-6 h-6 bg-white rounded-full p-1 border shadow-sm transition-transform duration-2000 group-hover:scale-110 group-hover:-translate-x-1 group-hover:bg-purple-500 group-hover:text-white"
        />
      </div>
    </div>

  );
};