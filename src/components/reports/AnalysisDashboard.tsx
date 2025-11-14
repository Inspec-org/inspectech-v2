import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TrendingUp, CheckCircle, XCircle, Clock, BarChart3, CalendarClock, Activity, CheckSquare } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';

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



const durationData = [
    { range: '0-6 min', count: 25 },
    { range: '6-11 min', count: 3 },
    { range: '11-16 min', count: 0 },
    { range: '14-17 min', count: 0 },
    { range: '17-22 min', count: 0 },
    { range: '22-28 min', count: 0 },
    { range: '23-28 min', count: 5 }
];

// Components
const DashboardHeader = ({ time, setTime }: { time: string, setTime: (val: string) => void }) => (
    <div className="bg-white p-6 border-gray-200">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h1>
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

const InspectionStatusOverview: React.FC = () => (
    <div className="bg-white p-6 rounded-lg">
        <div className="flex justify-start items-start gap-2 mb-4">
            <div className='self-start'>
                <Activity size={28} className="text-[#7522BB]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Status Overview</h2>
                <p className="text-sm text-gray-600">Distribution of pass/fail inspections</p>
            </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <StatCard
                    icon={<CheckSquare size={20} className="text-[#9333EA]" />}
                    title="Total Inspections"
                    value="9512"
                    subtitle="View All Inspection"
                    color="#9333EA"
                />
                <StatCard
                    icon={<CheckCircle size={20} className="text-[#10B981]" />}
                    title="Passed Inspections"
                    value="5232"
                    subtitle="33% of total"
                    color="#10B981"
                />
                <StatCard
                    icon={<XCircle size={20} className="text-[#EF4545]" />}
                    title="Fail"
                    value="83"
                    subtitle="9% of total"
                    color="#EF4545"
                />
            </div>

            <div className="flex items-center justify-center" style={{ width: 600, height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={inspectionStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={150}  // change this to make the pie bigger
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {inspectionStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Passed (91) - 91%</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Failed (9) - 9%</span>
            </div>
        </div>
    </div>
);

const InspectionStatusBreakdown: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-start gap-2 mb-4">
            <div>
                <BarChart3 size={18} className="text-[#7522BB]" />
            </div>
            <div>
                <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Status Breakdown</h2>
                <p className="text-sm text-gray-600 mb-6">Current distribution of inspection results</p>
            </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusBreakdownData} barSize={190}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12 }}

                />
                <YAxis
                    label={{ value: 'Number of inspections', angle: -90, position: '', style: { fontSize: 14 } }}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="square"
                />
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

const InspectionTrends: React.FC = () => {
    const [activeTimeTab, setActiveTimeTab] = useState('Monthly');
    const [activeTab, setActiveTab] = useState('Pass Rate');

    const displayedTrend =
        activeTimeTab === "Monthly"
            ? trendsData.monthly[activeTab === "Pass Rate" ? "passRate" : "volume"]
            : activeTimeTab === "Quarterly"
                ? trendsData.quarterly[activeTab === "Pass Rate" ? "passRate" : "volume"]
                : trendsData.yearly[activeTab === "Pass Rate" ? "passRate" : "volume"];


    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-[#7522BB]" />
                <h2 className="text-lg font-semibold text-[#7522BB]">Inspection Trends</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">Inspection volumes and pass rates over time</p>

            <div className="flex justify-between gap-10 mb-6">
                {/* 1st group */}
                <div className="flex bg-purple-100 p-1 rounded-lg">
                    {['Pass Rate', 'Volume'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* 2nd group */}
                <div className="flex bg-purple-100 p-1 rounded-lg">
                    {['Monthly', 'Quarterly', 'Yearly'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTimeTab(tab)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition ${activeTimeTab === tab
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        label={{ value: 'Inspections', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        label={{ value: 'Pass Rate %', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="inspections"
                        name="Volume"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={{ fill: '#4f46e5', r: 4 }}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="passRate"
                        name="Pass Rate"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const InspectionDurationAnalysis: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
            <div>
                <Clock size={18} className="text-[#7522BB]" />
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
                    value="5m"
                    className="w-[100px] px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                    readOnly
                />
            </div>
            <button className="px-4 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors">
                Apply
            </button>
            <span className="text-xs text-gray-500">(Enter "auto" or a number)</span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    label={{ value: 'Number of inspections', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                <Bar dataKey="count" name="Inspections" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>

        <p className="text-xs text-gray-500 text-center mt-4">
            Based on 33 inspections from 7/3/2025 to 10/23/2025 · Using 3 minute bins
        </p>
    </div>
);

// Main App
const AnalysisDashboard: React.FC = () => {
    const [time, setTime] = useState('All Time');
    return (
        <div className="">
            <DashboardHeader time={time} setTime={setTime} />

            <div className="">
                <InspectionStatusOverview />
                <InspectionStatusBreakdown />
                <InspectionTrends />
                <InspectionDurationAnalysis />
            </div>
        </div>
    );
};

export default AnalysisDashboard;