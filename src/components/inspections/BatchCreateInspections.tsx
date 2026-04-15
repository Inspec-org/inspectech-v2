'use client';

import { useState, useRef, useEffect } from 'react';

import { Upload, ArrowLeft, FolderPlus, AlertCircle, X, Download, FileUp } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Modal } from '../ui/modal';
import { useModal } from '@/hooks/useModal';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

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
        'owner',
        'equipmentId',
        'vin',
        'licensePlateId',
        'licensePlateCountry',
        'licensePlateExpiration',
        'licensePlateState/Province',
        'possessionOrigin',
        'manufacturer',
        'modelYear'
    ],
    sensor: [
        'absSensor',
        'airTankMonitor',
        'atisregulator',
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
        'tireModel',
        'tireBrand',
        'leftFrontOuter',
        'leftFrontInner',
        'leftRearOuter',
        'leftRearInner',
        'rightFrontOuter',
        'rightFrontInner',
        'rightRearOuter',
        'rightRearInner'
    ],
    feature: [
        'aerokits',
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
        'conspicuityTape',
        'captiveBeam',
        'cargoCamera',
        'cartbars',
        'tpms',
        'trailerHeightDecal'
    ]
};

export default function BatchCreateInspections() {
    const { isOpen, openModal, closeModal } = useModal();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
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
    const [department, setDepartment] = useState('');
    const [vendorId, setVendorId] = useState('');
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

    useEffect(() => {
        const deptId = Cookies.get('selectedDepartmentId') || '';
        setDepartment(deptId || '');
        const vendId = Cookies.get('selectedVendorId') || '';
        setVendorId(vendId || '');
    }, []);

    useEffect(() => {
        const onDeptChanged = () => {
            const deptId = Cookies.get('selectedDepartmentId') || '';
            setDepartment(deptId || '');
            if (previewData) {
                setPreviewData(null);
                setValidationErrors([]);
                setFile(null);
            }
        };
        const onVendorChanged = () => {
            const vendId = Cookies.get('selectedVendorId') || '';
            setVendorId(vendId || '');
            if (previewData) {
                setPreviewData(null);
                setValidationErrors([]);
                setFile(null);
            }
        };
        window.addEventListener('selectedDepartmentChanged', onDeptChanged as EventListener);
        window.addEventListener('selectedVendorChanged', onVendorChanged as EventListener);
        return () => {
            window.removeEventListener('selectedDepartmentChanged', onDeptChanged as EventListener);
            window.removeEventListener('selectedVendorChanged', onVendorChanged as EventListener);
        };
    }, [previewData]);

 
    

    const countFieldCategories = (headers: string[], isCanada: boolean) => {
        const normalizeHeader = (h: string) =>
            h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

        const counts = { identification: 0, dimensional: 0, feature: 0, sensor: 0 };
        const CATS = {
            identification: isCanada ? FIELD_CATEGORIES.identification : FIELD_CATEGORIES.identification.filter(f => f !== 'owner'),
            sensor: FIELD_CATEGORIES.sensor,
            dimensional: FIELD_CATEGORIES.dimensional,
            feature: isCanada ? FIELD_CATEGORIES.feature : FIELD_CATEGORIES.feature.filter(f => f !== 'conspicuityTape'),
        };

        headers.forEach(header => {
            const normalized = normalizeHeader(header);
            const matchesField = (field: string) => {
                const normalizedField = normalizeHeader(field);
                if (normalized === normalizedField) return true;
                if (normalized.length > normalizedField.length + 3) {
                    return normalized.includes(normalizedField);
                }
                return false;
            };
            if (CATS.identification.some(matchesField)) { counts.identification++; return; }
            if (CATS.sensor.some(matchesField)) { counts.sensor++; return; }
            if (CATS.feature.some(matchesField)) { counts.feature++; return; }
            if (CATS.dimensional.some(matchesField)) { counts.dimensional++; return; }
        });
        return counts;
    };


    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx')) {
                setValidationErrors([{
                    row: 0,
                    field: 'file',
                    value: selectedFile.name,
                    message: 'Please upload a CSV or Excel file'
                }]);
                event.target.value = '';
                return;
            }
            if (!department || !vendorId) {
                toast.error('Please select department and vendor first');
                event.target.value = '';
                return;
            }
            setFile(selectedFile);
            setValidationErrors([]);
            setPreviewData(null);
            setIsProcessing(true);
            try {
                const form = new FormData();
                form.append('file', selectedFile);
                form.append('vendorId', vendorId);
                form.append('departmentId', department);
                const res = await apiRequest('/api/inspections/batch-validate', { method: 'POST', body: form });
                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json.message || 'Validation failed');
                }
                if (Array.isArray(json.errors) && json.errors.length) {
                    setValidationErrors(json.errors);
                    setPreviewData(null);
                } else {
                    setPreviewData(json.preview || null);
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
        }
        event.target.value = '';
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
        a.download = 'validation-errors.txt';
        a.click();
    };

    const handleAddGeneralInformation = () => {
        openModal();
    };

    const handleCreateInspections = async () => {
        if (!previewData || !previewData.rows?.length) {
            toast.error('No import data to create');
            return;
        }
        
        setIsSaving(true);
        try {
            const normalize = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

            const parseDate = (s: string) => {
                const t = String(s).trim();
                const m = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(t);
                if (m) {
                    const year = m[3].length === 2 ? `20${m[3]}` : m[3];
                    return { dateMonth: m[1], dateDay: m[2], dateYear: year };
                }
                const d = new Date(t);
                if (!isNaN(d.getTime())) {
                    return { dateMonth: String(d.getMonth() + 1), dateDay: String(d.getDate()), dateYear: String(d.getFullYear()) };
                }
                return {};
            };

            const parseDuration = (s: string) => {
                const t = String(s).trim().toLowerCase();
                let mm: string | undefined, ss: string | undefined;
                let m = /^(\d+)\s*m(?:in)?\s*(\d+)\s*s?$/.exec(t);
                if (m) { mm = m[1]; ss = m[2]; }
                else if ((m = /^(\d+):(\d{1,2})$/.exec(t))) { mm = m[1]; ss = m[2]; }
                else if ((m = /^(\d+)\s*(?:m|min|minutes)$/.exec(t))) { mm = m[1]; ss = '0'; }
                else if (/^\d+$/.test(t)) { mm = t; ss = '0'; }
                if (mm) return { durationMin: String(mm), durationSec: String(ss || '0') };
                return {};
            };

            // Field mapping with synonyms and variations
            const fieldMap: Record<string, string[]> = {
                poNumber: ['po', 'ponumber', 'purchaseorder', 'purchaseordernumber'],
                owner: ['owner'],
                assetTagId: ['assettagid', 'assetid', 'asset'],
                equipmentNumber: ['equipmentnumber', 'equipment', 'equipmentid', 'equipmentidtrailernumber', 'trailer', 'trailernumber', 'trailerno', 'unit'],
                vin: ['vin', 'vehicleidentificationnumber'],
                licensePlateId: ['licenseplate', 'licenseplateid', 'licenseno', 'platenumber', 'plate'],
                licensePlateCountry: ['licenseplatecountry', 'platecountry', 'country'],
                licensePlateExpiration: ['licenseplateexpiration', 'licenseplateexp', 'plateexpiration', 'plateexp'],
                licensePlateState: ['licenseplatestate', 'platestate', 'state', 'province', 'licenseprovince'],
                possessionOrigin: ['possessionorigin', 'origin', 'possession', 'possessionoriginlocationpickuplocation', 'possessionoriginlocation', 'pickuplocation'],
                possessionStart: ['possessionstart', 'startdate', 'possessionstartdate'],
                possessionEnd: ['possessionend', 'enddate', 'possessionenddate'],
                manufacturer: ['manufacturer', 'make', 'mfg', 'mfr'],
                modelYear: ['modelyear', 'year', 'model'],
                manufacturerAssetId: ['manufacturerassetid', 'mfgassetid'],
                operator: ['operator'],
                program: ['program', 'ats', 'utp'],
                absSensor: ['abssensor', 'abs'],
                airTankMonitor: ['airtankmonitor', 'airtank', 'tankmonitor'],
                atisregulator: ['atisregulator', 'rtb', 'atisregulator'],
                lightOutSensor: ['lightoutsensor', 'lightout', 'lightsensor'],
                sensorError: ['sensorerror', 'error'],
                ultrasonicCargoSensor: ['ultrasoniccargosensor', 'ultrasoniccargor', 'cargosensor', 'ultrasonic'],
                length: ['length', 'len'],
                height: ['height', 'ht'],
                grossAxleWeightRating: ['grossaxleweightrating', 'axleweight', 'gawr', 'weightrating'],
                axleType: ['axletype', 'axle'],
                brakeType: ['braketype', 'brake', 'brakes'],
                suspensionType: ['suspensiontype', 'suspension'],
                tireModel: ['tiremodel', 'tire'],
                tireBrand: ['tirebrand', 'tiremake'],
                leftFrontOuter: ['leftfrontouter', 'lfouter', 'treaddepthleftfrontouter'],
                leftFrontInner: ['leftfrontinner', 'lfinner', 'treaddepthleftfrontinner'],
                leftRearOuter: ['leftrearouter', 'lrouter', 'treaddepthleftrearouter'],
                leftRearInner: ['leftrearinner', 'lrinner', 'treaddepthleftrearinner'],
                rightFrontOuter: ['rightfrontouter', 'rfouter', 'treaddepthrightfrontouter'],
                rightFrontInner: ['rightfrontinner', 'rfinner', 'treaddepthrightfrontinner'],
                rightRearOuter: ['rightrearouter', 'rrouter', 'treaddepthrightrearouter'],
                rightRearInner: ['rightrearinner', 'rrinner', 'treaddepthrightrearinner'],
                aerokits: ['aerokits', 'aerokits', 'aerokit'],
                doorBranding: ['doorbranding', 'branding'],
                doorColor: ['doorcolor', 'color'],
                doorSensor: ['doorsensor'],
                doorType: ['doortype', 'door'],
                lashSystem: ['lashsystem', 'lash'],
                mudFlapType: ['mudflaptype', 'mudflap', 'flap'],
                panelBranding: ['panelbranding', 'panel'],
                noseBranding: ['nosebranding', 'nose'],
                skirted: ['skirted', 'skirt'],
                skirtColor: ['skirtcolor'],
                captiveBeam: ['captivebeam', 'beam'],
                cargoCameras: ['cargocamera', 'cargocameras', 'camera', 'cameras'],
                cartbars: ['cartbars', 'cart', 'bars'],
                tpms: ['tpms', 'tirepressure'],
                trailerHeightDecal: ['trailerheightdecal', 'heightdecal', 'decal'],
                cargoLockFitted: ['cargolockfitted', 'cargolock'],
                cargoLockInstalledDate: ['cargolockinstalleddate'],
                cargoLockType: ['cargolocktype'],
                conspicuityTape: ['conspicuitytape'],
                conspicuityTapeInstallDate: ['conspicuitytapeinstalldate', 'conspicuitytapeinstalleddate'],
                estimatedDateOfAvailability: ['estimateddateofavailability', 'availabledate'],
                healthScore: ['healthscore'],
                invoiceNumber: ['invoicenumber', 'invoice'],
                lifecycleState: ['lifecyclestate', 'lifecycle'],
                lifecycleStateReason: ['lifecyclestatereason', 'lifecyclereason'],
                pulsatingLampManufacturer: ['pulsatinglampmanufacturer', 'lampmanufacturer', 'grote'],
                pulsatingLampModel: ['pulsatinglampmodel', 'lampmodel'],
                pulsatingLampWiring: ['pulsatinglampwiring', 'lampwiring'],
                purchaseCondition: ['purchasecondition', 'condition'],
                purchaseDate: ['purchasedate'],
                purchaseType: ['purchasetype'],
                tireSize: ['tiresize'],
                warrantyBatchId: ['warrantbatchid', 'warrantybatchid'],
                inspectionStatus: ['inspectionstatus', 'status'],
                inspector: ['inspector', 'inspectedby', 'technician'],
                location: ['location', 'loc', 'site'],
                type: ['type']
            };

            // Fuzzy matching function with scoring
            const fuzzyMatch = (normalized: string, fieldKey: string): { match: boolean; score: number } => {
                const variations = fieldMap[fieldKey];

                // Exact match (highest priority)
                if (variations.includes(normalized)) {
                    return { match: true, score: 100 };
                }

                // Check if any variation is contained in the normalized string
                for (const variation of variations) {
                    if (normalized.includes(variation)) {
                        // Score based on how much of the string matches
                        const score = (variation.length / normalized.length) * 90;
                        if (score > 60) { // Only match if >60% similar
                            return { match: true, score };
                        }
                    }
                }

                // Check if normalized string is contained in any variation
                for (const variation of variations) {
                    if (variation.includes(normalized) && normalized.length >= 3) {
                        const score = (normalized.length / variation.length) * 80;
                        if (score > 50) {
                            return { match: true, score };
                        }
                    }
                }

                return { match: false, score: 0 };
            };

            // Find best matching field for a header
            const findBestMatch = (header: string): string | null => {
                const normalized = normalize(header);
                let bestMatch: { key: string; score: number } | null = null;

                for (const [key, _] of Object.entries(fieldMap)) {
                    const result = fuzzyMatch(normalized, key);
                    if (result.match && (!bestMatch || result.score > bestMatch.score)) {
                        bestMatch = { key, score: result.score };
                    }
                }

                return bestMatch?.key || null;
            };

            const payloads: any[] = [];
            for (const row of previewData.rows) {
                const equipmentValue = previewData.headers.reduce((acc, h) => {
                    const key = findBestMatch(h);
                    if (key === 'equipmentNumber') {
                        const v = row[h];
                        const s = String(v ?? '').trim();
                        return acc || s;
                    }
                    return acc;
                }, '');
                const unitIdValue = String(row['Unit ID'] || '').trim();
                const payload: any = { unitId: unitIdValue || equipmentValue, departmentId: department, vendorId };
                previewData.headers
                    .filter(h => !['Sr No', 'Unit ID'].includes(h))
                    .forEach(h => {
                        const normalized = normalize(h);
                        const v = row[h];
                        if (normalized === 'date') {
                            Object.assign(payload, parseDate(String(v ?? '')));
                        } else if (normalized === 'duration') {
                            Object.assign(payload, parseDuration(String(v ?? '')));
                        } else {
                            const key = findBestMatch(h);
                            if (key) payload[key] = v;
                        }
                    });
                payloads.push(payload);
            }
            const res = await apiRequest('/api/inspections/batch-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payloads }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Batch create failed');
            }
            const created = Number(data?.created || 0);
            const failed = Number(data?.failed || 0);
            const skipped = Number(data?.skipped || 0);
            toast.success(`Created ${created} inspections${skipped ? `, ${skipped} duplicates skipped` : ''}${failed ? `, ${failed} failed` : ''}`);
            const segs = (pathname || '').split('/').filter(Boolean);
            const role = segs[0] || '';
            const target = role ? `/${role}/inspections` : '/inspections';
            router.push(target);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            toast.error(`Failed to create inspections: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
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
                            <button onClick={handleCreateInspections} disabled={!previewData || isSaving} className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                <FolderPlus size={18} />
                                <span>{isSaving ? 'Creating...' : (previewData?.rows?.length ? `Create ${previewData.rows.length} Inspections` : 'Create Inspections')}</span>
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
                            Complete CSV / XLSX Import
                        </h2>
                        <p className="text-sm text-gray-600 mt-2">
                            Upload a complete CSV / XLSX of maximum 1000 rows with all inspection details already filled out for each Unit ID (or Equipment ID/Trailer Number).
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
                                        Upload complete CSV / XLSX
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Your CSV / XLSX should include Unit ID or Equipment ID/Trailer Number and all inspection field values for each unit.
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
                                            {previewData.stats.identification} identification fields, {previewData.stats.dimensional} dimentional field, {previewData.stats.feature} feature fields, {previewData.stats.sensor} sensor fields
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
                                    {/* Add General Information button temporarily disabled */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>




                {/* Upload Section */}
                {/* {!previewData && ( */}

                {/* )} */}
            </div>

            {/* <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[600px]">
                <div className="bg-white rounded-lg w-full">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Add General Information</h2>
                            <p className="text-xs text-gray-600 mt-1">The information will be applied to at 2 inspections.</p>
                        </div>
                       
                    </div>

                    <div className="p-4 space-y-5">
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
            </Modal> */}
        </div>
    );
}
