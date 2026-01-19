import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, Clock, BarChart3, CalendarClock, Activity, CheckSquare } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import Cookies from 'js-cookie';

// Types
interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle: string;
    color: string;
}

// Data
const inspectionStatusData = [
    { name: 'Passed', value: 9512, percentage: 91, color: '#10b981' },
    { name: 'Failed', value: 512, percentage: 9, color: '#ef4444' }
];

const statusBreakdownData = [
    { period: 'Last 3 months', total: 42, pass: 22, fail: 20 },
];

export const trendsData = {
    monthly: {
        passRate: [
            { date: "Jan '25", passRate: 82 },
            { date: "Feb '25", passRate: 85 },
            { date: "Mar '25", passRate: 88 },
            { date: "Apr '25", passRate: 90 },
            { date: "May '25", passRate: 92 },
            { date: "Jun '25", passRate: 94 },
            { date: "Jul '25", passRate: 85 },
            { date: "Aug '25", passRate: 92 },
            { date: "Sep '25", passRate: 95 },
            { date: "Oct '25", passRate: 98 },
            { date: "Nov '25", passRate: 96 },
            { date: "Dec '25", passRate: 97 }
        ],

        volume: [
            { date: "Jan '25", inspections: 22 },
            { date: "Feb '25", inspections: 25 },
            { date: "Mar '25", inspections: 27 },
            { date: "Apr '25", inspections: 29 },
            { date: "May '25", inspections: 31 },
            { date: "Jun '25", inspections: 33 },
            { date: "Jul '25", inspections: 28 },
            { date: "Aug '25", inspections: 35 },
            { date: "Sep '25", inspections: 32 },
            { date: "Oct '25", inspections: 30 },
            { date: "Nov '25", inspections: 34 },
            { date: "Dec '25", inspections: 36 }
        ]
    },

    quarterly: {
        passRate: [
            { date: "Q1 '25", passRate: 85 },
            { date: "Q2 '25", passRate: 91 },
            { date: "Q3 '25", passRate: 92 },
            { date: "Q4 '25", passRate: 97 }
        ],

        volume: [
            { date: "Q1 '25", inspections: 74 },
            { date: "Q2 '25", inspections: 93 },
            { date: "Q3 '25", inspections: 95 },
            { date: "Q4 '25", inspections: 100 }
        ]
    },

    yearly: {
        passRate: [
            { date: "2022", passRate: 76 },
            { date: "2023", passRate: 83 },
            { date: "2024", passRate: 88 },
            { date: "2025", passRate: 95 }
        ],

        volume: [
            { date: "2022", inspections: 245 },
            { date: "2023", inspections: 289 },
            { date: "2024", inspections: 315 },
            { date: "2025", inspections: 352 }
        ]
    }
};


const sanitizeBinSize = (v: string): number => {
    if (!v) return 3; // default

    // auto or random string → use auto (3)
    if (v.trim().toLowerCase() === "auto") return 3;

    // Extract any leading number
    const m = v.match(/^(\d+)/);

    // If found, use that number
    if (m) return Number(m[1]);

    // No valid number → fallback to auto
    return 3;
};

// Components
const DashboardHeader = ({ time, setTime }: { time: string, setTime: (val: string) => void }) => (
    <div className="bg-white border-gray-200">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Analytics Dashboard</h1>
            <CustomDropdown
                options={[
                    { value: "All Time", label: "All Time" },
                    { value: "Last Month", label: "Last Month" },
                    { value: "Last 3 Months", label: "Last 3 Months" },
                    { value: "Last 6 Months", label: "Last 6 Months" },
                    { value: "Last Year", label: "Last Year" },

                ]}
                icon={<CalendarClock className="w-5 h-5" color='#9333EA' />}
                width="200px"
                value={time}
                onChange={(val) => setTime(val)}
            />
        </div>
    </div >
);

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle, color }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg`}>
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
                <p className={`text-2xl font-bold text-[${color}] mb-1`}>{value}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
        </div>
    </div>
);

const InspectionStatusOverview: React.FC<{ total: number; pass: number; fail: number; statusData: { name: string; value: number; percentage: number; color: string }[] }> = ({ total, pass, fail, statusData }) => {
    const hasData = statusData && statusData.length > 0 && statusData.some(d => d.value > 0);

    return (
        <div className="bg-white rounded-lg mt-4 p-6">
            <div className="flex items-start gap-2 mb-4">
                <div>
                    <Activity size={18} className="text-[#7522BB] mt-1" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Status Overview</h2>
                    <p className="text-sm text-gray-600">Distribution of pass/fail inspections</p>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <StatCard
                        icon={<CheckSquare size={20} className="text-[#9333EA]" />}
                        title="Total Inspections"
                        value={String(total)}
                        subtitle="View All Inspection"
                        color="#9333EA"
                    />
                    <StatCard
                        icon={<CheckCircle size={20} className="text-[#10B981]" />}
                        title="Passed Inspections"
                        value={String(pass)}
                        subtitle={`${statusData.find(d => d.name === 'Passed')?.percentage ?? 0}% of total`}
                        color="#10B981"
                    />
                    <StatCard
                        icon={<XCircle size={20} className="text-[#EF4545]" />}
                        title="Fail"
                        value={String(fail)}
                        subtitle={`${statusData.find(d => d.name === 'Failed')?.percentage ?? 0}% of total`}
                        color="#EF4545"
                    />
                </div>
                <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
                    {hasData ? (
                        <>
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={150}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-gray-600">Passed ({pass}) - {statusData.find(d => d.name === 'Passed')?.percentage ?? 0}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-gray-600">Failed ({fail}) - {statusData.find(d => d.name === 'Failed')?.percentage ?? 0}%</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="bg-gray-100 rounded-full p-6 mb-4">
                                <BarChart3 size={48} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Inspection Data</h3>
                            <p className="text-sm text-gray-500 max-w-xs">
                                There are no Pass or Fail Inspections recorded yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const InspectionStatusBreakdown: React.FC<{ data: { period: string; total: number; pass: number; fail: number }[] }> = ({ data }) => (
    <div className="bg-white mt-4 rounded-lg ">
        <div className="flex items-start gap-2 mb-4">
            <div>
                <BarChart3 size={18} className="text-[#7522BB] mt-1" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Status Breakdown</h2>
                <p className="text-sm text-gray-600">Current distribution of inspection results</p>
            </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} barSize={190}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Number of inspections', angle: -90, position: 'center', style: { fontSize: 14 }, dx: -15 }} tick={{ fontSize: 12 }} padding={{ top: 20 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                <Bar dataKey="total" name="Total" fill="#8B5CF6" radius={[4, 4, 0, 0]} >
                    <LabelList dataKey="total" position="top" fill="#8B5CF6" />
                </Bar>
                <Bar dataKey="pass" name="Pass" fill="#10B981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="pass" position="top" fill="#10B981" />
                </Bar>
                <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="fail" position="top" fill="#ef4444" />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
);

const InspectionTrends: React.FC<{
    trends: {
        monthly: {
            passRate: { date: string; passRate: number }[];
            volume: { date: string; pass: number; fail: number }[];
        };
        quarterly: {
            passRate: { date: string; passRate: number }[];
            volume: { date: string; pass: number; fail: number }[];
        };
        yearly: {
            passRate: { date: string; passRate: number }[];
            volume: { date: string; pass: number; fail: number }[];
        };
    };
}> = ({ trends }) => {
    const [activeTab, setActiveTab] = useState("Pass Rate");

    const displayedTrend = trends.monthly[activeTab === "Pass Rate" ? "passRate" : "volume"];

    return (
        <div className="bg-white mt-4 rounded-lg">
            <div className="flex justify-between items-start gap-2 mb-4">
                <div className="flex items-start gap-2 ">
                    <div>
                        <Activity size={18} className="text-[#7522BB] mt-1" />
                    </div>
                    <div className='flex flex-col justify-start items-start'>
                        <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Trends</h2>
                        <p className="text-sm text-gray-600">
                            Inspection volumes and pass rates over time
                        </p>
                    </div>
                </div>
                <div className="flex justify-start gap-10 mb-6">
                    {/* Tab for Pass Rate / Volume */}
                    <div className="flex bg-purple-100 p-1 rounded-lg">
                        {["Pass Rate", "Volume"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-700"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>


                </div>
            </div>



            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />

                    {/* Left Axis → Only show for Volume */}
                    {activeTab === "Volume" && (
                        <YAxis
                            yAxisId="left"
                            label={{
                                value: "Inspections",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: 12 },
                            }}
                            tick={{ fontSize: 12 }}
                            axisLine={true}
                            tickLine={true}
                            allowDecimals={false}
                        />
                    )}

                    {/* Right Axis → Only show for Pass Rate */}
                    {activeTab === "Pass Rate" && (
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            label={{
                                value: "Pass Rate %",
                                angle: 90,
                                position: "insideLeft",
                                style: { fontSize: 12 },
                            }}
                            tick={{ fontSize: 12 }}
                            axisLine={true}
                            tickLine={true}
                            allowDecimals={false}
                        />
                    )}

                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />

                    {/* Volume: Pass + Fail */}
                    {activeTab === "Volume" && (
                        <>
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="pass"
                                name="Pass"
                                stroke="#16a34a"
                                strokeWidth={2}
                                dot={{ fill: "#16a34a", r: 4 }}
                            />

                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="fail"
                                name="Fail"
                                stroke="#dc2626"
                                strokeWidth={2}
                                dot={{ fill: "#dc2626", r: 4 }}
                            />
                        </>
                    )}

                    {/* Pass Rate */}
                    {activeTab === "Pass Rate" && (
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="passRate"
                            name="Pass Rate"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: "#8b5cf6", r: 4 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>

        </div>
    );
};


const InspectionDurationAnalysis: React.FC<{ durationData: { range: string; count: number }[], setBinSize: React.Dispatch<React.SetStateAction<string>>, binSize: string, onApply: () => void }> = ({ durationData, setBinSize, binSize, onApply }) => {
    return (
        <div className="bg-white mt-4 rounded-lg">
            <div className="flex items-start gap-2 mb-4">
                <div>
                    <Clock size={18} className="text-[#7522BB] mt-1" />
                </div>
                <div className='flex flex-col justify-start items-start'>
                    <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Duration Analysis</h2>
                    <p className="text-sm text-gray-600">Distribution of inspection durations</p>
                </div>
            </div>
            <div className="flex justify-end items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Bin Size (minutes):</label>
                    <input
                        type="text"
                        value={binSize}
                        onChange={(e) => {
                            const value = e.target.value.toLowerCase();

                            // allow empty
                            if (value === "") {
                                setBinSize("");
                                return;
                            }

                            // allow typing 'auto' gradually
                            if ("auto".startsWith(value)) {
                                setBinSize(value);
                                return;
                            }

                            // allow only digits <= 60
                            if (/^\d+$/.test(value)) {
                                const num = Number(value);
                                setBinSize(num > 60 ? "60" : value);
                                return;
                            }

                            // anything else is blocked
                        }}
                        className="w-[100px] px-3 py-1 border border-gray-300 rounded-md bg-[#FAF7FF]"
                    />
                </div>
                <button className="px-4 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors" onClick={onApply}>Apply</button>
                <span className="text-xs text-gray-500">(Enter "auto" or a number)</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} axisLine={false} tickLine={false} />
                    <YAxis label={{ value: 'Number of inspections', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                    <Bar dataKey="count" name="Inspections" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
};

// Main App
const AnalysisDashboard: React.FC = () => {
    const [time, setTime] = useState('All Time');
    const [statusData, setStatusData] = useState<{ name: string; value: number; percentage: number; color: string }[]>([]);
    const [totals, setTotals] = useState<{ total: number; pass: number; fail: number }>({ total: 0, pass: 0, fail: 0 });
    const [breakdownData, setBreakdownData] = useState<{ period: string; total: number; pass: number; fail: number }[]>([]);
    const [binSize, setBinSize] = useState<string>("auto")
    const [trends, setTrends] = useState<{ monthly: { passRate: { date: string; passRate: number }[]; volume: { date: string; pass: number; fail: number }[] }; quarterly: { passRate: { date: string; passRate: number }[]; volume: { date: string; pass: number; fail: number }[] }; yearly: { passRate: { date: string; passRate: number }[]; volume: { date: string; pass: number; fail: number }[] } }>({ monthly: { passRate: [], volume: [] }, quarterly: { passRate: [], volume: [] }, yearly: { passRate: [], volume: [] } });
    const [duration, setDuration] = useState<{ range: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [vendor, setVendor] = useState('');
    const [dept, setDept] = useState('');
    const [inspectionCount, setInspectionCount] = useState(0);
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [appliedBinSize, setAppliedBinSize] = useState(3);

    useEffect(() => {
        const read = () => {
            const vendorId = Cookies.get('selectedVendorId') || '';
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            setVendor(vendorId);
            setDept(departmentId);
        };
        read();
        const onDept = () => {
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            setDept(departmentId);
        };
        const onVendor = () => {
            const vendorId = Cookies.get('selectedVendorId') || '';
            setVendor(vendorId);
        };
        window.addEventListener('selectedDepartmentChanged', onDept as EventListener);
        window.addEventListener('selectedVendorChanged', onVendor as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', onDept as EventListener);
            window.removeEventListener('selectedVendorChanged', onVendor as EventListener);
        };
    }, [])


    // 🔹 Fetch Duration API
    const fetchDuration = async () => {
        const bin = sanitizeBinSize(binSize);
        try {
            const res = await apiRequest('/api/reports/get-duration-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId: vendor, departmentId: dept, timeRange: time, binSize: bin })
            });
            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to load duration');
            setDuration(json.analytics.durations);
            setAppliedBinSize(bin);
            // Set metadata from response
            if (json.analytics.metadata) {
                setInspectionCount(json.analytics.metadata.totalInspections);
                setDateRange({
                    from: json.analytics.metadata.dateFrom,
                    to: json.analytics.metadata.dateTo
                });
            }
        } catch (e: any) {
            toast.error(e?.message || 'Error loading duration analytics');
        }
    };
    // 🔹 Fetch other analytics
    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await apiRequest('/api/reports/get-analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vendorId: vendor, departmentId: dept, timeRange: time })
            });
            const json = await res.json();
            ;
            if (!res.ok || !json?.success) throw new Error(json?.message || 'Failed to load analytics');
            const a = json.analytics;
            setTotals({ total: a.status.total, pass: a.status.pass, fail: a.status.fail });
            setStatusData(a.status.pie);
            setBreakdownData([{ period: a.breakdown.period, total: a.breakdown.total, pass: a.breakdown.pass, fail: a.breakdown.fail }]);
            setTrends(a.trends);
        } catch (e: any) {
            toast.error(e?.message || 'Error loading analytics');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 On page load / time change
    useEffect(() => {
        if (!vendor || !dept) return;
        fetchAnalytics();
        fetchDuration();
    }, [time, vendor, dept]);

    // 🔹 Handle Apply button click
    const handleApply = () => {
        // If empty or invalid, default to "auto"
        if (!binSize || binSize.trim() === "" ||
            (binSize.trim().toLowerCase() !== "auto" && !/^\d+$/.test(binSize))) {
            setBinSize("auto");
        }

        fetchDuration();
    };

    return (
        <div className="">
            {loading && (
                <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
                    <ClipLoader color="#0075FF" size={40} />
                </div>
            )}
            <DashboardHeader time={time} setTime={setTime} />
            <div className="space-y-10">
                <InspectionStatusOverview total={totals.total} pass={totals.pass} fail={totals.fail} statusData={statusData} />
                <InspectionStatusBreakdown data={breakdownData} />
                <InspectionTrends trends={trends} />
                <InspectionDurationAnalysis durationData={duration} binSize={binSize} setBinSize={setBinSize} onApply={handleApply} />
            </div>
            <div className='text-center mt-16 text-lg text-gray-600'>
                <p>
                    Based on {inspectionCount} inspection{inspectionCount !== 1 ? 's' : ''}
                    {dateRange.from && dateRange.to && ` from ${dateRange.from} to ${dateRange.to}`} ·
                    Using {appliedBinSize} minute bins
                </p>
            </div>
        </div>
    );
};

export default AnalysisDashboard;
