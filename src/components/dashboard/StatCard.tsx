'use client'
import React, { useContext } from 'react';
import { useRouter } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import { CheckSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { stats } from './Dashboard';
import { ClipLoader } from 'react-spinners';

interface StatCardProps {
  label: string;
  value: string | number;
  variant: 'purple' | 'green' | 'red' | 'yellow';
  loading?: boolean;
}

const variantStyles = {
  purple: {
    valueColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    color: "purple",
    Icon: CheckSquare,
  },
  green: {
    valueColor: 'text-green-600',
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    color: "green",
    Icon: CheckCircle,
  },
  red: {
    valueColor: 'text-red-600',
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    color: "red",
    Icon: XCircle,
  },
  yellow: {
    valueColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    color: "#CA8A04",
    Icon: Clock,
  },
};

export const StatCard: React.FC<StatCardProps> = ({ label, value, variant, loading }) => {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;
  const router = useRouter();
  const { user } = useContext(UserContext);
  const role = user?.role || 'user';

  const handleClick = () => {
    try {
      if (variant === 'purple') {
        sessionStorage.removeItem('inspectionFilters');
      } else if (variant === 'green') {
        sessionStorage.setItem('inspectionFilters', JSON.stringify({ inspectionStatuses: ['pass'] }));
      } else if (variant === 'red') {
        sessionStorage.setItem('inspectionFilters', JSON.stringify({ inspectionStatuses: ['fail'] }));
      } else if (variant === 'yellow') {
        sessionStorage.setItem('inspectionFilters', JSON.stringify({ inspectionStatuses: ['needs review'] }));
      }
    } catch { }
    router.push(`/${role}/inspections`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-br-xl rounded-tr-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ boxShadow: 'inset 8px 0 0 0 black, 0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-base text-gray-600 mb-2">{label}</p>
          {loading ? (
            <ClipLoader color={styles.color} size={24} />
          ) : (
            <p className={`text-2xl font-bold ${styles.valueColor}`}>{value}</p>
          )}
        </div>
        <div className={`${styles.bgColor} rounded-lg p-2`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>
      </div>
    </div>
  );
};




interface StatsGridProps {
  data: stats | null;
  loading: boolean
}

export const StatsGrid: React.FC<StatsGridProps> = ({ data, loading }) => {
  // 
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
      <StatCard
        label="Total Inspections"
        value={data?.total || 0}
        variant="purple"
        loading={loading}
      />
      <StatCard
        label="Total Pass Rate"
        value={data?.passPercentage + "%" || "0%"}
        variant="green"
        loading={loading}
      />
      <StatCard
        label="Total Fail Rate"
        value={data?.failPercentage + "%" || "0%"}
        variant="red"
        loading={loading}
      />
      <StatCard
        label="Needs Review"
        value={data?.needsReviewPercentage + "%" || "0%"}
        variant="yellow"
        loading={loading}
      />
    </div>
  );
};