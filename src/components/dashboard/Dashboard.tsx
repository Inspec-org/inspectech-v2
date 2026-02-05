'use client'
import React, { Suspense, useContext, useEffect } from 'react'
import { LayoutDashboard } from 'lucide-react';
import Header from './Header'
import { StatsGrid } from './StatCard';
import MonthlyInspectionChart from './MonthlyInspection';
import PassRateCard from './PassRateCard';
import Inspections from './Inspections';
import QuickActions from './QuickAction';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { Department } from '../departments/DepartmentCard';
import { useSearchParams } from 'next/navigation';
import { UserContext } from '@/context/authContext';
import Cookies from 'js-cookie';
import useSWR from 'swr';

export interface Vendor {
    _id: string;
    name: string;
}

export interface stats {
    total: number;
    passPercentage: string;
    failPercentage: string;
    needsReviewPercentage: string;
}
interface monthlyData {
    pass: number,
    fail: number
}
export interface monthlyInspection {
    monthly: monthlyData[];
    quarterly: monthlyData[];
    annually: monthlyData[];
}

interface overallInspection {
    passRate: string;
    passCount: number;
    failCount: number;
}

export interface recentInspection {
    id: string;
    unitId: string;
    inspectionStatus: string;
    vendor: string;
    type: string;
    location: string;
    inspector: string;
    date: string;
    duration: string;
}

interface dashboadrData {
    stats: stats;
    monthlyInspection: monthlyInspection;
    overall: overallInspection;
}
interface recentData {
    recent: recentInspection[]
}

function Dashboard() {

    const [departments, setDepartments] = React.useState<Department[]>([]);

    const [vendors, setVendors] = React.useState<Vendor[]>([]);
    const [selectedDepartment, setSelectedDepartment] = React.useState<Department | null>(null);
    const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(null);
    const [dashboardData, setDashboardData] = React.useState<dashboadrData>();
    const [recentData, setRecentData] = React.useState<recentData>();
    const [loading, setLoading] = React.useState(true);
    const [recentloading, setRecentLoading] = React.useState(true);
    const { user } = useContext(UserContext);



    useEffect(() => {
        const department = Cookies.get("selectedDepartment");
        if (departments.length > 0) {

            const dept = departments.find(d => d.name === department) ?? null;
            ;
            setSelectedDepartment(dept);

        }
    }, [departments]);
    const { data: departmentsData } = useSWR(
        'departments',
        async () => {
            const res = await apiRequest("/api/departments/get-departments");
            const json = await res.json().catch(() => ({}));
            return Array.isArray(json?.departments) ? json.departments : [];
        },
        { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false }
    );
    useEffect(() => { if (departmentsData) setDepartments(departmentsData); }, [departmentsData]);

    const { data: vendorsData } = useSWR(
        'vendors:all',
        async () => {
            const res1 = await apiRequest('/api/vendors/get-vendors?page=1&limit=1');
            if (!res1.ok) return [];
            const json1 = await res1.json().catch(() => ({}));
            const total = Number(json1?.total ?? json1?.totalCount ?? (Array.isArray(json1?.vendors) ? json1.vendors.length : 0));
            const limit = Math.max(total, 1);
            const res2 = await apiRequest(`/api/vendors/get-vendors?page=1&limit=${limit}`);
            if (!res2.ok) return [];
            const json2 = await res2.json().catch(() => ({}));
            return Array.isArray(json2?.vendors) ? json2.vendors : [];
        },
        { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false }
    );
    useEffect(() => { if (vendorsData) setVendors(vendorsData); }, [vendorsData]);
    useEffect(() => {
        if (!vendors.length) return;

        const cookieVendorId = Cookies.get('selectedVendorId');
        const cookieVendorName = Cookies.get('selectedVendor');

        const byId = cookieVendorId
            ? vendors.find(v => String(v._id) === String(cookieVendorId))
            : undefined;

        const byName = !byId && cookieVendorName
            ? vendors.find(v => v.name === cookieVendorName)
            : undefined;

        const nextSelected = byId || byName || vendors[0];
        console.log("nextSelected", nextSelected);
        setSelectedVendor(nextSelected);
        Cookies.set('selectedVendor', nextSelected?.name || '');
        Cookies.set('selectedVendorId', nextSelected?._id || '');
    }, [vendors])

    useEffect(() => {
        const handleDept = () => {
            const departmentId = Cookies.get('selectedDepartmentId') || '';
            const dep = departments.find(d => String(d._id) === String(departmentId)) || null;
            setSelectedDepartment(dep);
        };
        const handleVendor = () => {
            const vendorId = Cookies.get('selectedVendorId') || '';
            const v = vendors.find(v => String(v._id) === String(vendorId)) || null;
            setSelectedVendor(v);
        };
        window.addEventListener('selectedDepartmentChanged', handleDept as EventListener);
        window.addEventListener('selectedVendorChanged', handleVendor as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', handleDept as EventListener);
            window.removeEventListener('selectedVendorChanged', handleVendor as EventListener);
        };
    }, [departments, vendors])

    const getRecent = async () => {
        const vendorId = Cookies.get('selectedVendorId') || ''
        const departmentId = Cookies.get('selectedDepartmentId') || ''

        try {
            setRecentLoading(true)
            const res = await apiRequest(("/api/dashboard/get_recent_inspections"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ vendorId, departmentId })
            });
            if (res.ok) {
                const json = await res.json();
                setRecentData(json.dashboard);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            toast.error(errorMessage);
        }
        finally {
            setRecentLoading(false)
        }
    }

    const shouldFetch = !!selectedDepartment && !!selectedVendor;
    const vendorId = Cookies.get('selectedVendorId') || '';
    const departmentId = Cookies.get('selectedDepartmentId') || '';

    const { data: dashboardDataSWR, isLoading: statsLoading, mutate: mutateStats } = useSWR(
        shouldFetch ? ['dashboard/allData', vendorId, departmentId] : null,
        async ([, vId, dId]) => {
            const res = await apiRequest("/api/dashboard/allData", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendorId: vId, departmentId: dId })
            });
            const json = await res.json().catch(() => ({}));
            return json?.dashboard || null;
        },
        { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false }
    );
    useEffect(() => { setDashboardData(dashboardDataSWR || undefined); setLoading(statsLoading || (shouldFetch && !dashboardDataSWR)); }, [statsLoading, dashboardDataSWR, shouldFetch]);

    const { data: recentDataSWR, isLoading: recentLoadingSWR, mutate: mutateRecent } = useSWR(
        shouldFetch ? ['dashboard/recent', vendorId, departmentId] : null,
        async ([, vId, dId]) => {
            const res = await apiRequest("/api/dashboard/get_recent_inspections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendorId: vId, departmentId: dId })
            });
            const json = await res.json().catch(() => ({}));
            return json?.dashboard || null;
        },
        { revalidateOnFocus: false, revalidateIfStale: false, revalidateOnReconnect: false }
    );
    useEffect(() => { setRecentLoading(recentLoadingSWR); setRecentData(recentDataSWR || undefined); }, [recentLoadingSWR, recentDataSWR]);

    useEffect(() => {
        if (!selectedDepartment || !selectedVendor) return;
        const vId = Cookies.get('selectedVendorId') || '';
        const dId = Cookies.get('selectedDepartmentId') || '';
        const es = new EventSource(`/api/dashboard/stream?vendorId=${encodeURIComponent(vId)}&departmentId=${encodeURIComponent(dId)}`);
        es.onmessage = () => { mutateStats(); mutateRecent(); };
        es.onerror = () => {};
        return () => es.close();
    }, [selectedDepartment, selectedVendor]);

    return (
        <Suspense fallback={<div>Loading...</div>}>

            <div className='w-full bg-white space-y-4 p-4 shadow-2xl rounded-2xl'>
                <div className="flex items-center gap-3 p-2 border-b border-purple-100 bg-gradient-to-r from-[#FAF5FF] from-[0%] to-[#ded1eb] to-[100%] rounded-xl">
                    <div className="p-1.5 rounded-md ">
                        <LayoutDashboard className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900">Dashboard</h1>

                    </div>
                </div>
                {/* <Header departments={departments} setSelectedDepartment={setSelectedDepartment} selectedDepartment={departments.find(d => d.name === selectedDepartment?.name)} vendors={vendors} setSelectedVendor={setSelectedVendor} selectedVendor={vendors.find(v => v.name === selectedVendor?.name)}
                /> */}
                <StatsGrid data={dashboardData?.stats || null} loading={loading} />
                <div className="grid grid-cols-12 gap-4 items-stretch">
                    <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="h-full">
                            <MonthlyInspectionChart data={dashboardData?.monthlyInspection} loading={loading} />
                        </div>
                    </div>
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <PassRateCard
                                passRate={Number(dashboardData?.overall?.passRate) || 0}
                                passed={Number(dashboardData?.overall?.passCount) || 0}
                                failed={Number(dashboardData?.overall?.failCount) || 0}
                                loading={loading}
                            />

                        </div>
                    </div>
                </div>
                <div className=" items-stretch">
                    {/* <div className="xl:col-span-8 col-span-12 h-full">
                        <div className="">
                            <Inspections recentInspections={recentData?.recent || []} loading={recentloading} onRefresh={getRecent} />
                        </div>
                    </div> */}
                    <div className="xl:col-span-4 col-span-12 h-full">
                        <div className="h-full">
                            <QuickActions role={user?.role || ''} />
                        </div>
                    </div>
                </div>


            </div>
        </Suspense>
    )
}

export default Dashboard
