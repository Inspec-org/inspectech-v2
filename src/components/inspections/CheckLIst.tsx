import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { FormData } from './Edit';
import DatePicker from "react-datepicker";
import YearPicker from '../ui/YearPicker';
import Cookies from 'js-cookie';

export default function CheckList({ prop, formData, setFormData, missingKeys }: { prop: string; formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>>; missingKeys?: string[] }) {


    const [expandedSections, setExpandedSections] = useState({
        identification: true,
        sensors: true,
        dimensions: true,
        features: true,
    });

    const isCanadaTrailers = ((Cookies.get('selectedDepartment') || '').toLowerCase() === 'canada trailers');

    useEffect(() => {
        const labelCls = 'missing-field-label';
        const fieldCls = 'missing-field-input';
        document.querySelectorAll('.' + labelCls).forEach(el => el.classList.remove(labelCls));
        document.querySelectorAll('.' + fieldCls).forEach(el => el.classList.remove(fieldCls));
        (missingKeys || []).forEach((key) => {
            const input = document.querySelector<HTMLInputElement>(`input[name="${key}"]`);
            if (input) {
                let container: HTMLElement | null = input.closest('div.relative') as HTMLElement | null;
                let labelEl: HTMLElement | null = null;
                if (container && container.previousElementSibling && container.previousElementSibling.tagName.toLowerCase() === 'label') {
                    labelEl = container.previousElementSibling as HTMLElement;
                } else {
                    container = input.closest('div') as HTMLElement | null;
                    while (container && !(container.previousElementSibling && container.previousElementSibling.tagName.toLowerCase() === 'label')) {
                        container = container.parentElement as HTMLElement | null;
                    }
                    labelEl = container?.previousElementSibling as HTMLElement | null;
                }
                if (labelEl) labelEl.classList.add(labelCls);
                if (container) container.classList.add(fieldCls);
            }
            const dd = document.querySelector(`[data-name="${key}"]`) as HTMLElement | null;
            if (dd) {
                const labelEl = dd.parentElement?.querySelector('label') as HTMLElement | null;
                if (labelEl) labelEl.classList.add(labelCls);
                dd.classList.add(fieldCls);
            }
        });
    }, [missingKeys]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDropdownChange = (name: string, value: string) => {
        console.log(name, value)
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleSetNA = (field: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: "N/A"
        }));
    };


    return (
        <div className="">
            <style jsx>{`
              .missing-field-label{color:#ef4444 !important;}
              .missing-field-input.relative input{background-color:#fee2e2 !important;border-color:#ef4444 !important;}
              .missing-field-input.flex{background-color:#fee2e2 !important;border:1px solid #ef4444 !important;border-radius:8px;}
              .missing-field-input>button{background-color:#fee2e2 !important;border-color:#ef4444 !important;color:#b91c1c !important;}
            `}</style>
            <div className="">

                <div className={`flex  ${prop === "single" ? `md:flex-row flex-col ${expandedSections.identification || expandedSections.sensors ? "mb-5" : ""}` : "flex-col px-4"} justify-between items-start gap-2 `}>
                    {/* Identification & Registration */}
                    <div className={`rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full"}`}>
                        <button
                            onClick={() => toggleSection('identification')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4"
                        >
                            <h2 className={`text-sm  font-semibold text-gray-900`}>Identification & Registration</h2>
                            <span className="text-gray-400">{expandedSections.identification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.identification && (
                            <div className="px-6 py-6 space-y-4 border border-gray-300 rounded-lg w-full">
                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="poNumber"
                                            value={formData.poNumber}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border text-sm border-gray-300 rounded-md bg-[#FAF7FF] focus:outline-none"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("poNumber")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>

                                </div>

                                {isCanadaTrailers && (
                                    <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                                        <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                            <input
                                                type="text"
                                                name="owner"
                                                value={formData.owner}
                                                onChange={handleChange}
                                                placeholder="Enter value or click N/A"
                                                className="w-full px-3 py-2 pr-14 border text-sm border-gray-300 rounded-md bg-[#FAF7FF] focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleSetNA("owner")}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                            >
                                                N/A
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <div className='flex-1'>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID/Trailer Number</label>
                                    </div>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="equipmentNumber"
                                            value={formData.equipmentNumber}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("equipmentNumber")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>

                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="vin"
                                            value={formData.vin}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("vin")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate ID</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateId"
                                            value={formData.licensePlateId}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("licensePlateId")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Country</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateCountry"
                                            value={formData.licensePlateCountry}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("licensePlateCountry")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Expiration</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateExpiration"
                                            value={formData.licensePlateExpiration}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("licensePlateExpiration")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">License Plate State/Province</label>
                                    </div>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateState"
                                            value={formData.licensePlateState}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("licensePlateState")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Possession Origin <br /> Location/ Pickup Location</label>
                                    <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="possessionOrigin"
                                            value={formData.possessionOrigin}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleSetNA("possessionOrigin")}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                        >
                                            N/A
                                        </button>
                                    </div>
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                                    <CustomDropdown name="manufacturer"
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
                                        width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                        value={formData.manufacturer}
                                        onChange={(val) => handleDropdownChange("manufacturer", val)}
                                    />
                                </div>

                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
                                    <YearPicker name="modelYear"
                                        value={formData.modelYear}
                                        onChange={(year) => handleDropdownChange("modelYear", year)}
                                        width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                        minYear={1980}
                                        maxYear={new Date().getFullYear() + 1}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sensors & Electrical */}
                    <div className={`bg-white rounded-lg ${prop === "single" ? "md:w-1/2 w-full" : "w-full mb-4"}`}>
                        <button
                            onClick={() => toggleSection('sensors')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4"
                        >
                            <h2 className={`text-sm  font-semibold text-gray-900`}>Sensors & Electrical</h2>
                            <span className="text-gray-400">{expandedSections.sensors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.sensors && (
                            <div className="px-6 py-6 space-y-4 border border-gray-300 rounded-lg w-full">
                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ABS Sensor</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="absSensor"
                                                value="N/A"
                                                checked={formData.absSensor === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="absSensor"
                                                value="Yes"
                                                checked={formData.absSensor === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="absSensor"
                                                value="No"
                                                checked={formData.absSensor === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Air Tank Monitor</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="airTankMonitor"
                                                value="N/A"
                                                checked={formData.airTankMonitor === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="airTankMonitor"
                                                value="Yes"
                                                checked={formData.airTankMonitor === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="airTankMonitor"
                                                value="No"
                                                checked={formData.airTankMonitor === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">ATIS Regulator</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="rtbIndicator"
                                                value="N/A"
                                                checked={formData.rtbIndicator === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="rtbIndicator"
                                                value="Yes"
                                                checked={formData.rtbIndicator === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="rtbIndicator"
                                                value="No"
                                                checked={formData.rtbIndicator === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Light Out Sensor</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="lightOutSensor"
                                                value="N/A"
                                                checked={formData.lightOutSensor === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="lightOutSensor"
                                                value="Yes"
                                                checked={formData.lightOutSensor === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="lightOutSensor"
                                                value="No"
                                                checked={formData.lightOutSensor === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sensor Error</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="sensorError"
                                                value="N/A"
                                                checked={formData.sensorError === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="sensorError"
                                                value="Yes"
                                                checked={formData.sensorError === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="sensorError"
                                                value="No"
                                                checked={formData.sensorError === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div className={`flex flex-row justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ultrasonic Cargo Sensor</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="ultrasonicCargoSensor"
                                                value="N/A"
                                                checked={formData.ultrasonicCargoSensor === 'N/A'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            N/A
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="ultrasonicCargoSensor"
                                                value="Yes"
                                                checked={formData.ultrasonicCargoSensor === 'Yes'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            Yes
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="ultrasonicCargoSensor"
                                                value="No"
                                                checked={formData.ultrasonicCargoSensor === 'No'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Physical Dimensions & Components */}
                <div className={`bg-white rounded-lg ${prop === "single" ? "md:w-1/2 w-full mb-5" : "w-full px-4"}`}>
                    <button
                        onClick={() => toggleSection('dimensions')}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4"
                    >
                        <h2 className={`text-sm  font-semibold text-gray-900`}>Physical Dimensions & Components</h2>
                        <span className="text-gray-400">{expandedSections.dimensions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </button>

                    {expandedSections.dimensions && (
                        <div className="px-6 py-6 space-y-4 border border-gray-300 rounded-lg">
                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                                <CustomDropdown name="length"
                                    options={isCanadaTrailers ? [
                                        { value: "N/A", label: "N/A" },
                                        { value: "28 ft", label: "28 ft" },
                                        { value: "53 ft", label: "53 ft" },
                                    ] : [
                                        { value: "N/A", label: "N/A" },
                                        { value: "28 ft", label: "28 ft" },
                                        { value: "48 ft", label: "48 ft" },
                                        { value: "53 ft", label: "53 ft" },
                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.length}
                                    onChange={(val) => handleDropdownChange("length", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                                <CustomDropdown name="height"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "13 ft 6 in", label: "13 ft 6 in" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.height}
                                    onChange={(val) => handleDropdownChange("height", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gross Axle Weight Rating</label>
                                <CustomDropdown name="grossAxleWeightRating"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "20000 lbs", label: "20000 lbs" },
                                        { value: "34000 lbs", label: "34000 lbs" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.grossAxleWeightRating}
                                    onChange={(val) => handleDropdownChange("grossAxleWeightRating", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Axle Type</label>
                                <CustomDropdown name="axleType"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Dual Axle", label: "Dual Axle" },
                                        { value: "Single Axle", label: "Single Axle" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.axleType}
                                    onChange={(val) => handleDropdownChange("axleType", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brake Type</label>
                                <CustomDropdown name="brakeType"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Disc", label: "Disc" },
                                        { value: "Drum", label: "Drum" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.brakeType}
                                    onChange={(val) => handleDropdownChange("brakeType", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Type</label>
                                <CustomDropdown name="suspensionType"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Air", label: "Air" },
                                        { value: "Spring", label: "Spring" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.suspensionType}
                                    onChange={(val) => handleDropdownChange("suspensionType", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tire Model</label>
                                <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                    <input
                                        type="text"
                                        name="tireModel"
                                        value={formData.tireModel}
                                        onChange={handleChange}
                                        placeholder="Enter value or click N/A"
                                        className="w-full px-3 py-2 border pr-12 border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSetNA("tireModel")}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                    >
                                        N/A
                                    </button>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tire Brand</label>
                                <CustomDropdown name="tireBrand"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Bridgestone", label: "Bridgestone" },
                                        { value: "Continental", label: "Continental" },
                                        { value: "Firestone", label: "Firestone" },
                                        { value: "Goodyear", label: "Goodyear" },
                                        { value: "Michelin", label: "Michelin" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.tireBrand}
                                    onChange={(val) => handleDropdownChange("tireBrand", val)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Features & Appearance */}
                <div className={`bg-white rounded-lg mt-4 ${prop === "single" ? "md:w-1/2 w-full" : "w-full px-4"}`}>
                    <button
                        onClick={() => toggleSection('features')}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 rounded-lg mb-4"
                    >
                        <h2 className={`text-sm  font-semibold text-gray-900`}>Features & Appearance</h2>
                        <span className="text-gray-400">{expandedSections.features ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </button>

                    {expandedSections.features && (
                        <div className="px-6 py-6 space-y-4 border border-gray-300 rounded-lg">
                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Aerokits</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="amenikis"
                                            value="N/A"
                                            checked={formData.amenikis === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="amenikis"
                                            value="Yes"
                                            checked={formData.amenikis === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="amenikis"
                                            value="No"
                                            checked={formData.amenikis === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Branding</label>
                                <div className={`relative ${prop === "single" ? "xl:w-[230px] w-full" : "w-full"}`}>
                                    <input
                                        type="text"
                                        name="doorBranding"
                                        value={formData.doorBranding}
                                        onChange={handleChange}
                                        placeholder="Enter value or click N/A"
                                        className="w-full px-3 py-2 pr-14 border border-gray-300 rounded-md bg-[#FAF7FF] text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSetNA("doorBranding")}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-sm px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded hover:bg-gray-200"
                                    >
                                        N/A
                                    </button>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Color</label>
                                <CustomDropdown name="doorColor"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Pantone 432 C", label: "Pantone 432 C" },
                                        { value: "White", label: "White" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.doorColor}
                                    onChange={(val) => handleDropdownChange("doorColor", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Door Sensor</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="doorSensor"
                                            value="N/A"
                                            checked={formData.doorSensor === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="doorSensor"
                                            value="Yes"
                                            checked={formData.doorSensor === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="doorSensor"
                                            value="No"
                                            checked={formData.doorSensor === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Type</label>
                                <CustomDropdown name="doorType"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Swing", label: "Swing" },
                                        { value: "Roll", label: "Roll" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.doorType}
                                    onChange={(val) => handleDropdownChange("doorType", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lash System</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="lashSystem"
                                            value="N/A"
                                            checked={formData.lashSystem === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="lashSystem"
                                            value="Yes"
                                            checked={formData.lashSystem === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="lashSystem"
                                            value="No"
                                            checked={formData.lashSystem === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mud Flap Type</label>
                                <CustomDropdown name="mudFlapType"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Fast-Flap", label: "Fast-Flap" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.mudFlapType}
                                    onChange={(val) => handleDropdownChange("mudFlapType", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Panel Branding</label>
                                <CustomDropdown name="panelBranding"
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
                                        { value: "XTRA Lease", label: "XTRA Lease" }
                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.panelBranding}
                                    onChange={(val) => handleDropdownChange("panelBranding", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nose Branding</label>
                                <CustomDropdown name="noseBranding"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Captive Mean", label: "Captive Mean" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.noseBranding}
                                    onChange={(val) => handleDropdownChange("noseBranding", val)}
                                />
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Skirted</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="skirted"
                                            value="N/A"
                                            checked={formData.skirted === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="skirted"
                                            value="Yes"
                                            checked={formData.skirted === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="skirted"
                                            value="No"
                                            checked={formData.skirted === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skirt Color</label>
                                <CustomDropdown name="skirtColor"
                                    options={[
                                        { value: "N/A", label: "N/A" },
                                        { value: "Ekostinger", label: "Ekostinger" },
                                        { value: "Pantone 432 C", label: "Pantone 432 C" },
                                        { value: "Transtex", label: "Transtex" },
                                        { value: "White", label: "White" },

                                    ]}
                                    width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                    value={formData.skirtColor}
                                    onChange={(val) => handleDropdownChange("skirtColor", val)}
                                />
                            </div>

                            {isCanadaTrailers && (
                                <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Conspicuity Tape</label>
                                    <CustomDropdown name="conspicuityTape"
                                        options={[
                                            { value: "N/A", label: "N/A" },
                                            { value: "Bottom Rear", label: "Bottom Rear" },
                                            { value: "Full Rear Perimeter", label: "Full Rear Perimeter" },
                                        ]}
                                        width={prop === "single" ? "xl:w-[230px] w-full" : "w-full"}
                                        value={formData.conspicuityTape}
                                        onChange={(val) => handleDropdownChange("conspicuityTape", val)}
                                    />
                                </div>
                            )}

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Captive Beam</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="captiveBeam"
                                            value="N/A"
                                            checked={formData.captiveBeam === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="captiveBeam"
                                            value="Yes"
                                            checked={formData.captiveBeam === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="captiveBeam"
                                            value="No"
                                            checked={formData.captiveBeam === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Camera</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cargoCameras"
                                            value="N/A"
                                            checked={formData.cargoCameras === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cargoCameras"
                                            value="Yes"
                                            checked={formData.cargoCameras === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cargoCameras"
                                            value="No"
                                            checked={formData.cargoCameras === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cartbars</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cartbars"
                                            value="N/A"
                                            checked={formData.cartbars === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cartbars"
                                            value="Yes"
                                            checked={formData.cartbars === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cartbars"
                                            value="No"
                                            checked={formData.cartbars === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">TPMS</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tpms"
                                            value="N/A"
                                            checked={formData.tpms === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tpms"
                                            value="Yes"
                                            checked={formData.tpms === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="tpms"
                                            value="No"
                                            checked={formData.tpms === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-between gap-4  ${prop === "single" ? "xl:flex-row xl:items-center" : ""} `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Trailer Height Decal</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="trailerHeightDecal"
                                            value="N/A"
                                            checked={formData.trailerHeightDecal === 'N/A'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        N/A
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="trailerHeightDecal"
                                            value="Yes"
                                            checked={formData.trailerHeightDecal === 'Yes'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        Yes
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="trailerHeightDecal"
                                            value="No"
                                            checked={formData.trailerHeightDecal === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}
