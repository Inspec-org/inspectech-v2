'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Download, FileText, X } from 'lucide-react';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

interface VendorData {
    name: string;
    totalInspections: number;
    incompleteImageFile: number;
    incompleteDotForm: number;
    incompleteChecklist: number;
}

type VendorInspectionChartDatum = { name: string; count: number };

type StatusChartDatum = {
    vendor: string;
    pass: number;
    fail: number;
    incomplete: number;
    needsReview: number;
    complete: number;
};

type GenerateReportResponse = {
    success: boolean;
    message?: string;
    vendorInspectionCounts?: Array<{ vendorId: string; vendorName?: string; count: number }>;
    vendorReviewIssueAnalytics?: Array<{
        vendorId: string;
        vendorName?: string;
        totalIssues: number;
        breakdown: Array<{ missingData: string; count: number; percentage: number }>;
    }>;
    vendorInspectionStatusCounts?: Array<{
        vendorId: string;
        vendorName?: string;
        totalInspections: number;
        statusCounts: {
            complete: number;
            incomplete: number;
            pass: number;
            fail: number;
            'needs review': number;
        };
    }>;
};

type VendorIssueDetail = {
    vendorId: string;
    name: string;
    inspectionCount: number;
    totalIssues: number;
    breakdown: Array<{ missingData: string; count: number; percentage: number }>;
};

// Components
const ReportHeader = ({ close, onDownload }: { close: () => void; onDownload: () => void }) => (
    <div className=" pb-2 border-b border-gray-300">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <FileText size={24} color='#2563EB' />
                    <h1 className="text-xl font-semibold text-gray-800">Vendor Performance Report</h1>
                </div>
                <p className="text-sm text-gray-600">Data Period: All Available Data (6/8/2023 - 06/02/2025)</p>
            </div>
            <div className='flex gap-2 no-print'>
                <button onClick={onDownload} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border rounded-lg">
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

const TotalInspectionsChart: React.FC<{ data: VendorInspectionChartDatum[] }> = ({ data }) => (
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} width={60} label={{ value: 'Total Count', angle: -90, position: 'insideLeft', dx: 10, dy: 35 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                ))}
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const IssuesChart: React.FC<{ issuesByVendor: VendorData[] }> = ({ issuesByVendor }) => {
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
                <YAxis width={60} tick={{ fontSize: 12 }} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', dx: 10, dy: 35 }} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingRight: '20px' }} />
                <Bar dataKey="Incomplete Image File" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incomplete DOT Form" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incomplete Checklist" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

const formatMissingDataLabel = (missingData: string) => {
    const normalized = (missingData || '').trim().toLowerCase();
    if (!normalized) return '';
    if (normalized === 'incomplete image file') return 'Incomplete Image File';
    if (normalized === 'incomplete checklist') return 'Incomplete Checklist';
    if (normalized === 'incomplete dot form') return 'Incomplete DOT Form';

    return missingData;
};

const VendorDetails: React.FC<{ vendors: VendorIssueDetail[] }> = ({ vendors }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        {!vendors.length ? (
            <div className="text-sm text-gray-600">No vendor details available.</div>
        ) : (
            <div className="space-y-6">
                {vendors.map(vendor => (
                    <div key={vendor.vendorId}>
                        <div className="flex items-baseline justify-between gap-4 mb-3">
                            <h3 className="font-semibold text-gray-800">{vendor.name}</h3>
                            {/* <div className="text-xs text-gray-500 whitespace-nowrap">
                                Inspections: {vendor.inspectionCount} · Total Issues: {vendor.totalIssues}
                            </div> */}
                        </div>

                        <div className="space-y-2 text-sm">
                            {(vendor.breakdown || [])
                                .slice()
                                .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
                                .map((b, idx) => (
                                    <div key={`${vendor.vendorId}-${idx}`} className="flex justify-between gap-4">
                                        <span className="text-gray-600">{formatMissingDataLabel(b.missingData)}</span>
                                        <span className="font-medium">
                                            {Number(b.percentage || 0)}% ({Number(b.count || 0)} out of {Number(vendor.totalIssues || 0)} total issues)
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const StatusChart: React.FC<{ data: StatusChartDatum[] }> = ({ data }) => {
    const statusColors = {
        pass: '#10b981',
        fail: '#FF0000',
        incomplete: '#fbbf24',
        needsReview: '#f97316',
        complete: '#3b82f6'
    };

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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

const GeneratedReport = ({ close, selectedUnitIds }: { close: () => void; selectedUnitIds: string[] }) => {
    const [loading, setLoading] = useState(false);
    const [vendorInspections, setVendorInspections] = useState<VendorInspectionChartDatum[]>([]);
    const [issuesByVendor, setIssuesByVendor] = useState<VendorData[]>([]);
    const [currentStatus, setCurrentStatus] = useState<StatusChartDatum[]>([]);
    const [vendorIssueDetails, setVendorIssueDetails] = useState<VendorIssueDetail[]>([]);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);

                const res = await apiRequest('/api/reports/generateReport', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ unitIds: selectedUnitIds })
                });

                const json = (await res.json()) as GenerateReportResponse;
                console.log(json);

                if (!res.ok || !json?.success) {
                    throw new Error(json?.message || 'Failed to generate report');
                }

                const inspectionCounts = (json.vendorInspectionCounts || []).map(v => ({
                    name: (v.vendorName || v.vendorId).toString(),
                    count: Number(v.count || 0)
                }));

                const inspectionCountByVendorId = Object.fromEntries(
                    (json.vendorInspectionCounts || []).map(v => [String(v.vendorId), Number(v.count || 0)])
                ) as Record<string, number>;

                const normalizeMissingData = (missingData: string) => (missingData || '').trim().toLowerCase();

                const issueDetails = (json.vendorReviewIssueAnalytics || []).map(v => {
                    const actionableBreakdown = (v.breakdown || [])
                        .filter(b => normalizeMissingData(b.missingData) !== 'none')
                        .map(b => ({
                            missingData: (b.missingData || '').toString(),
                            count: Number(b.count || 0)
                        }));

                    const totalIssues = actionableBreakdown.reduce((sum, b) => sum + Number(b.count || 0), 0);

                    return {
                        vendorId: String(v.vendorId),
                        name: (v.vendorName || v.vendorId).toString(),
                        inspectionCount: Number(inspectionCountByVendorId[String(v.vendorId)] || 0),
                        totalIssues,
                        breakdown: actionableBreakdown.map(b => ({
                            missingData: b.missingData,
                            count: b.count,
                            percentage: totalIssues ? Math.round((b.count / totalIssues) * 10000) / 100 : 0
                        }))
                    };
                });

                const normalizedMissingDataKey = (missingData: string) => (missingData || '').trim().toLowerCase();

                const issues = issueDetails.map(v => {
                    const breakdown = v.breakdown || [];
                    const getPct = (key: string) => {
                        const found = breakdown.find(b => normalizedMissingDataKey(b.missingData) === normalizedMissingDataKey(key));
                        return Number(found?.percentage || 0);
                    };

                    return {
                        name: v.name,
                        totalInspections: 0,
                        incompleteImageFile: getPct('incomplete image file'),
                        incompleteDotForm: getPct('incomplete dot form'),
                        incompleteChecklist: getPct('incomplete checklist')
                    };
                });

                const statuses = (json.vendorInspectionStatusCounts || []).map(v => ({
                    vendor: (v.vendorName || v.vendorId).toString(),
                    pass: Number(v.statusCounts?.pass || 0),
                    fail: Number(v.statusCounts?.fail || 0),
                    incomplete: Number(v.statusCounts?.incomplete || 0),
                    needsReview: Number(v.statusCounts?.['needs review'] || 0),
                    complete: Number(v.statusCounts?.complete || 0)
                }));

                setVendorInspections(inspectionCounts);
                setVendorIssueDetails(issueDetails);
                setIssuesByVendor(issues);
                setCurrentStatus(statuses);
            } catch (e: any) {
                toast.error(e?.message || 'Error generating report');
                setVendorInspections([]);
                setVendorIssueDetails([]);
                setIssuesByVendor([]);
                setCurrentStatus([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    const handleDownloadPDF = () => {
        window.print();
    };

    return (
        <div className='p-6'>
            <style>{`@media print { body * { visibility: hidden; } .printable, .printable * { visibility: visible; } .printable { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`}</style>
            <div className="p-4 bg-[#FAFAFA] mt-4 printable">
                <ReportHeader close={close} onDownload={handleDownloadPDF} />

                <div className="mt-4 p-4">
                    {loading && (
                        <div className="text-sm text-gray-600 mb-4">Loading report…</div>
                    )}

                    <ChartSection title="Report 1A: Total Inspections by Vendor">
                        <TotalInspectionsChart data={vendorInspections} />
                    </ChartSection>

                    <ChartSection title="Report 1B: Percentage of Issues by Vendor">
                        <IssuesChart issuesByVendor={issuesByVendor} />
                    </ChartSection>

                    {/* <VendorDetails vendors={vendorIssueDetails} /> */}

                    <ChartSection title="Report 1C: Current Inspection Status Breakdown by Vendor">
                        <StatusChart data={currentStatus} />
                    </ChartSection>
                </div>
            </div>
        </div>
    );
};

export default GeneratedReport;