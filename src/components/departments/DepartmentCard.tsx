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
  status?: 'active' | 'inactive';
  isActive?: boolean;
  image?: string;
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
  const NAMED_COLOR_MAP: Record<string, string> = {
    purple: '#7C3AED',
    blue: '#3B82F6',
    red: '#E96513',
    green: '#059669',
  };
  const PALETTE = ['#7C3AED', '#3B82F6', '#059669', '#E96513', '#14B8A6', '#F43F5E', '#9333EA', '#0EA5E9'];
  const pickFromPalette = (key: string): string => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) { hash = (hash * 31 + key.charCodeAt(i)) >>> 0; }
    return PALETTE[hash % PALETTE.length];
  };
  const cssColorRegex = /^(#([0-9a-f]{3}){1,2}|rgb[a]?\([\s\S]*\)|hsl[a]?\([\s\S]*\))$/i;
  const deriveAccent = (): string => {
    const raw = (department.color || '').trim();
    const named = NAMED_COLOR_MAP[raw.toLowerCase()];
    if (named) return named;
    if (raw && cssColorRegex.test(raw)) return raw;
    return pickFromPalette(department.id || department.name || '');
  };
  const lighten = (hex: string, amount = 0.25): string => {
    if (!hex.startsWith('#')) return hex;
    const h = hex.replace('#','');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const bigint = parseInt(full, 16);
    const r = Math.min(255, Math.round(((bigint >> 16) & 255) * (1 - amount) + 255 * amount));
    const g = Math.min(255, Math.round(((bigint >> 8) & 255) * (1 - amount) + 255 * amount));
    const b = Math.min(255, Math.round((bigint & 255) * (1 - amount) + 255 * amount));
    return `rgb(${r}, ${g}, ${b})`;
  };
  const accent = deriveAccent();
  const glow = lighten(accent, 0.25);
  const statusStr = String(department.status ?? (department.isActive ? 'active' : 'inactive')).toLowerCase();
  const isActive = statusStr === 'active';
  const badgeClass = isActive ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-400 to-gray-500';
  const badgeText = isActive ? 'ACTIVE' : 'INACTIVE';
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
        onClick={() => { if (isActive) { onClick?.(department); } }}
        className={`group relative border rounded-xl px-6 py-10 transition-all transform ${isActive ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer' : 'opacity-60 cursor-not-allowed'} glow-border`}
        style={{
          background: `linear-gradient(137deg, white 0%, #FAF5FF 100%)`,
          ['--glow-color' as any]: glow,
          ['--accent-color' as any]: accent,
          borderColor: accent,
        }}
      >
          <span
            className={`absolute top-4 right-4 px-2 py-1 text-xs font-medium text-white rounded-full ${badgeClass}`}
          >
            {badgeText}
          </span>

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-transform duration-2000 group-hover:scale-110`}
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          {renderIcon()}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 flex flex-col">
          <span style={{ color: 'var(--accent-color)' }}>
            {department.name}
          </span>
          <span
            className="h-[3px] rounded-full"
            style={{ width: "25%", backgroundColor: 'var(--accent-color)' }}
          />
        </h3>

        {/* Bottom row */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium uppercase tracking-wide" style={{ color: 'var(--accent-color)' }}>
            ACCESS DASHBOARD
          </span>

          <ArrowRight
            className="arrow w-6 h-6 bg-white rounded-full p-1 border shadow-sm transition-transform duration-2000 group-hover:scale-110 group-hover:-translate-x-1"
          />
        </div>
      </div>
      <style jsx>{`
        .glow-border { position: relative; z-index: 0; }
        .group:hover .arrow { background-color: var(--accent-color); color: #fff; }
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