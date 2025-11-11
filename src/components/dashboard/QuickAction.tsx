import React from 'react';
import { CheckSquare, CheckCircle, AlertTriangle, FileText, Users, Zap } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  iconColor: string;
  onClick?: () => void;
}

const quickActions: QuickAction[] = [
  {
    id: 'view-inspections',
    label: 'View Inspections',
    icon: <CheckSquare className="w-5 h-5" />,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    iconColor: 'text-purple-600',
  },
  {
    id: 'passed-inspections',
    label: 'Passed Inspections',
    icon: <CheckCircle className="w-5 h-5" />,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    iconColor: 'text-green-600',
  },
  {
    id: 'failed-inspections',
    label: 'Failed Inspections',
    icon: <AlertTriangle className="w-5 h-5" />,
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    iconColor: 'text-red-600',
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    icon: <FileText className="w-5 h-5" />,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    iconColor: 'text-orange-600',
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    icon: <Users className="w-5 h-5" />,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-600',
  },
];

interface QuickActionsProps {
  onActionClick?: (actionId: string) => void;
}

export default function QuickActions({ onActionClick }: QuickActionsProps) {
  const handleClick = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-indigo-900">
          Quick Actions
        </h3>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id)}
            className={`w-full flex items-center gap-3 px-5 py-7 rounded-xl ${action.bgColor} ${action.textColor} font-medium text-left transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]`}
          >
            <span className={action.iconColor}>
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