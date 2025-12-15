'use client';
import React, { useContext, useEffect, useState } from 'react';
import { Filter, FileDown, Edit, Send, Trash2, X, FileText, Edit3, Mail } from 'lucide-react';
import GenericDataTable, { Column } from '../tables/GenericDataTable';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import GeneratedReport from './GeneratedReport';
import AnalysisDashboard from './AnalysisDashboard';
import User from '@/lib/models/User';
import { UserContext } from '@/context/authContext';
import Inspections, { Header } from '../InspectionTracker/Inspections';

// Types
interface Tab {
    id: string;
    label: string;
    color: 'purple' | 'gray';
}


// Main Reports Component
const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('inspection');
    const [selectedCount, setSelectedCount] = useState(2);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loading, setLoading] = useState(false)
    const [openGeneratedReport, setOpenGeneratedReport] = useState(false);
    const { user } = useContext(UserContext);

    const tabs: Tab[] = [
        { id: 'inspection', label: 'Inspection log & Vendor Performance Tracker', color: 'purple' },
        { id: 'analytics', label: 'Analytics Dashboard', color: 'gray' },
    ];

    useEffect(() => {
        if (user && user?.role === "vendor") {
            setActiveTab('analytics')
        }
    }, [user])

    

    


    return (
        <div className="">
            <div className="relative">
                {/* Page Title */}
                <h1 className="font-bold text-2xl px-2 py-3">Reports</h1>
                {/* Tabs */}
                {user && user.role === 'admin' && (
                    <div className="inline-block bg-purple-100 p-2 rounded-lg mb-4">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}



                {/* Report Card */}
                {activeTab === 'inspection' && (
                    <Inspections />
                )}

                {activeTab === 'analytics' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <AnalysisDashboard />
                    </div>
                )}



            </div>

        </div>
    );
};

export default Reports;