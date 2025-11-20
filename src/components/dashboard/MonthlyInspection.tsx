"use client";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import { monthlyInspection } from "./Dashboard";
import { ClipLoader } from "react-spinners";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

type InspectionApi = {
    labels: string[];
    passData: number[];
    failData: number[];
    year: number;
};

type ViewType = "Monthly" | "Quarterly" | "Annually";



export default function MonthlyInspectionChart({ data, loading }: { data?: monthlyInspection, loading: boolean }) {
    const [view, setView] = useState<ViewType>("Monthly");

    const chartData = useMemo(() => {
        if (!data) return null;

        const selected =
            view === "Monthly" ? data.monthly :
                view === "Quarterly" ? data.quarterly :
                    data.annually;

        const labels =
            view === "Monthly" ? ["W1", "W2", "W3", "W4"] :
                view === "Quarterly" ? ["Q1", "Q2", "Q3", "Q4"] :
                    MONTHS; // 12 months

        const passData = selected.map(i => i.pass);
        const failData = selected.map(i => i.fail);

        return { labels, passData, failData };
    }, [data, view]);

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
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
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
                max: 250,
                tickAmount: 5,
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
        <div className="bg-white px-6 pt-6 border border-gray-200 rounded-2xl">
            <div className="flex xl:flex-row flex-col justify-between xl:items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg">
                    Monthly Inspection Results
                </h3>
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    {(["Monthly", "Quarterly", "Annually"] as ViewType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setView(type)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === type
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[600px]">
                    {loading ? (
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