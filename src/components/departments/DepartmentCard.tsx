// components/DepartmentCard.tsx
import { ArrowRight, BarChart3, Wrench } from 'lucide-react';
import Image from 'next/image';
import React, { ReactNode } from 'react';

export interface Department {
  _id?: string;
  id: string;
  name: string;
  description: string;
  color: string;
  isActive?: boolean;
  image?: string; // Changed from ReactNode to string
  imageType?: 'svg' | 'icon';
}


interface DepartmentCardProps {
  department: Department;
  onClick?: (department: Department) => void;
  image?: ReactNode;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onClick
}) => {
  const colorClasses: Record<string, string> = {
    purple: 'bg-purple-600',
    blue: 'bg-blue-500',
    red: 'bg-[#E96513]',
    green: 'bg-emerald-600',
  };
  const textClasses: Record<string, string> = {
    purple: 'text-purple-800',
    blue: 'text-blue-500',
    red: 'text-[#E96513]',
    green: 'text-emerald-600',
  };
  const borderClasses: Record<string, string> = {
    purple: 'border-purple-800',
    blue: 'border-blue-500',
    red: 'border-[#E96513]',
    green: 'border-emerald-600',
  };
  const glowClasses: Record<string, string> = {
    purple: 'glow-purple',
    blue: 'glow-blue',
    red: 'glow-red',
    green: 'glow-green',
  };
  const renderIcon = () => {
    if (department.imageType === 'icon') {
      const iconProps = { className: "w-6 h-6 text-white" };
      switch (department.image) {
        case 'wrench':
          return <Wrench {...iconProps} />;
        case 'bar-chart':
          return <BarChart3 {...iconProps} />;
        default:
          return null;
      }
    }

    return (
      <Image
        width={34}
        height={34}
        src={department.image || "/images/departments/van.svg"}
        alt="Icon"
      />
    );
  };


  return (
    <div className="p-1"> {/* Add padding container */}
      <div
        onClick={() => onClick?.(department)}
        className={`group relative border ${borderClasses[department.color]} rounded-xl px-6 py-10 transition-all transform hover:scale-[1.02] hover:shadow-lg cursor-pointer glow-border ${glowClasses[department.color]}`}
        style={{
          background: `linear-gradient(137deg, white 0%, #FAF5FF 100%)`,
        }}
      >
        {/* {department.isActive && ( */}
          <span
            className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-full"
          >
            ACTIVE
          </span>
        {/* )} */}

        {/* Icon */}
        <div
          className={`${colorClasses[department.color]} w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-transform duration-2000 group-hover:scale-110`}
        >
          {renderIcon()}
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
      <style jsx>{`
        .glow-border { position: relative; z-index: 0; }
        .glow-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 0.75rem;
          border: 2px solid var(--glow-color);
          opacity: 0.9;
          pointer-events: none;
        }
        .glow-border::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 0.75rem;
          border: 2px solid var(--glow-color);
          opacity: 0.6;
          transform: scale(1);
          animation: pulseOut 2.4s ease-out infinite;
          pointer-events: none;
        }
        .glow-purple::before, .glow-purple::after { --glow-color: #A78BFA; }
        .glow-blue::before, .glow-blue::after { --glow-color: #93C5FD; }
        .glow-red::before, .glow-red::after { --glow-color: #F59E0B; }
        .glow-green::before, .glow-green::after { --glow-color: #34D399; }
        @keyframes pulseOut {
          0% { transform: scale(1); opacity: 0.6; }
          60% { transform: scale(1.08); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
};