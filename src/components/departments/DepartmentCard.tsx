// components/DepartmentCard.tsx
import Image from 'next/image';
import React from 'react';

export interface Department {
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
      className={`relative  border ${borderClasses[department.color]} rounded-xl p-6 bg-white hover:shadow-lg transition-shadow cursor-pointer`}
    >
      {department.isActive || true && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
          ACTIVE
        </span>
      )}
      
      <div className={`${colorClasses[department.color]} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
        <Image width={24} height={24} src="/images/departments/van.svg" alt="Icon" />
      </div>
      
      <h3 className={`text-lg font-semibold mb-2 ${textClasses[department.color]}`}>
        {department.name}
      </h3>
      
      <div className="flex items-center justify-between text-sm">
        <span className={`${textClasses[department.color]} font-medium uppercase tracking-wide`}>
          ACCESS DASHBOARD
        </span>
        <svg 
          className="w-4 h-4 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5l7 7-7 7" 
          />
        </svg>
      </div>
    </div>
  );
};