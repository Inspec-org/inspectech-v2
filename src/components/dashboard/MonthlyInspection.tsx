"use client";
import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
import type { ApexOptions } from "apexcharts";
import { monthlyInspection } from "./Dashboard";
import { ClipLoader } from "react-spinners";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import Cookies from "js-cookie";
import { apiRequest } from "@/utils/apiWrapper";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

const YearHeader = ({ year, setYear }: { year: number; setYear: (val: number) => void }) => (
    <div className="flex items-center justify-center gap-3 border-2 rounded-xl border-purple-400 p-1">
        <button
            onClick={() => setYear(year - 1)}
            className="p-1 rounded hover:bg-white/10"
        >
            <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm font-medium">{year}</span>

        <button
            onClick={() => setYear(Math.min(new Date().getFullYear(), year + 1))}
            disabled={year >= new Date().getFullYear()}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-40"
        >
            <ChevronRight className="w-4 h-4" />
        </button>
    </div>
);

const QUARTERS = ["Q1","Q2","Q3","Q4"];

type InspectionApi = {
    labels: string[];
    passData: number[];
    failData: number[];
    year: number;
};

type ViewType = "Monthly" | "Quarterly" | "Annually";



export default function MonthlyInspectionChart({ data, loading }: { data?: monthlyInspection, loading: boolean }) {
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [quarterData, setQuarterData] = useState<{ pass: number; fail: number }[]>([]);
    const [yearLoading, setYearLoading] = useState<boolean>(false);

    useEffect(() => {
        const vendorId = Cookies.get('selectedVendorId') || '';
        const departmentId = Cookies.get('selectedDepartmentId') || '';
        if (!vendorId || !departmentId) {
            setQuarterData([]);
            return;
        }
        setYearLoading(true);
        (async () => {
            try {
                const res = await apiRequest('/api/dashboard/get_quarterly_by_year', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ vendorId, departmentId, year })
                });
                if (res.ok) {
                    const json = await res.json();
                    setQuarterData(json?.data?.quarterly ?? []);
                } else {
                    setQuarterData([]);
                }
            } catch {
                setQuarterData([]);
            } finally {
                setYearLoading(false);
            }
        })();
    }, [year]);

    const chartData = useMemo(() => {
        const selected = Array.from({ length: 4 }, (_, i) => quarterData?.[i] ?? { pass: 0, fail: 0 });
        const labels = QUARTERS;
        const passData = selected.map(i => i.pass);
        const failData = selected.map(i => i.fail);
        return { labels, passData, failData };
    }, [quarterData]);

    const options: ApexOptions = useMemo(
        () => ({
            chart: {
                type: "area",
                height: 350,
                toolbar: { show: false },
                fontFamily: "Inter, sans-serif",
                stacked: false,
            },
            colors: ["#10B981", "#EF4444"], // Green for Pass, Red for Fail
            stroke: {
                curve: "smooth",
                width: 2,
            },
            dataLabels: { enabled: false },
            fill: {
                type: "gradient",
                gradient: {
                    opacityFrom: 0.6,
                    opacityTo: 0.1,
                    stops: [0, 90, 100],
                },
            },
            grid: {
                borderColor: "#f1f5f9",
                strokeDashArray: 0,
                yaxis: { lines: { show: true } },
                xaxis: { lines: { show: false } },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 10,
                    left: 10,
                },
            },
            xaxis: {
                categories: chartData?.labels ?? [],
                tickPlacement: "on",
                axisBorder: { show: false },
                axisTicks: { show: false },
                tickAmount: 4,
                labels: {
                    rotate: 0,
                    hideOverlappingLabels: false,
                    style: {
                        fontSize: "12px",
                        colors: "#94a3b8",
                        fontWeight: 400,
                    }
                },
                tooltip: { enabled: false },
            },
            yaxis: {
                min: 0,
                labels: {
                    formatter: (v) => Math.round(v).toString(),
                    style: {
                        fontSize: "12px",
                        colors: ["#94a3b8"],
                        fontWeight: 400,
                    },
                },
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (v) => Math.round(v).toString(),
                },
            },
            legend: {
                show: true,
                position: "bottom",
                horizontalAlign: "center",
                offsetY: 0,
                fontSize: "13px",
                fontWeight: 500,
                markers: {
                    size: 6,
                    shape: "square" as const,
                    offsetX: -2,
                },
                itemMargin: {
                    horizontal: 16,
                    vertical: 0,
                },
                labels: {
                    colors: "#64748b",
                },
            },
        }),
        [chartData?.labels]
    );

    const series = useMemo(
        () => [
            { name: "Pass", data: chartData?.passData ?? [] },
            { name: "Fail", data: chartData?.failData ?? [] }
        ],
        [chartData]
    );


    return (
        <div className="bg-white p-6 border border-gray-200 rounded-2xl">
            <div className="flex xl:flex-row flex-col justify-between xl:items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg">
                    Quarterly Inspection Results ({year})
                </h3>
                <div className="w-full xl:w-auto">
                    <YearHeader year={year} setYear={setYear} />
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                    {(loading || yearLoading) ? (
                        <div className="flex justify-center items-center h-[290px]">
                            <ClipLoader color="#465fff" size={30} />
                        </div>
                    ) : (
                        <ReactApexChart
                            options={options}
                            series={series}
                            type="area"
                            height={290}
                        />
                    )}


                </div>
            </div>
        </div>
    );
}