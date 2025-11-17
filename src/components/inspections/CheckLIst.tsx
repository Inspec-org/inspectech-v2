import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import { FormData } from './BatchEdit';


export default function CheckList({ prop, formData, setFormData }: { prop: string; formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }) {


    const [expandedSections, setExpandedSections] = useState({
        identification: true,
        sensors: true,
        dimensions: true,
        features: true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDropdownChange = (name: string, value: string) => {
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

    const currentYear = new Date().getFullYear();

    const yearOptions = [
        { value: "na", label: "N/A" }, // 👈 add this at the top
        ...Array.from({ length: currentYear - 1980 + 1 }, (_, i) => {
            const year = currentYear - i; // descending: 2025 → 1980
            return { value: year.toString(), label: year.toString() };
        }),
    ];

    const handleSetNA = (field: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: "N/A"
        }));
    };


    return (
        <div className="">
            <div className="">

                <div className={`flex ${prop==="single" ? "flex-row" : "flex-col"} justify-between items-start gap-2`}>
                    {/* Identification & Registration */}
                    <div className={`rounded-lg ${prop==="single" ? "w-1/2" : "w-full"}`}>
                        <button
                            onClick={() => toggleSection('identification')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 mb-4"
                        >
                            <h2 className={`${prop==="single" ? "text-lg" : "text-sm"}  font-semibold text-gray-900`}>Identification & Registration</h2>
                            <span className="text-gray-400">{expandedSections.identification ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.identification && (
                            <div className="px-6 pb-6 space-y-4 shadow">
                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="poNumber"
                                            value={formData.poNumber}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md bg-[#FAF7FF] focus:outline-none"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment ID/Trailer Number</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="equipmentNumber"
                                            value={formData.equipmentNumber}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">VIN</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="vin"
                                            value={formData.vin}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate ID</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateId"
                                            value={formData.licensePlateId}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Country</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateCountry"
                                            value={formData.licensePlateCountry}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Expiration</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateExpiration"
                                            value={formData.licensePlateExpiration}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate State/Province</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="licensePlateState"
                                            value={formData.licensePlateState}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Possession Origin <br /> Location/ Pickup Location</label>
                                    <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                        <input
                                            type="text"
                                            name="possessionOrigin"
                                            value={formData.possessionOrigin}
                                            onChange={handleChange}
                                            placeholder="Enter value or click N/A"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                                    <CustomDropdown
                                        options={[
                                            { value: "n/a", label: "N/A" },
                                            { value: "atro", label: "Atro" },
                                            { value: "cartwright", label: "Cartwright" },
                                            { value: "dimond", label: "DiMond" },
                                            { value: "don-bur", label: "Don-Bur" },
                                            { value: "great-dane", label: "Great Dane" },
                                            { value: "hyundai", label: "Hyundai" },
                                            { value: "lufkin", label: "Lufkin" },
                                            { value: "manac", label: "Manac" },
                                            { value: "operbus", label: "Operbus" },
                                            { value: "stoughton", label: "Stoughton" },
                                            { value: "strick", label: "Strick" },
                                            { value: "tiger", label: "Tiger" },
                                            { value: "trailer-mobile", label: "TrailerMobile" },
                                            { value: "unity", label: "Unity" },
                                            { value: "vanguard", label: "Vanguard" },
                                            { value: "wabash", label: "Wabash" },
                                        ]}
                                        width={prop === "single" ? "230px" : undefined}                                        
                                        value={formData.manufacturer}
                                        onChange={(val) => handleDropdownChange("manufacturer", val)}
                                    />
                                </div>

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model Year</label>
                                    <CustomDropdown
                                        options={yearOptions}
                                        width={prop === "single" ? "230px" : undefined}
                                        value={formData.modelYear}
                                        onChange={(val) => handleDropdownChange("modelYear", val)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sensors & Electrical */}
                    <div className={`bg-white rounded-lg ${prop==="single" ? "w-1/2" : "w-full"}`}>
                        <button
                            onClick={() => toggleSection('sensors')}
                            className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 mb-4"
                        >
                            <h2 className={`${prop==="single" ? "text-lg" : "text-sm"}  font-semibold text-gray-900`}>Sensors & Electrical</h2>
                            <span className="text-gray-400">{expandedSections.sensors ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                        </button>

                        {expandedSections.sensors && (
                            <div className="px-6 pb-6 space-y-4 shadow">
                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">RTB Indicator</label>
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                                <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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
                <div className={`bg-white rounded-lg ${prop==="single" ? "w-1/2" : "w-full"}`}>
                    <button
                        onClick={() => toggleSection('dimensions')}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 mb-4"
                    >
                        <h2 className={`${prop==="single" ? "text-lg" : "text-sm"}  font-semibold text-gray-900`}>Physical Dimensions & Components</h2>
                        <span className="text-gray-400">{expandedSections.dimensions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </button>

                    {expandedSections.dimensions && (
                        <div className="px-6 pb-6 space-y-4">
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "28", label: "28 ft" },
                                        { value: "48", label: "48 ft" },
                                        { value: "53", label: "53 ft" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.length}
                                    onChange={(val) => handleDropdownChange("length", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "13-6", label: "13 ft 6 in" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.height}
                                    onChange={(val) => handleDropdownChange("height", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gross Axle Weight Rating</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "20000", label: "20000 lbs" },
                                        { value: "34000", label: "34000 lbs" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.grossAxleWeightRating}
                                    onChange={(val) => handleDropdownChange("grossAxleWeightRating}", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Axle Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "dual", label: "Dual Axle" },
                                        { value: "single", label: "Single Axle" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.axleType}
                                    onChange={(val) => handleDropdownChange("axleType", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brake Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "disc", label: "Disc" },
                                        { value: "drum", label: "Drum" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.brakeType}
                                    onChange={(val) => handleDropdownChange("brakeType", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Suspension Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "air", label: "Air" },
                                        { value: "spring", label: "Spring" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.suspensionType}
                                    onChange={(val) => handleDropdownChange("suspensionType", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tire Model</label>
                                <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                    <input
                                        type="text"
                                        name="tireModel"
                                        value={formData.tireModel}
                                        onChange={handleChange}
                                        placeholder="Enter value or click N/A"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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
                        </div>
                    )}
                </div>

                {/* Features & Appearance */}
                <div className={`bg-white rounded-lg mt-4 ${prop==="single" ? "w-1/2" : "w-full"}`}>
                    <button
                        onClick={() => toggleSection('features')}
                        className="w-full px-6 py-4 flex items-center justify-between bg-gray-100 mb-4"
                    >
                        <h2 className={`${prop==="single" ? "text-lg" : "text-sm"}  font-semibold text-gray-900`}>Features & Appearance</h2>
                        <span className="text-gray-400">{expandedSections.features ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                    </button>

                    {expandedSections.features && (
                        <div className="px-6 pb-6 space-y-4">
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amenikis</label>
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

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Branding</label>
                                <div className={`relative ${prop==="single" ? "w-[230px]" : "w-full"}`}>
                                    <input
                                        type="text"
                                        name="doorBranding"
                                        value={formData.doorBranding}
                                        onChange={handleChange}
                                        placeholder="Enter value or click N/A"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[#FAF7FF]"
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

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Color</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "pantone", label: "Pantone 432 C" },
                                        { value: "white", label: "White" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.doorColor}
                                    onChange={(val) => handleDropdownChange("doorColor", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Door Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "swing", label: "Swing" },
                                        { value: "roll", label: "Roll" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.doorType}
                                    onChange={(val) => handleDropdownChange("doorType", val)}
                                />
                            </div>

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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

                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mud Flap Type</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "fast-flap", label: "Fast-Flap" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.mudFlapType}
                                    onChange={(val) => handleDropdownChange("mudFlapType", val)}
                                />
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Panel Branding</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "fast-flap", label: "Fast-Flap" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.panelBranding}
                                    onChange={(val) => handleDropdownChange("panelBranding", val)}
                                />
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nose Branding</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "fast-flap", label: "Fast-Flap" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.mudFlapType}
                                    onChange={(val) => handleDropdownChange("mudFlapType", val)}
                                />
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Skirted</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="lashSystem"
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
                                            name="lashSystem"
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
                                            name="lashSystem"
                                            value="No"
                                            checked={formData.skirted === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skirt Color</label>
                                <CustomDropdown
                                    options={[
                                        { value: "n/a", label: "N/A" },
                                        { value: "fast-flap", label: "Fast-Flap" },

                                    ]}
                                    width={prop === "single" ? "230px" : undefined}
                                    value={formData.mudFlapType}
                                    onChange={(val) => handleDropdownChange("mudFlapType", val)}
                                />
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Captive Beam</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="beam"
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
                                            name="beam"
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
                                            name="beam"
                                            value="No"
                                            checked={formData.captiveBeam === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cargo Camera</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="cargo"
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
                                            name="cargo"
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
                                            name="cargo"
                                            value="No"
                                            checked={formData.cargoCameras === 'No'}
                                            onChange={handleChange}
                                            className="mr-2"
                                        />
                                        No
                                    </label>
                                </div>
                            </div>
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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
                            <div className={`flex flex-col ${prop==="single" ? "xl:flex-row xl:items-center" : "xl:flex-col xl:items-start"} justify-between gap-4 items-start `}>
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
