import React from 'react';
import { ArrowRight } from 'lucide-react';
import { ClipLoader } from 'react-spinners';

interface PassRateCardProps {
  passRate: number;
  passed: number;
  failed: number;
  loading: boolean
}

export default function PassRateCard({ passRate, passed, failed, loading }: PassRateCardProps) {
  const circumference = 2 * Math.PI * 55;
  const strokeDashoffset = circumference - (passRate / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-s h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-indigo-900">
          Overall Pass Rate
        </h3>
        {/* <ArrowRight className="w-5 h-5 text-indigo-600" /> */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-full">
          <ClipLoader color="#8b5cf6" size={30} />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center mb-8">
  <div className="relative w-45 h-45 flex items-center justify-center overflow-hidden">
    <svg
      className="w-full h-full transform -rotate-90"
      viewBox="0 0 160 160"
    >
      {/* Background circle */}
      <circle
        cx="80"
        cy="80"
        r="68"
        stroke="#e5e7eb"
        strokeWidth="14"
        fill="none"
      />

      {/* Progress circle */}
      <circle
        cx="80"
        cy="80"
        r="68"
        stroke="#8b5cf6"
        strokeWidth="14"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>

    {/* Center text */}
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-bold text-purple-600">
        {passRate}%
      </div>
      <div className="text-sm text-purple-500 mt-1">
        Pass Rate
      </div>
    </div>
  </div>
</div>


          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Passed */}
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{passed}</div>
              <div className="text-sm text-purple-600 font-medium">Passed</div>
            </div>

            {/* Failed */}
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">{failed}</div>
              <div className="text-sm text-red-600 font-medium">Failed</div>
            </div>
          </div>
        </>
      )}


    </div>
  );
}