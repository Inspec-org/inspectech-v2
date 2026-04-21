import { ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useEffect, memo, useCallback } from 'react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { FormData } from './Edit';
import YearPicker from '../ui/YearPicker';
import Cookies from 'js-cookie';

const TextFieldWithNA = React.memo(({
    name, label, value, disabled, w, colRow, onChange, onSetNA, onFocus
}: {
    name: string;
    label: React.ReactNode;
    value: string;
    disabled?: boolean;
    w: string;
    colRow: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSetNA: (field: string) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) => (
    <div className={colRow}>
        <label data-name={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className={`relative ${w}`}>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                onFocus={onFocus}
                placeholder="Enter value or click N/A"
                className="w-full px-3 py-2 pr-14 border text-sm border-gray-300 rounded-md bg-[#FAF7FF] focus:outline-none disabled:opacity-50"
                disabled={disabled}
            />
            <button
                type="button"
                onClick={() => onSetNA(name)}
                disabled={disabled}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200 disabled:opacity-50"
            >
                N/A
            </button>
        </div>
    </div>
));

const DateField = memo(({ name, label, value, handleChange, w, colRow }: {
    name: string; label: string; value: string; w: string; colRow: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) => (
    <div className={colRow}>
        <label data-name={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className={`relative ${w}`} data-field={name}>  {/* ← move back to inner wrapper */}
            <input
                type="date"
                name={name}
                value={value || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border text-sm border-gray-300 rounded-md bg-[#FAF7FF] focus:outline-none cursor-pointer"
                onClick={(e) => { e.preventDefault(); (e.target as HTMLInputElement).showPicker?.(); }}
            />
        </div>
    </div>
));

const RadioField = memo(({ name, label, value, handleChange, flexRow }: {
    name: string; label: string; value: string; flexRow: string;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) => (
    <div className={flexRow}>
        <label
            data-name={name}
            className="block text-sm font-medium text-gray-700 mb-2"
        >
            {label}
        </label>

        {/* 👇 Wrap radios separately */}
        <div className="flex gap-4" data-radio-group={name}>
            {['N/A', 'Yes', 'No'].map(opt => (
                <label key={opt} className="flex items-center">
                    <input
                        type="radio"
                        name={name}
                        value={opt}
                        checked={value === opt}
                        onChange={handleChange}
                        className="mr-2"
                    />
                    {opt}
                </label>
            ))}
        </div>
    </div>
));

const DropdownField = memo(({ name, label, value, options, handleDropdownChange, w, colRow }: {
    name: string; label: string; value: string; options: { value: string; label: string }[];
    w: string; colRow: string;
    handleDropdownChange: (name: string, value: string) => void;
}) => (
    <div className={colRow}>
        <label data-name={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <CustomDropdown
            name={name}
            options={options}
            width={w}
            value={value}
            onChange={(val) => handleDropdownChange(name, val)}
        />
    </div>
));

export default function CheckList({ prop, formData, setFormData, missingKeys }: { prop: string; formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>>; missingKeys?: string[] }) {

    const [expandedSections, setExpandedSections] = useState({
        identification: true,
        sensors: true,
        dimensions: true,
        features: true,
        tireLocation: true,
    });

    const isUSTrailer = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'us purchase trailers');

    useEffect(() => {
        const labelCls = 'missing-field-label';
        const fieldCls = 'missing-field-input';
        document.querySelectorAll('.' + labelCls).forEach(el => el.classList.remove(labelCls));
        document.querySelectorAll('.' + fieldCls).forEach(el => el.classList.remove(fieldCls));

        (missingKeys || []).forEach((key) => {
            const fieldValue = formData[key as keyof FormData];
            const hasValue = fieldValue &&
                String(fieldValue).trim() !== '' &&
                String(fieldValue).toUpperCase() !== 'DATE' &&
                String(fieldValue) !== 'dd/mm/yyyy' &&
                String(fieldValue) !== 'mm/dd/yyyy' &&
                String(fieldValue) !== 'yyyy-mm-dd';
            if (hasValue) return;

            const labelElExplicit = document.querySelector<HTMLElement>(`label[data-name="${key}"]`);
            if (labelElExplicit) labelElExplicit.classList.add(labelCls);

            // 1. Date fields
            const dataFieldDiv = document.querySelector<HTMLElement>(`div[data-field="${key}"]`);
            if (dataFieldDiv) {
                dataFieldDiv.classList.add(fieldCls);
                return;
            }

            // 2. Text inputs only (not radio)
            const input = document.querySelector<HTMLInputElement>(`input[name="${key}"]`);
            if (input && input.type !== 'radio') {
                input.parentElement?.classList.add(fieldCls);
                return;
            }

            // 3. Dropdowns (CustomDropdown renders a div with data-name)
            const dd = document.querySelector<HTMLElement>(`div[data-name="${key}"]`);
            if (dd) {
                dd.classList.add(fieldCls);
                return;
            }

            // 4. Radio fields and anything else — highlight the whole row via label's parent
            const radioGroup = document.querySelector<HTMLElement>(`div[data-radio-group="${key}"]`);
            if (radioGroup) {
                radioGroup.classList.add(fieldCls);
            }
        });
    }, [missingKeys, formData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, [setFormData]);


    const handleDropdownChange = useCallback((name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    }, [setFormData]);

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleSetNA = useCallback((field: string) => {
        setFormData(prev => ({ ...prev, [field]: "N/A" }));
    }, [setFormData]);

    // ─── Layout helpers ──────────────────────────────────────────────────────────

    const w = prop === "single" ? "xl:w-[230px] w-full" : "w-full";
    const colRow = `flex flex-col justify-between gap-4 ${prop === "single" ? "xl:flex-row xl:items-center" : ""}`;
    const flexRow = `flex flex-row justify-between gap-4 ${prop === "single" ? "xl:flex-row xl:items-center" : ""}`;

    // ─── Static option sets ──────────────────────────────────────────────────────

    const tireDepthOptions = [
        { value: "N/A", label: "N/A" },
        { value: "15/32", label: "15/32" },
        { value: "14/32", label: "14/32" },
        { value: "13/32", label: "13/32" },
        { value: "12/32", label: "12/32" },
        { value: "11/32", label: "11/32" },
        { value: "10/32", label: "10/32" },
    ];

    const tireLocationFields: { key: keyof FormData; label: string }[] = [
        { key: 'treadDepthLeftFrontOuter', label: 'Tread Depth Left Front Outer' },
        { key: 'treadDepthLeftFrontInner', label: 'Tread Depth Left Front Inner' },
        { key: 'treadDepthLeftRearOuter', label: 'Tread Depth Left Rear Outer' },
        { key: 'treadDepthLeftRearInner', label: 'Tread Depth Left Rear Inner' },
        { key: 'treadDepthRightFrontOuter', label: 'Tread Depth Right Front Outer' },
        { key: 'treadDepthRightFrontInner', label: 'Tread Depth Right Front Inner' },
        { key: 'treadDepthRightRearOuter', label: 'Tread Depth Right Rear Outer' },
        { key: 'treadDepthRightRearInner', label: 'Tread Depth Right Rear Inner' },
    ];

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="">
            <style jsx global>{`
                .missing-field-label { color: #ef4444 !important; }
                .missing-field-input { background-color: #fee2e2 !important; border: 1px solid #ef4444 !important; border-radius: 8px; padding: 2px; }
                .missing-field-input :is(button, input, select, textarea) { background-color: #fee2e2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
                .missing-field-input input[type="radio"] { accent-color: #ef4444 !important; }
                .missing-field-input input[type="date"] { background-color: #fee2e2 !important; border-color: #ef4444 !important; color: #b91c1c !important; }
            `}</style>

            <div className="">

                {/* ── Row 1 : Identification & Registration  |  Sensors & Electrical ── */}
                <div className={`flex ${prop === "single" ? `md:flex-row flex-col ${expandedSections.identification || expandedSections.sensors ? "mb-5" : ""}` : "flex-col px-4"} justify-between items-start gap-2`}>

                    {/* Identification & Registration */}
                    <div className={`rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full"}`}>
                        <button onClick={() => toggleSection('identification')} className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4">
                            <h2 className="text-sm font-semibold text-gray-900">Identification & Registration</h2>
                            <span className="text-gray-400">{expandedSections.identification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.identification && (
                            <div className={`space-y-4 w-full ${prop === "batch" ? "" : "border border-gray-300 rounded-lg px-6 py-6"}`}>
                                {isUSTrailer && (
                                    <TextFieldWithNA w={w}
                                        colRow={colRow}
                                        onChange={handleChange}
                                        onSetNA={handleSetNA} name="assetId" label="Asset ID or Error Message" value={formData.assetId} />
                                )}
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="poNumber" label="PO Number" value={formData.poNumber} />
                                {!isUSTrailer && (
                                    <TextFieldWithNA w={w}
                                        colRow={colRow}
                                        onChange={handleChange}
                                        onSetNA={handleSetNA} name="owner" label="Owner" value={formData.owner} />
                                )}
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="equipmentId" label={`${isUSTrailer ? "Trailer" : "Equipment"} ID`} value={formData.equipmentId} disabled={prop === "batch"} />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="vin" label="VIN" value={formData.vin} disabled={prop === "batch"} />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="licensePlateId" label="License Plate ID" value={formData.licensePlateId} />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="licensePlateCountry" label="License Plate Country" value={formData.licensePlateCountry} />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="licensePlateExpiration" label="License Plate Expiration" value={formData.licensePlateExpiration} />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="licensePlateStateOrProvince" label="License Plate State / Province" value={formData.licensePlateStateOrProvince} />
                                {!isUSTrailer && (
                                    <TextFieldWithNA w={w}
                                        colRow={colRow}
                                        onChange={handleChange}
                                        onSetNA={handleSetNA} name="possessionOriginLocation" label={<>Possession Origin Location</>} value={formData.possessionOriginLocation} />
                                )}
                                {/* {isUSTrailer && (
                                    <>
                                        <DateField name="possessionStart" label="Possession Start" value={formData.possessionStart} />
                                        <DateField name="possessionEnd" label="Possession End" value={formData.possessionEnd} />
                                    </>
                                )} */}
                                <DropdownField
                                    name="manufacturer" label="Manufacturer" value={formData.manufacturer} w={w} colRow={colRow}
                                    handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Atro", label: "Atro" },
                                        { value: "Cartwright", label: "Cartwright" },
                                        { value: "DiMond", label: "DiMond" },
                                        { value: "Don-Bur", label: "Don-Bur" },
                                        { value: "Great Dane", label: "Great Dane" },
                                        { value: "Hyundai", label: "Hyundai" },
                                        { value: "Lufkin", label: "Lufkin" },
                                        { value: "Manac", label: "Manac" },
                                        { value: "Operbus", label: "Operbus" },
                                        { value: "Stoughton", label: "Stoughton" },
                                        { value: "Strick", label: "Strick" },
                                        { value: "Tiger", label: "Tiger" },
                                        { value: "TrailerMobile", label: "TrailerMobile" },
                                        { value: "Unity", label: "Unity" },
                                        { value: "Vanguard", label: "Vanguard" },
                                        { value: "Wabash", label: "Wabash" },
                                    ]}
                                />

                                {/* Model Year uses a specialised YearPicker component */}
                                <div className={colRow}>
                                    <label data-name="modelYear" className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
                                    <YearPicker
                                        name="modelYear"
                                        value={formData.modelYear}
                                        onChange={(year) => handleDropdownChange("modelYear", year)}
                                        width={w}
                                        minYear={1980}
                                        maxYear={new Date().getFullYear() + 1}
                                    />
                                </div>

                                {isUSTrailer && (
                                    <>

                                        {/* <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                            onSetNA={handleSetNA} name="manufacturerAssetId" label="Manufacturer Asset ID" value={formData.manufacturerAssetId} /> */}
                                        {/* <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                            onSetNA={handleSetNA} name="operator" label="Operator" value={formData.operator} />

                                        <DropdownField
                                            name="program" label="Program" value={formData.program}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "ATS", label: "ATS" },
                                                { value: "UTP", label: "UTP" },
                                            ]}
                                        />

                                        <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                                                                        onSetNA={handleSetNA} name="invoiceNumber" label="Invoice Number" value={formData.invoiceNumber} />
                                        <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                                                                        onSetNA={handleSetNA} name="warrantyBatchId" label="Warranty Batch ID" value={formData.warrantyBatchId} />
                                        <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                                                                        onSetNA={handleSetNA} name="healthScore" label="Health Score" value={formData.healthScore} />

                                        <DropdownField
                                            name="lifecycleState" label="Lifecycle State" value={formData.lifecycleState}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "Active", label: "Active" },
                                                { value: "End of Life", label: "End of Life" },
                                                { value: "Ordered", label: "Ordered" },
                                                { value: "Unavailable", label: "Unavailable" },
                                            ]}
                                        />

                                        <DropdownField
                                            name="lifecycleStateReason" label="Lifecycle State Reason" value={formData.lifecycleStateReason}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "Injection - Out of State Movement", label: "Injection - Out of State Movement" },
                                                { value: "Accident", label: "Accident" },
                                                { value: "Campaign", label: "Campaign" },
                                                { value: "Damaged-Moderate", label: "Damaged-Moderate" },
                                                { value: "Damaged-Severe", label: "Damaged-Severe" },
                                                { value: "Expired Inspection", label: "Expired Inspection" },
                                                { value: "GPS Malfunctioning", label: "GPS Malfunctioning" },
                                                { value: "Healthy", label: "Healthy" },
                                                { value: "Impounded/Tow", label: "Impounded/Tow" },
                                                { value: "LP investigation", label: "LP investigation" },
                                                { value: "Legal Hold - Do Not Repair", label: "Legal Hold - Do Not Repair" },
                                                { value: "License or Permit Issue", label: "License or Permit Issue" },
                                                { value: "Never Built", label: "Never Built" },
                                                { value: "Off-site storage", label: "Off-site storage" },
                                                { value: "Offsite Shop Repair", label: "Offsite Shop Repair" },
                                                { value: "Offsite Wash", label: "Offsite Wash" },
                                                { value: "Onsite Wash", label: "Onsite Wash" },
                                                { value: "PM Failed", label: "PM Failed" },
                                                { value: "Parts Delay", label: "Parts Delay" },
                                                { value: "Parts Storage", label: "Parts Storage" },
                                                { value: "Pending Delivery", label: "Pending Delivery" },
                                                { value: "Preventative Maintenance", label: "Preventative Maintenance" },
                                                { value: "Rental Pending Return", label: "Rental Pending Return" },
                                                { value: "Rental Returned", label: "Rental Returned" },
                                                { value: "Reported Stolen", label: "Reported Stolen" },
                                                { value: "Retired", label: "Retired" },
                                                { value: "Safety Recall", label: "Safety Recall" },
                                                { value: "Sensor Detected Damage", label: "Sensor Detected Damage" },
                                                { value: "Sensor Malfunction", label: "Sensor Malfunction" },
                                                { value: "Sold", label: "Sold" },
                                                { value: "Tire Survey", label: "Tire Survey" },
                                                { value: "To Be Disposed", label: "To Be Disposed" },
                                                { value: "To Be Returned", label: "To Be Returned" },
                                                { value: "Totalled", label: "Totalled" },
                                                { value: "Unaccounted For", label: "Unaccounted For" },
                                                { value: "Written Off - Lost", label: "Written Off - Lost" },
                                            ]}
                                        /> */}

                                        <DateField name="estimatedDateOfAvailability" label="Estimated Date of Availability" value={formData.estimatedDateOfAvailability} w={w} colRow={colRow} handleChange={handleChange} />

                                        <DropdownField
                                            name="purchaseCondition" label="Purchase Condition" value={formData.purchaseCondition}
                                            w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "New", label: "New" },
                                                { value: "Used", label: "Used" },
                                            ]}
                                        />

                                        <DateField name="purchaseDate" label="Purchase Date" value={formData.purchaseDate} w={w} colRow={colRow} handleChange={handleChange} />

                                        <DropdownField
                                            name="purchaseType" label="Purchase Type" value={formData.purchaseType}
                                            w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "Bought", label: "Bought" },
                                                { value: "Leased", label: "Leased" },
                                                { value: "Relay Equipment Marketplace", label: "Relay Equipment Marketplace" },
                                                { value: "Rental", label: "Rental" },
                                            ]}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sensors & Electrical */}
                    <div className={`bg-white rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full mb-4"}`}>
                        <button onClick={() => toggleSection('sensors')} className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4">
                            <h2 className="text-sm font-semibold text-gray-900">Sensors & Electrical</h2>
                            <span className="text-gray-400">{expandedSections.sensors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.sensors && (
                            <div className={`space-y-4 w-full ${prop === "batch" ? "" : "border border-gray-300 rounded-lg px-6 py-6"}`}>
                                <RadioField name="absSensor" label="ABS Sensor" value={formData.absSensor} flexRow={flexRow} handleChange={handleChange} />
                                <RadioField name="airTankMonitor" label="Air Tank Monitor" value={formData.airTankMonitor} flexRow={flexRow} handleChange={handleChange} />
                                <RadioField name="atisRegulator" label="ATIS Regulator" value={formData.atisRegulator} flexRow={flexRow} handleChange={handleChange} />
                                <RadioField name="lightOutSensor" label="Light Out Sensor" value={formData.lightOutSensor} flexRow={flexRow} handleChange={handleChange} />
                                <RadioField name="sensorError" label="Sensor Error" value={formData.sensorError} flexRow={flexRow} handleChange={handleChange} />
                                <RadioField name="ultrasonicCargoSensor" label="Ultrasonic Cargo Sensor" value={formData.ultrasonicCargoSensor} flexRow={flexRow} handleChange={handleChange} />

                                {isUSTrailer && (
                                    <>
                                        <DateField name="pulsatingLampInstallationDate" label="Pulsating Lamp Installation Date" value={formData.pulsatingLampInstallationDate} w={w} colRow={colRow} handleChange={handleChange} />
                                        <DropdownField
                                            name="pulsatingLampManufacturer" label="Pulsating Lamp Manufacturer" value={formData.pulsatingLampManufacturer}
                                            w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "Grote", label: "Grote" },
                                            ]}
                                        />
                                        <TextFieldWithNA w={w}
                                            colRow={colRow}
                                            onChange={handleChange}
                                            onSetNA={handleSetNA} name="pulsatingLampModel" label="Pulsating Lamp Model" value={formData.pulsatingLampModel} />
                                        <RadioField name="pulsatingLampWiring" label="Pulsating Lamp Wiring" value={formData.pulsatingLampWiring} flexRow={flexRow} handleChange={handleChange} />
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Row 2 : Physical Dimensions & Components  |  Tire Location ── */}
                <div className={`flex ${prop === "single" ? `md:flex-row flex-col ${expandedSections.dimensions || expandedSections.tireLocation ? "mb-5" : ""}` : "flex-col px-4"} justify-between items-start gap-2`}>

                    {/* Physical Dimensions & Components */}
                    <div className={`rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full"}`}>
                        <button onClick={() => toggleSection('dimensions')} className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4">
                            <h2 className="text-sm font-semibold text-gray-900">Physical Dimensions & Components</h2>
                            <span className="text-gray-400">{expandedSections.dimensions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.dimensions && (
                            <div className={`space-y-4 w-full ${prop === "batch" ? "" : "border border-gray-300 rounded-lg px-6 py-6"}`}>
                                <DropdownField
                                    name="length" label="Length" value={formData.length}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={isUSTrailer ? [
                                        { value: "N/A", label: "N/A" },
                                        { value: "28 ft", label: "28 ft" },
                                        { value: "53 ft", label: "53 ft" },
                                    ] : [
                                        { value: "N/A", label: "N/A" },
                                        { value: "28 ft", label: "28 ft" },
                                        { value: "48 ft", label: "48 ft" },
                                        { value: "53 ft", label: "53 ft" },
                                    ]}
                                />
                                <DropdownField
                                    name="height" label="Height" value={formData.height}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "13 ft 6 in", label: "13 ft 6 in" },
                                    ]}
                                />
                                <DropdownField
                                    name="grossAxleWeightRating" label="Gross Axle Weight Rating" value={formData.grossAxleWeightRating}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "20000 lbs", label: "20000 lbs" },
                                        { value: "34000 lbs", label: "34000 lbs" },
                                    ]}
                                />
                                <DropdownField
                                    name="axleType" label="Axle Type" value={formData.axleType}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Dual Axle", label: "Dual Axle" },
                                        { value: "Single Axle", label: "Single Axle" },
                                    ]}
                                />
                                <DropdownField
                                    name="brakeType" label="Brake Type" value={formData.brakeType}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Disc", label: "Disc" },
                                        { value: "Drum", label: "Drum" },
                                    ]}
                                />
                                <DropdownField
                                    name="suspensionType" label="Suspension Type" value={formData.suspensionType}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Air", label: "Air" },
                                        { value: "Spring", label: "Spring" },
                                    ]}
                                />
                                <TextFieldWithNA w={w}
                                    colRow={colRow}
                                    onChange={handleChange}
                                    onSetNA={handleSetNA} name="tireModel" label="Tire Model" value={formData.tireModel} />
                                <DropdownField
                                    name="tireBrand" label="Tire Brand" value={formData.tireBrand}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Bridgestone", label: "Bridgestone" },
                                        { value: "Continental", label: "Continental" },
                                        { value: "Firestone", label: "Firestone" },
                                        { value: "Goodyear", label: "Goodyear" },
                                        { value: "Michelin", label: "Michelin" },
                                        { value: "Hankook", label: "Hankook" },
                                    ]}
                                />

                                {isUSTrailer && (
                                    <>
                                        <DropdownField name="tireSize" label="Tire Size" value={formData.tireSize}
                                            w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "295/75R22.5", label: "295/75R22.5" },
                                                { value: "385/65R22.5", label: "385/65R22.5" },
                                                { value: "435/50R19.5", label: "435/50R19.5" },
                                                { value: "445/45R19.5", label: "445/45R19.5" },
                                            ]} />
                                        <RadioField name="cargoLockFitted" label="Cargo Lock Fitted" value={formData.cargoLockFitted} handleChange={handleChange} flexRow={flexRow} />
                                        <DateField name="cargoLockInstalledDate" label="Cargo Lock Installed Date" value={formData.cargoLockInstalledDate} w={w} colRow={colRow} handleChange={handleChange} />
                                        <DropdownField
                                            name="cargoLockType" label="Cargo Lock Type" value={formData.cargoLockType}
                                            w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                            options={[
                                                { value: "N/A", label: "N/A" },
                                                { value: "Autida", label: "Autida" },
                                                { value: "Maple", label: "Maple" },
                                                { value: "People", label: "People" },
                                                { value: "iKin", label: "iKin" },
                                            ]}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tire Location */}
                    <div className={`bg-white rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full mb-4"}`}>
                        <button onClick={() => toggleSection('tireLocation')} className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4">
                            <h2 className="text-sm font-semibold text-gray-900">Tire Location</h2>
                            <span className="text-gray-400">{expandedSections.tireLocation ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.tireLocation && (
                            <div className={`space-y-4 w-full ${prop === "batch" ? "" : "border border-gray-300 rounded-lg px-6 py-6"}`}>
                                {tireLocationFields.map(({ key, label }) => (
                                    <DropdownField
                                        key={key}
                                        name={key}
                                        label={label}
                                        value={formData[key] as string}
                                        options={tireDepthOptions}
                                        w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Features & Appearance ── */}
                <div className={`bg-white rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full px-4"}`}>
                    <button onClick={() => toggleSection('features')} className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">Features & Appearance</h2>
                        <span className="text-gray-400">{expandedSections.features ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </button>

                    {expandedSections.features && (
                        <div className={`space-y-4 w-full ${prop === "batch" ? "" : "border border-gray-300 rounded-lg px-6 py-6"}`}>
                            <RadioField name="aerokits" label="Aerokits" value={formData.aerokits} handleChange={handleChange} flexRow={flexRow} />
                            <TextFieldWithNA w={w}
                                colRow={colRow}
                                onChange={handleChange}
                                onSetNA={handleSetNA} name="doorBranding" label="Door Branding" value={formData.doorBranding} />
                            <DropdownField
                                name="doorColor" label="Door Color" value={formData.doorColor}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={[
                                    { value: "N/A", label: "N/A" },
                                    { value: "Pantone 432 C", label: "Pantone 432 C" },
                                    { value: "White", label: "White" },
                                ]}
                            />
                            <RadioField name="doorSensor" label="Door Sensor" value={formData.doorSensor} handleChange={handleChange} flexRow={flexRow} />
                            <DropdownField
                                name="doorType" label="Door Type" value={formData.doorType}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={[
                                    { value: "N/A", label: "N/A" },
                                    { value: "Swing", label: "Swing" },
                                    { value: "Roll", label: "Roll" },
                                ]}
                            />
                            <RadioField name="lashSystem" label="Lash System" value={formData.lashSystem} handleChange={handleChange} flexRow={flexRow} />
                            <DropdownField
                                name="mudFlapType" label="Mud Flap Type" value={formData.mudFlapType}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={[
                                    { value: "N/A", label: "N/A" },
                                    { value: "Fast-Flap", label: "Fast-Flap" },
                                ]}
                            />
                            <DropdownField
                                name="panelBranding" label="Panel Branding" value={formData.panelBranding}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={[
                                    { value: "N/A", label: "N/A" },
                                    { value: "Bowman", label: "Bowman" },
                                    { value: "Prime", label: "Prime" },
                                    { value: "Tape on White", label: "Tape on White" },
                                    { value: "Smile on Blue 2016", label: "Smile on Blue 2016" },
                                    { value: "Smile on Blue 2017", label: "Smile on Blue 2017" },
                                    { value: "Smile on Blue 2018", label: "Smile on Blue 2018" },
                                    { value: "Smile on White 2019", label: "Smile on White 2019" },
                                    { value: "Unbranded", label: "Unbranded" },
                                    { value: "XTRA Lease", label: "XTRA Lease" },
                                ]}
                            />
                            {!isUSTrailer && (
                                <DropdownField
                                    name="noseBranding" label="Nose Branding" value={formData.noseBranding}
                                    w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Captive Mean", label: "Captive Mean" },
                                    ]}
                                />
                            )}
                            <RadioField name="skirted" label="Skirted" value={formData.skirted} handleChange={handleChange} flexRow={flexRow} />
                            <DropdownField
                                name="skirtColor" label="Skirt Color" value={formData.skirtColor}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={[
                                    { value: "N/A", label: "N/A" },
                                    { value: "Ekostinger", label: "Ekostinger" },
                                    { value: "Pantone 432 C", label: "Pantone 432 C" },
                                    { value: "Transtex", label: "Transtex" },
                                    { value: "White", label: "White" },
                                ]}
                            />
                            {/* Conspicuity Tape — Canada and US have different option sets */}
                            <DropdownField
                                name="conspicuityTape" label="Conspicuity Tape" value={formData.conspicuityTape}
                                w={w} colRow={colRow} handleDropdownChange={handleDropdownChange}
                                options={isUSTrailer ? [
                                    { value: "N/A", label: "N/A" },
                                    { value: "Bottom Rear", label: "Bottom Rear" },
                                    { value: "Full Rear Perimeter", label: "Full Rear Perimeter" },
                                ] : [
                                    { value: "N/A", label: "N/A" },
                                    { value: "Bottom Rear", label: "Bottom Rear" },
                                    { value: "Full Perimeter and Sides", label: "Full Perimeter and Sides" },
                                    { value: "Full Rear Perimeter", label: "Full Rear Perimeter" },
                                ]}
                            />
                            {isUSTrailer && (
                                <DateField name="conspicuityTapeInstallDate" label="Conspicuity Tape Install Date" value={formData.conspicuityTapeInstallDate} handleChange={handleChange} w={w} colRow={colRow} />
                            )}
                            {!isUSTrailer && (
                                <RadioField name="captiveBeam" label="Captive Beam" value={formData.captiveBeam} handleChange={handleChange} flexRow={flexRow} />
                            )}
                            <RadioField name="cargoCamera" label="Cargo Camera" value={formData.cargoCamera} handleChange={handleChange} flexRow={flexRow} />
                            <RadioField name="cartbars" label="Cartbars" value={formData.cartbars} handleChange={handleChange} flexRow={flexRow} />
                            <RadioField name="tpms" label="TPMS" value={formData.tpms} handleChange={handleChange} flexRow={flexRow} />
                            <RadioField name="trailerHeightDecal" label="Trailer Height Decal" value={formData.trailerHeightDecal} handleChange={handleChange} flexRow={flexRow} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
