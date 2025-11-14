'use client'
import React, { useState } from 'react'
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';

function General() {
    const [formData, setFormData] = useState({
        unitId: "I12",
        inspectionStatus: "",
        reviewReason: "",
        type: "53 foot trailer",
        inspector: "John Inspector",
        vendor: "ABC vendor",
        location: "East Plant",
        delivered: "",
        durationMin: "5",
        durationSec: "00",
        dateDay: "05",
        dateMonth: "07",
        dateYear: "2025",
        notes: "New notes I12 test",
    });

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
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Unit ID */}
                <div className="flex justify-between gap-4 items-start border-b pb-2">
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
                        disabled
                        className="w-[300px] px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Inspection Status */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Inspection Status
                    </label>
                    <CustomDropdown
                        options={[
                            { value: "pass", label: "PASS" },
                            { value: "fail", label: "FAIL" },
                            { value: "need_review", label: "NEEDS REVIEW" },
                            { value: "out_of_cycle", label: "OUT OF CYCLE (DELIVERED)" },
                            { value: "no_inspection", label: "NO INSPECTION(DELIVERED)" },
                            { value: "incomplete", label: "INCOMPLETE" },
                            { value: "complete", label: "COMPLETE" },
                        ]}
                        width="300px"
                        value={formData.inspectionStatus}
                        onChange={(val) => handleChange("inspectionStatus", val)}
                    />
                </div>

                {/* Review Reason */}
                {formData.inspectionStatus === "need_review" && (
                    <div className="flex justify-between gap-4 items-center border-b pb-2">
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
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                        type="text"
                        value={formData.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        className="w-[300px] px-3 py-2 bg-[#FAF7FF] border border-purple-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>

                {/* Inspector */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Inspector
                    </label>
                    <input
                        type="text"
                        value={formData.inspector}
                        onChange={(e) => handleChange("inspector", e.target.value)}
                        className="w-[300px] px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Vendor */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Vendor
                    </label>
                    <input
                        type="text"
                        value={formData.vendor}
                        onChange={(e) => handleChange("vendor", e.target.value)}
                        className="w-[300px] px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Location */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Location
                    </label>
                    <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        className="w-[300px] px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700"
                    />
                </div>

                {/* Delivered */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
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
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Duration
                    </label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={formData.durationMin}
                            onChange={(e) => handleChange("durationMin", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-sm text-gray-500">min</span>
                        <input
                            type="number"
                            value={formData.durationSec}
                            onChange={(e) => handleChange("durationSec", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-sm text-gray-500">sec</span>
                    </div>
                </div>

                {/* Date */}
                <div className="flex justify-between gap-4 items-center border-b pb-2">
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            value={formData.dateDay}
                            onChange={(e) => handleChange("dateDay", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                            type="text"
                            value={formData.dateMonth}
                            onChange={(e) => handleChange("dateMonth", e.target.value)}
                            className="w-16 px-3 py-2 bg-[#FAF7FF] border border-gray-300 rounded-lg text-gray-700 text-center"
                        />
                        <span className="text-gray-400">/</span>
                        <input
                            type="text"
                            value={formData.dateYear}
                            onChange={(e) => handleChange("dateYear", e.target.value)}
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
