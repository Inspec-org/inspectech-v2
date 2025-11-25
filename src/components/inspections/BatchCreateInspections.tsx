'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, ArrowLeft, FolderPlus, AlertCircle, X, Download, FileUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Modal } from '../ui/modal';
import { useModal } from '@/hooks/useModal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';

interface InspectionData {
    [key: string]: string | number;
}

interface ValidationError {
    row: number;
    field: string;
    value: string;
    message: string;
}

const FIELD_CATEGORIES = {
    identification: [
        'poNumber',
        'equipmentNumber',
        'vin',
        'licensePlateId',
        'licensePlateCountry',
        'licensePlateExpiration',
        'licensePlateState',
        'possessionOrigin',
        'manufacturer',
        'modelYear'
    ],
    sensor: [
        'absSensor',
        'airTankMonitor',
        'rtbIndicator',
        'lightOutSensor',
        'sensorError',
        'ultrasonicCargoSensor'
    ],
    dimensional: [
        'length',
        'height',
        'grossAxleWeightRating',
        'axleType',
        'brakeType',
        'suspensionType',
        'tireModel'
    ],
    feature: [
        'amenikis',
        'doorBranding',
        'doorColor',
        'doorSensor',
        'doorType',
        'lashSystem',
        'mudFlapType',
        'panelBranding',
        'noseBranding',
        'skirted',
        'skirtColor',
        'captiveBeam',
        'cargoCameras',
        'cartbars',
        'tpms',
        'trailerHeightDecal'
    ]
};

export default function BatchCreateInspections() {
    const { isOpen, openModal, closeModal } = useModal();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [previewData, setPreviewData] = useState<{
        headers: string[];
        rows: InspectionData[];
        stats: {
            inspections: number;
            columns: number;
            identification: number;
            dimensional: number;
            feature: number;
            sensor: number;
        };
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        status: 'Leave unchanged',
        type: '',
        inspector: '',
        vendor: '',
        location: '',
        date: '',
        duration: '',
        notes: ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        console.log('Saving:', formData);
        // if (onSave) {
        //     onSave(formData);
        // }
        // setIsOpen(false);
        // if (onClose) {
        //     onClose();
        // }
    };

    const countFieldCategories = (headers: string[]) => {
        const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

        const counts = {
            identification: 0,
            dimensional: 0,
            feature: 0,
            sensor: 0
        };

        headers.forEach(header => {
            const normalized = normalizeHeader(header);

            // Check each category with partial matching
            if (FIELD_CATEGORIES.identification.some(field => {
                const normalizedField = normalizeHeader(field);
                return normalized.includes(normalizedField) || normalizedField.includes(normalized);
            })) {
                counts.identification++;
            } else if (FIELD_CATEGORIES.sensor.some(field => {
                const normalizedField = normalizeHeader(field);
                return normalized.includes(normalizedField) || normalizedField.includes(normalized);
            })) {
                counts.sensor++;
            } else if (FIELD_CATEGORIES.dimensional.some(field => {
                const normalizedField = normalizeHeader(field);
                return normalized.includes(normalizedField) || normalizedField.includes(normalized);
            })) {
                counts.dimensional++;
            } else if (FIELD_CATEGORIES.feature.some(field => {
                const normalizedField = normalizeHeader(field);
                return normalized.includes(normalizedField) || normalizedField.includes(normalized);
            })) {
                counts.feature++;
            }
        });

        return counts;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
                setValidationErrors([{
                    row: 0,
                    field: 'file',
                    value: selectedFile.name,
                    message: 'Please upload a CSV or Excel file'
                }]);
                return;
            }
            setFile(selectedFile);
            setValidationErrors([]);
            setPreviewData(null);
            processFile(selectedFile);
        }
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);

        try {
            let rows: (string | number | null | undefined)[][] = [];
            if (file.name.toLowerCase().endsWith('.xlsx')) {
                const data = await file.arrayBuffer();
                const wb = XLSX.read(data, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number | null | undefined)[][];
            } else {
                const text = await file.text();
                const wb = XLSX.read(text, { type: 'string' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number | null | undefined)[][];
            }
            rows = rows.filter((r) => Array.isArray(r) && r.some((c) => c !== null && c !== undefined && String(c).trim() !== ''));

            if (rows.length < 2) {
                throw new Error('File must contain headers and at least one data row.');
            }

            const headers = (rows[0] as (string | number | null | undefined)[]).map(h => (h === null || h === undefined ? '' : String(h))).filter(h => h !== '');
            if (headers.length === 0) {
                throw new Error('Invalid spreadsheet: No headers found.');
            }
            const isAllowedValuesCell = (val: string) => {
                const s = String(val).trim();
                if (!s) return false;
                const hasComma = s.includes(',');
                const hasSlash = s.includes('/');
                const tokens = s.split(hasComma ? ',' : hasSlash ? '/' : ',').map(t => t.trim()).filter(t => t);
                if (tokens.length < 2) return false;
                if (tokens.every(t => /^[\w\s.-]+$/.test(t)) && tokens.some(t => t.length <= 5)) return true;
                return hasComma || hasSlash;
            };

            const candidateAllowed = rows[1] as (string | number | null | undefined)[];
            let allowedByHeader: Record<string, string[]> = {};
            let dataStartIndex = 1;
            if (candidateAllowed && candidateAllowed.length) {
                const allowedSignals: number[] = candidateAllowed.map(c => (isAllowedValuesCell(String(c ?? '')) ? 1 : 0));
                const ratio = allowedSignals.reduce((a, b) => a + b, 0) / Math.max(allowedSignals.length, 1);
                if (ratio >= 0.5) {
                    dataStartIndex = 2;
                    headers.forEach((h, idx) => {
                        const cell = candidateAllowed[idx];
                        const s = String(cell ?? '').trim();
                        if (isAllowedValuesCell(s)) {
                            const sep = s.includes(',') ? ',' : s.includes('/') ? '/' : ',';
                            allowedByHeader[h] = s.split(sep).map(t => t.trim()).filter(t => t);
                        }
                    });
                }
            }

            const errors: ValidationError[] = [];
            const parsedRows: InspectionData[] = [];
            const norm = (v: string) => String(v || '').trim();
            const normId = (v: string) => String(v || '').trim().toLowerCase();
            const unitIdHeaderCandidates = ['unit id', 'unitid', 'unitid#', 'unit'];
            const equipIdHeaderCandidates = ['equipment id/trailer number', 'equipment id', 'trailer number', 'equipment id #', 'equipment'];
            const unitIdIndex = headers.findIndex(h => unitIdHeaderCandidates.includes(h.trim().toLowerCase()));
            const equipIdIndex = headers.findIndex(h => equipIdHeaderCandidates.includes(h.trim().toLowerCase()));
            const seenUnitIds = new Map<string, number>();

            for (let i = dataStartIndex; i < rows.length; i++) {
                const currentRow = rows[i];
                if (!currentRow || currentRow.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) continue;

                const rowData: InspectionData = {};
                headers.forEach((header, index) => {
                    const val = currentRow[index] ?? '';
                    const strVal = String(val).trim();
                    rowData[header] = strVal;
                });

                Object.keys(allowedByHeader).forEach(h => {
                    const v = norm(String(rowData[h] ?? ''));
                    if (!v) return;
                    const allowed = allowedByHeader[h];
                    const match = allowed.some(a => a.toLowerCase() === v.toLowerCase());
                    if (!match) {
                        errors.push({ row: i + 1, field: h, value: String(rowData[h] ?? ''), message: `Value must be one of: ${allowed.join(', ')}` });
                    }
                });

                const unitVal = unitIdIndex >= 0 ? norm(String(currentRow[unitIdIndex] ?? '')) : '';
                const equipVal = equipIdIndex >= 0 ? norm(String(currentRow[equipIdIndex] ?? '')) : '';
                if (unitVal && equipVal) {
                    if (normId(unitVal) !== normId(equipVal)) {
                        errors.push({ row: i + 1, field: 'Unit ID / Equipment ID', value: `${unitVal} / ${equipVal}`, message: 'Both identifiers must match' });
                    }
                }
                if (!unitVal && equipVal) {
                    if (unitIdIndex >= 0) rowData[headers[unitIdIndex]] = equipVal;
                }
                if (unitVal && !equipVal) {
                    if (equipIdIndex >= 0) rowData[headers[equipIdIndex]] = unitVal;
                }
                const effectiveId = unitVal || equipVal;
                if (effectiveId) {
                    const key = normId(effectiveId);
                    if (seenUnitIds.has(key)) {
                        const firstRow = seenUnitIds.get(key) || 0;
                        errors.push({ row: i + 1, field: 'Unit ID', value: effectiveId, message: `Duplicate Unit ID, first seen at row ${firstRow}` });
                    } else {
                        seenUnitIds.set(key, i + 1);
                    }
                } else {
                    errors.push({ row: i + 1, field: 'Unit ID', value: '', message: 'Missing Unit ID or Equipment ID/Trailer Number' });
                }
                rowData['Unit ID'] = effectiveId;
                parsedRows.push(rowData);
            }

            if (parsedRows.length === 0) {
                throw new Error('Spreadsheet contains no valid data rows.');
            }
            parsedRows.forEach((row, index) => {
                row['Sr No'] = index + 1;
            });

            if (errors.length > 0) {
                setValidationErrors(errors);
                setPreviewData(null);
            } else {
                const enhancedHeaders = ['Sr No', 'Unit ID', ...headers.filter(h =>
                    !['Sr No', 'Unit ID'].includes(h) &&
                    !unitIdHeaderCandidates.includes(h.trim().toLowerCase()) &&
                    !equipIdHeaderCandidates.includes(h.trim().toLowerCase())
                )];
                setPreviewData({
                    headers: enhancedHeaders,
                    rows: parsedRows,
                    stats: {
                        inspections: parsedRows.length,
                        columns: headers.length,
                        ...countFieldCategories(headers)
                    },
                });
                setValidationErrors([]);
            }
        } catch (error) {
            setValidationErrors([
                {
                    row: 0,
                    field: 'general',
                    value: '',
                    message: error instanceof Error ? error.message : 'Failed to process file',
                },
            ]);
            setPreviewData(null);
        } finally {
            setIsProcessing(false);
        }
    };


    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearErrors = () => {
        setValidationErrors([]);
        setFile(null);
        setPreviewData(null);
    };

    const handleDownloadErrorReport = () => {
        const errorReport = validationErrors.map(err =>
            `Row ${err.row}: ${err.field} - ${err.value} - ${err.message}`
        ).join('\n');

        const blob = new Blob([errorReport], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'validation-errors.csv';
        a.click();
    };

    const handleAddGeneralInformation = () => {
        openModal();
    };

    const handleDropdownChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className=" bg-gray-50">
            {/* Header */}
            <div className="bg-[#F4EFFE] border-b border-gray-200">
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-purple-700">
                                Batch Create Inspections
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Create multiple inspections at once using a common template
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors" onClick={() => router.back()}>
                                <ArrowLeft size={18} />
                                <span>Back to Inspections</span>
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                                <FolderPlus size={18} />
                                <span>Create Inspections</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-purple-700">
                            Complete CSV Import
                        </h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Upload a complete CSV with all inspection details already filled out for each Unit ID (or Equipment ID/Trailer Number).
                        </p>
                        <p className="text-sm text-gray-500 mt-1 italic">
                            Note: Unit ID is derived from the Equipment ID/Trailer Number column in the source data.
                            Both are treated as the same trailer identifier in the system.
                        </p>
                    </div>

                    <div className="p-6">
                        <div className="border-2 bg-[#E8E8E88C] border-gray-300 rounded-xl p-4 hover:border-purple-400 transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <div className="flex flex-row items-center justify-between">
                                <div className='flex flex-col'>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Upload complete CSV
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Your CSV should include Unit ID or Equipment ID/Trailer Number and all inspection field values for each unit.
                                    </p>
                                </div>

                                {/* {file && !isProcessing && !validationErrors.length && (
                                    <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                                        Selected: {file.name}
                                    </div>
                                )} */}

                                <button
                                    onClick={handleUploadClick}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-3 bg-[#FBFBFB] border-2 border-gray-300 rounded-lg hover:bg-purple-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload size={18} />
                                    <span>{isProcessing ? 'Processing...' : 'Import CSV/Excel'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className='p-6'>
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-red-700">
                                            Validation Errors Found({validationErrors.length})
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleUploadClick}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                                        >
                                            <FileUp size={16} />
                                            Import New File
                                        </button>
                                        <button
                                            onClick={handleDownloadErrorReport}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                        >
                                            <Download size={16} />
                                            Download Error Report
                                        </button>
                                        <button
                                            onClick={handleClearErrors}
                                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                                        >
                                            <X size={16} />
                                            Clear Errors
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-red-700">
                                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                                    <p className="text-sm">
                                        Your spreadsheet contains invalid values that don't match the required format. The error report shows exactly which rows have issues and what the valid options are. After fixing the issues, re-upload your spreadsheet to try again.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Import Preview */}
                    {previewData && (
                        <div className="p-6 grid grid-cols-1">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="p-6 border-b border-gray-200 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">Import Preview</h2>
                                        <p className="text-sm text-gray-600">
                                            {previewData.stats.inspections} inspection will be created with {previewData.stats.columns} column of data
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {previewData.stats.dimensional} identification fields, {previewData.stats.dimensional} dimentional field, {previewData.stats.feature} feature fields, {previewData.stats.sensor} sensor fields
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClearErrors}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <div className="max-h-96 overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead className="bg-gray-100 sticky top-0">
                                                <tr>
                                                    {previewData.headers.map((header, index) => (
                                                        <th
                                                            key={index}
                                                            className="px-4 py-3 text-left text-xs font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {previewData.rows.map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                                                        {previewData.headers.map((header, colIndex) => (
                                                            <td
                                                                key={colIndex}
                                                                className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                                                            >
                                                                {row[header] || '-'}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                                    <button
                                        onClick={handleClearErrors}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel Import
                                    </button>
                                    <button
                                        onClick={handleAddGeneralInformation}
                                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                                    >
                                        Add General Information
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>




                {/* Upload Section */}
                {/* {!previewData && ( */}

                {/* )} */}
            </div>

            <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px]">
                <div className="bg-white rounded-lg w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Add General Information</h2>
                            <p className="text-xs text-gray-600 mt-1">The information will be applied to at 2 inspections.</p>
                        </div>
                        {/* <button
                                onClick={handleCancel}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button> */}
                    </div>

                    {/* Form */}
                    <div className="p-4 space-y-5">
                        {/* Status */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Status</label>
                            <CustomDropdown
                                options={[
                                    { value: "pass", label: "PASS" },
                                    { value: "fail", label: "FAIL" },
                                    { value: "needs review", label: "NEEDS REVIEW" },
                                    { value: "out_of_cycle", label: "OUT OF CYCLE (DELIVERED)" },
                                    { value: "no_inspection", label: "NO INSPECTION(DELIVERED)" },
                                    { value: "incomplete", label: "INCOMPLETE" },
                                    { value: "complete", label: "COMPLETE" },
                                ]}
                                width="425px"
                                value={formData.status}
                                onChange={(val) => handleDropdownChange("status", val)}
                            />
                        </div>

                        {/* Type */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Type</label>
                            <input
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                placeholder="53 foot trailer"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Inspector */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Inspector</label>
                            <input
                                type="text"
                                value={formData.inspector}
                                onChange={(e) => handleChange('inspector', e.target.value)}
                                placeholder=""
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Vendor */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Vendor</label>
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => handleChange('vendor', e.target.value)}
                                placeholder=""
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder=""
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Date</label>
                            <input
                                type="text"
                                value={formData.date}
                                placeholder='11/2/2025'
                                onChange={(e) => handleChange('date', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-gray-700 font-medium">Duration</label>
                            <input
                                type="text"
                                value={formData.duration}
                                placeholder='5m 00s'
                                onChange={(e) => handleChange('duration', e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
                            />
                        </div>

                        {/* Notes */}
                        <div className="flex items-start gap-4">
                            <label className="w-32 text-gray-700 font-medium pt-3">Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={3}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF] resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-4 border-t">
                        <button
                            onClick={closeModal}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition font-medium"
                        >
                            Save Information
                        </button>
                    </div>
                </div>
                {/* </div> */}
            </Modal>
        </div>
    );
}
