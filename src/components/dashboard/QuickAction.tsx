import React from 'react';
import { CheckSquare, CheckCircle, AlertTriangle, FileText, Users, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  iconColor: string;
  onClick?: () => void;
}




export default function QuickActions({ role }: { role: string }) {
  const router = useRouter()
  const quickActions: QuickAction[] = [
    {
      id: 'view-inspections',
      label: 'View Inspections',
      icon: <CheckSquare className="w-5 h-5" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      iconColor: 'text-purple-600',
      onClick: () => {
        sessionStorage.removeItem('inspectionFilters'); // Clear filters
        router.push(`inspections`)
      }
    },
    {
      id: 'passed-inspections',
      label: 'Passed Inspections',
      icon: <CheckCircle className="w-5 h-5" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      onClick: () => {
        // Override filters with only pass status
        sessionStorage.setItem('inspectionFilters', JSON.stringify({ inspectionStatus: ['pass'] })); // '5' is pass status ID
        router.push(`inspections`)
      }
    },
    {
      id: 'failed-inspections',
      label: 'Failed Inspections',
      icon: <AlertTriangle className="w-5 h-5" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      onClick: () => {
        // Override filters with only fail status
        sessionStorage.setItem('inspectionFilters', JSON.stringify({ inspectionStatus: ['fail'] })); // Update with correct fail ID
        router.push(`inspections`)
      }
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: <FileText className="w-5 h-5" />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
      iconColor: 'text-orange-600',
      onClick: () => {
        router.push(`reports`)
      }
    },
    {
      id: 'manage-users',
      label: 'Manage Users',
      icon: <Users className="w-5 h-5" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      iconColor: 'text-blue-600',
      onClick: () => {
        router.push(`users`)
      }
    },
  ];
  const handleClick = (actionId: string) => {

  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-indigo-900">
          Quick Actions
        </h3>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full justify-between">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => action.onClick && action.onClick()}
            className={`w-full flex items-center gap-3 px-5 2xl:py-5 py-5.5 rounded-xl ${action.bgColor} ${action.textColor} font-medium text-left transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
          >
            <span className={`${action.iconColor} bg-white p-2 rounded-full`}>
              {action.icon}
            </span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Example usage:
// <QuickActions onActionClick={(id) => console.log('Clicked:', id)} />