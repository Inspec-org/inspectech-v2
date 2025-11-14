import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, FileText, X } from 'lucide-react';

// Types
interface VendorData {
    name: string;
    totalInspections: number;
    incompleteImageFile: number;
    incompleteDotForm: number;
    incompleteChecklist: number;
}

// Sample data
const vendorInspections = [
    { name: 'John Vendor', count: 26 },
    { name: 'John Vendor2', count: 13 },
    { name: 'ABC Vendor', count: 16 }
];

const issuesByVendor: VendorData[] = [
    {
        name: 'John Vendor',
        totalInspections: 26,
        incompleteImageFile: 83,
        incompleteDotForm: 17,
        incompleteChecklist: 0
    },
    {
        name: 'ABC Vendor',
        totalInspections: 16,
        incompleteImageFile: 38,
        incompleteDotForm: 50,
        incompleteChecklist: 25
    }
];

const currentStatus = [
    { vendor: 'John Vendor', pass: 8, fail: 0, incomplete: 0, needsReview: 0, complete: 0 },
    { vendor: 'John Vendor2', pass: 0, fail: 1, incomplete: 1, needsReview: 0, complete: 0 },
    { vendor: 'ABC Vendor', pass: 0, fail: 0, incomplete: 0, needsReview: 7, complete: 0 },
    { vendor: 'ABC Vendor', pass: 0, fail: 0, incomplete: 3, needsReview: 0, complete: 3 }
];

// Components
const ReportHeader = ({close}:{close: () => void}) => (
    <div className=" pb-2 border-b border-gray-300">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <FileText size={24} color='#2563EB' />
                    <h1 className="text-xl font-semibold text-gray-800">Vendor Performance Report</h1>
                </div>
                <p className="text-sm text-gray-600">Data Period: All Available Data (6/8/2023 - 06/02/2025)</p>
            </div>
            <div className='flex gap-2'>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border rounded-lg">
                    <Download size={16} />
                    Download PDF
                </button>
                <button onClick={close}><X size={16} className='opacity-60'/></button>
            </div>
        </div>
    </div>
);

const ChartSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
        {children}
    </div>
);

const TotalInspectionsChart: React.FC = () => (
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={vendorInspections}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                {vendorInspections.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const IssuesChart: React.FC = () => {
    const data = issuesByVendor.map(vendor => ({
        name: vendor.name,
        'Incomplete Image File': vendor.incompleteImageFile,
        'Incomplete DOT Form': vendor.incompleteDotForm,
        'Incomplete Checklist': vendor.incompleteChecklist
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingRight: '20px' }} />
                <Bar dataKey="Incomplete Image File" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incomplete DOT Form" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incomplete Checklist" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

const VendorDetails: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-gray-800 mb-3">ABC VENDOR</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete Image File</span>
                        <span className="font-medium">83% (5 out of 6 total issues)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete Dot Form</span>
                        <span className="font-medium">17% (1 out of 6 total issues)</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-gray-800 mb-3">ABC vendor</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete Checklist</span>
                        <span className="font-medium">25% (2 out of 8 total issues)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete Dot Form</span>
                        <span className="font-medium">50% (4 out of 8 total issues)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete Image File</span>
                        <span className="font-medium">38% (3 out of 8 total issues)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StatusChart: React.FC = () => {
    const statusColors = {
        pass: '#10b981',
        fail: '#f97316',
        incomplete: '#fbbf24',
        needsReview: '#f97316',
        complete: '#3b82f6'
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={currentStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="vendor"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pass" name="PASS" fill={statusColors.pass} stackId="a" />
                <Bar dataKey="fail" name="FAIL" fill={statusColors.fail} stackId="a" />
                <Bar dataKey="incomplete" name="INCOMPLETE" fill={statusColors.incomplete} stackId="a" />
                <Bar dataKey="needsReview" name="NEEDS REVIEW" fill={statusColors.needsReview} stackId="a" />
                <Bar dataKey="complete" name="COMPLETE" fill={statusColors.complete} stackId="a" />
            </BarChart>
        </ResponsiveContainer>
    );
};

// Main App
const GeneratedReport = ({close}:{close: () => void}) => {
    return (
        <div className='p-6'>
            <div className="p-4 bg-gray-100 mt-4">
                <ReportHeader close={close}/>

                <div className="mt-4 p-4">
                    <ChartSection title="Report 1A: Total Inspections by Vendor">
                        <TotalInspectionsChart />
                    </ChartSection>

                    <ChartSection title="Report 1B: Percentage of Issues by Vendor">
                        <IssuesChart />
                    </ChartSection>

                    <VendorDetails />

                    <ChartSection title="Report 1C: Current Inspection Status Breakdown by Vendor">
                        <StatusChart />
                    </ChartSection>
                </div>
            </div>
        </div>
    );
};

export default GeneratedReport;