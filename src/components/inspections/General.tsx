'use client'
import React, { useContext, useEffect } from 'react'
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { FormData } from './Edit';
import { UserContext } from '@/context/authContext';

function General({ type, formData, setFormData, disabledUnitId }: { type: string; formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>>; disabledUnitId?: boolean }) {
    const { user } = useContext(UserContext);
    // 🔹 handle input & dropdown changes
    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // 🔹 handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form Submitted:", formData);
        // You can now send `formData` to backend API here
    };
    useEffect(() => {
        const vendor = sessionStorage.getItem("selectedVendor");
        if (vendor) {
            setFormData((prev) => ({ ...prev, vendor: vendor }));
        }
    }, [])
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Unit ID */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 items-start border-b pb-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Unit ID
                        </label>
                        <p className="text-xs text-blue-600 mt-1">
                            Unit ID cannot be changed after creation
                        </p>
                    </div>
                    <input
                        type="text"
                        value={formData.unitId}
                        onChange={(e) => handleChange("unitId", e.target.value)}
                        disabled={type === "edit" || !!disabledUnitId}
                        placeholder='Enter Equipment ID/Trailer Number'
                        className={`lg:w-[300px] w-full px-3 py-2 ${type === "edit" || !!disabledUnitId ? "bg-gray-100" : "bg-[#FAF7FF]"} focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-300 rounded-lg text-gray-700`}
                    />
                </div>

                {/* Inspection Status */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Inspection Status
                    </label>
                    <CustomDropdown
                        options={[
                            { value: "pass", label: `PASS${user?.role === 'vendor' ? ' (Admin Only)' : ''}`, disabled: user?.role === 'vendor' },
                            { value: "fail", label: `FAIL${user?.role === 'vendor' ? ' (Admin Only)' : ''}`, disabled: user?.role === 'vendor' },
                            { value: "needs review", label: `NEEDS REVIEW${user?.role === 'vendor' ? ' (Admin Only)' : ''}`, disabled: user?.role === 'vendor' },
                            { value: "out of cycle (delivered)", label: `OUT OF CYCLE (DELIVERED)${user?.role === 'vendor' ? ' (Admin Only)' : ''}`, disabled: user?.role === 'vendor' },
                            { value: "no inspection (delivered)", label: `NO INSPECTION (DELIVERED)${user?.role === 'vendor' ? ' (Admin Only)' : ''}`, disabled: user?.role === 'vendor' },
                            { value: "incomplete", label: "INCOMPLETE" },
                            { value: "complete", label: "COMPLETE" },
                        ]}
                        width="lg:w-[300px] w-full"
                        value={formData.inspectionStatus}
                        onChange={(val) => handleChange("inspectionStatus", val)}
                    />
                </div>

                {/* Review Reason */}
                {formData.inspectionStatus === "needs review" && (
                    <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Review Reason
                        </label>
                        <CustomDropdown
                            options={[
                                { value: "incomplete_image", label: "Incomplete Image File" },
                                { value: "incomplete_dot", label: "Incomplete DOT Form" },
                                { value: "incomplete_checklist", label: "Incomplete Checklist" },
                            ]}
                            width="300px"
                            placeholder="Select review reason"
                            value={formData.reviewReason}
                            onChange={(val) => handleChange("reviewReason", val)}
                        />
                    </div>
                )}


                {/* Type */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        className="lg:w-[300px] w-full px-3 py-2 bg-[#FAF7FF] border border-purple-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Inspector */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Inspector
                    </label>
                    <input
                        type="text"
                        value={formData.inspector}
                        onChange={(e) => handleChange("inspector", e.target.value)}
                        placeholder='Enter Inspector Name'
                        className="lg:w-[300px] w-full px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Vendor */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Vendor
                    </label>
                    <input
                        type="text"
                        value={formData.vendor}
                        disabled
                        onChange={(e) => handleChange("vendor", e.target.value)}
                        className="lg:w-[300px] w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                    />
                </div>

                {/* Location */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Location
                    </label>
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        className="lg:w-[300px] w-full px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Delivered */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Delivered
                    </label>
                    <CustomDropdown
                        options={[
                            { value: "no", label: "NO" },
                            { value: "yes", label: "YES" },
                        ]}
                        width="200px"
                        value={formData.delivered}
                        onChange={(val) => handleChange("delivered", val)}
                    />
                </div>

                {/* Duration */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Duration
                    </label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number" min={0}
                            value={formData.durationMin}
                            onChange={(e) => handleChange("durationMin", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-sm text-gray-500">min</span>
                        <input
                            type="number" min={0}
                            value={formData.durationSec}
                            onChange={(e) => handleChange("durationSec", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-sm text-gray-500">sec</span>
                    </div>
                </div>

                {/* Date */}
                <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            min={1}
                            max={12}
                            value={formData.dateMonth}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const raw = Number(e.target.value);
                                const value = Math.min(12, Math.max(1, raw));
                                handleChange("dateMonth", value.toString());
                            }}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={formData.dateDay}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const raw = Number(e.target.value);
                                const value = Math.min(31, Math.max(1, raw));
                                handleChange("dateDay", value.toString());
                            }}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                            type="number" min={2000}
                            value={formData.dateYear}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const currentYear = new Date().getFullYear();
                                const raw = Number(e.target.value);
                                const value = Math.min(currentYear, Math.max(2000, raw));
                                handleChange("dateYear", value.toString());
                            }}
                            className="w-20 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 gap-4 items-start">
                    <label className="block text-sm font-medium text-gray-700">
                        Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange("notes", e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 resize-none"
                    />
                </div>
            </form>
        </div>
    )
}

export default General
