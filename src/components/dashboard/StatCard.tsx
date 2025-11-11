import React from 'react';
import { CheckSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  variant: 'purple' | 'green' | 'red' | 'yellow';
}

const variantStyles = {
  purple: {
    valueColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    Icon: CheckSquare,
  },
  green: {
    valueColor: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    Icon: CheckCircle,
  },
  red: {
    valueColor: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
  yellow: {
    valueColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    Icon: Clock,
  },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, variant }) => {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-2">{label}</p>
          <p className={`text-4xl font-bold ${styles.valueColor}`}>{value}</p>
        </div>
        <div className={`${styles.bgColor} rounded-full p-3`}>
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};


interface StatsData {
  totalInspections: number;
  passRate: string;
  failRate: string;
  needsReview: string;
}

interface StatsGridProps {
  data: StatsData;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <StatCard
        label="Total Inspections"
        value={data.totalInspections}
        variant="purple"
      />
      <StatCard
        label="Total Pass Rate"
        value={data.passRate}
        variant="green"
      />
      <StatCard
        label="Total Fail Rate"
        value={data.failRate}
        variant="red"
      />
      <StatCard
        label="Needs Review"
        value={data.needsReview}
        variant="yellow"
      />
    </div>
  );
};