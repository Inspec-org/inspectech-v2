'use client'
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Trash2, Save, Database, Info, CheckSquare, Image, Filter, Check } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import General from './General';
import CheckList from './CheckLIst';
import Media from './Media';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

export interface FormData {
    unitId: string;
    inspectionStatus: string;
    reviewReason: string;
    type: string;
    inspector: string;
    vendor: string;
    location: string;
    delivered: string;
    durationMin: string;
    durationSec: string;
    dateDay: string;
    dateMonth: string;
    dateYear: string;
    notes: string;
    poNumber: string;
    equipmentNumber: string;
    vin: string;
    licensePlateId: string;
    licensePlateCountry: string;
    licensePlateExpiration: string;
    licensePlateState: string;
    possessionOrigin: string;
    manufacturer: string;
    modelYear: string;
    absSensor: string;
    airTankMonitor: string;
    rtbIndicator: string;
    lightOutSensor: string;
    sensorError: string;
    ultrasonicCargoSensor: string;
    length: string;
    height: string;
    grossAxleWeightRating: string;
    axleType: string;
    brakeType: string;
    suspensionType: string;
    tireModel: string;
    amenikis: string;
    doorBranding: string;
    doorColor: string;
    doorSensor: string;
    doorType: string;
    lashSystem: string;
    mudFlapType: string;
    panelBranding: string;
    noseBranding: string;
    skirted: string;
    skirtColor: string;
    captiveBeam: string;
    cargoCameras: string;
    cartbars: string;
    tpms: string;
    trailerHeightDecal: string;
    frontLeftSideUrl: string;
    frontRightSideUrl: string;
    rearLeftSideUrl: string;
    rearRightSideUrl: string;
    insideTrailerImageUrl: string;
    doorDetailsImageUrl: string;
    dotFormImageUrl: string;
    dotFormPdfUrl: string;
    additionalAttachments: string[];
}

export default function BatchEdit({ type }: { type: string }) {
    const [activeTab, setActiveTab] = useState('general');
    const Router = useRouter();
    const [isSaved, setIsSaved] = useState(false);
    const [lastSaved, setLastSaved] = useState<FormData | null>(null);
    const [hasSavedOnce, setHasSavedOnce] = useState(false);
    const [inspectionId, setInspectionId] = useState<string | null>(null);
    const today = new Date();

    const [formData, setFormData] = useState<FormData>({
        unitId: '',
        inspectionStatus: '',
        reviewReason: '',
        type: '53 Foot Trailer',
        inspector: '',
        vendor: 'ABC Vendor',
        location: 'East Plant',
        delivered: '',
        durationMin: '5',
        durationSec: '00',
        dateDay: today.getDate().toString(),
        dateMonth: (today.getMonth() + 1).toString(),
        dateYear: today.getFullYear().toString(),
        notes: '',
        poNumber: '',
        equipmentNumber: '',
        vin: '',
        licensePlateId: '',
        licensePlateCountry: '',
        licensePlateExpiration: '',
        licensePlateState: '',
        possessionOrigin: '',
        manufacturer: '',
        modelYear: '',
        absSensor: '',
        airTankMonitor: '',
        rtbIndicator: '',
        lightOutSensor: '',
        sensorError: '',
        ultrasonicCargoSensor: '',
        length: '',
        height: '',
        grossAxleWeightRating: '',
        axleType: '',
        brakeType: '',
        suspensionType: '',
        tireModel: '',
        amenikis: '',
        doorBranding: '',
        doorColor: '',
        doorSensor: '',
        doorType: '',
        lashSystem: '',
        mudFlapType: '',
        panelBranding: '',
        noseBranding: '',
        skirted: '',
        skirtColor: '',
        captiveBeam: '',
        cargoCameras: '',
        cartbars: '',
        tpms: '',
        trailerHeightDecal: '',
        frontLeftSideUrl: '',
        frontRightSideUrl: '',
        rearLeftSideUrl: '',
        rearRightSideUrl: '',
        insideTrailerImageUrl: '',
        doorDetailsImageUrl: '',
        dotFormImageUrl: '',
        dotFormPdfUrl: '',
        additionalAttachments: [],
    });

    useEffect(() => {
      if (lastSaved) {
        setIsSaved(JSON.stringify(formData) === JSON.stringify(lastSaved));
      }
    }, [formData, lastSaved]);

    const createInspection = async () => {
      try {
        const res = await apiRequest('/api/inspections/add-new-inspection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setInspectionId(data.inspection?._id ?? null);
          toast.success('Inspection created');
        } else {
          toast.error(data.message || 'Failed to create inspection');
        }
      } catch (error: any) {
        toast.error(error.message || 'Server error');
        console.error(error.message);
      }
    };

    const saveInspection = async () => {
      if (!formData.unitId || formData.unitId.trim() === '') return;
      try {
        if (!hasSavedOnce) {
          const res = await apiRequest('/api/inspections/add-new-inspection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setInspectionId(data.inspection?._id ?? null);
            setHasSavedOnce(true);
            setLastSaved(formData);
            setIsSaved(true);
            toast.success('Initial inspection saved');
          } else {
            toast.error(data.message || 'Failed to save inspection');
          }
        } else {
          const res = await apiRequest('/api/inspections/update-inspection', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setLastSaved(formData);
            setIsSaved(true);
            toast.success('Inspection updated');
          } else {
            toast.error(data.message || 'Failed to update inspection');
          }
        }
      } catch (error: any) {
        toast.error(error.message || 'Server error');
        console.error(error.message);
      }
    };

    return (
        <div className="bg-white p-4">
            <div className="">
                {/* Header */}
                <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl' onClick={() => Router.back()}>
                    <ArrowLeft size={20} />
                    <span>Back to Inspection</span>
                </button>

                {/* Title and Action Buttons */}
                <div className="flex xl:flex-row flex-col items-start xl:items-center justify-between mb-6 mt-2">
                    {type === "edit" ? (
                        <>
                            <h1 className="text-lg font-semibold text-purple-600">Edit Inspection - I12</h1>

                            <div className="flex gap-3">
                                <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap'>
                                    <Users size={18} />
                                    <span>Reassign Department (2)</span>
                                </button>

                                <button className="flex gap-2 items-center bg-[#F49595] px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap">
                                    <Trash2 size={18} />
                                    <span>Delete Inspection (2)</span>
                                </button>

                                <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap' disabled={!formData.unitId || formData.unitId.trim() === ''} onClick={saveInspection}>
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </button>

                                <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap'>
                                    <Database size={18} />
                                    <span>Process Inspection Data</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-lg font-semibold text-purple-600">Create New Inspection</h1>

                            <div className="flex gap-3">
                                <button
                                    className={`flex gap-2 items-center px-2 py-2 text-sm rounded-xl whitespace-nowrap border ${!formData.unitId || formData.unitId.trim() === ''
                                        ? 'bg-purple-400 cursor-not-allowed text-white border-transparent'
                                        : 'bg-[#7522BB] border-white text-white hover:bg-[#5a1a95]'
                                        }`}
                                    disabled={!formData.unitId || formData.unitId.trim() === ''}
                                    onClick={saveInspection}
                                >
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </button>


                                <button className='flex gap-2 items-center bg-[#10B981] hover:bg-[#0F9D58] border px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap' disabled={!isSaved} onClick={()=> Router.push(`/inspections`)}>
                                    <Check size={18} />
                                    <span>Create Inspection</span>
                                </button>
                            </div>
                        </>
                    )}

                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 w-1/3 ${activeTab === 'general'
                            ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Filter size={18} />
                        <span className='flex whitespace-nowrap'>General Information
                            {type === 'add' && <span className='text-xs text-[#638de9] ml-2 bg-[#D2E8FD] px-2 py-1 rounded-full border border-[#88AAF6] whitespace-nowrap'>Initialize and Save First</span>}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            if (type === 'add' && !hasSavedOnce) return;
                            setActiveTab('checklist');
                        }}

                        disabled={type === 'add' && !hasSavedOnce}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 w-1/3 ${activeTab === 'checklist'
                            ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            } ${(type === 'add' && !hasSavedOnce) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <CheckSquare size={18} />
                        <span>Inspection Checklist
                            {(type === 'add' && !hasSavedOnce) && <span className='text-xs text-[#514f4f] ml-2 bg-[#FFFC8D] px-2 py-1 rounded-full border border-[#88AAF6]'>Save General info first</span>}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            if (type === 'add' && !hasSavedOnce) return;
                            setActiveTab('media');
                        }}
                        disabled={type === 'add' && !hasSavedOnce}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 w-1/3 ${activeTab === 'media'
                            ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            } ${(type === 'add' && !hasSavedOnce) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Image size={18} />
                        <span className='flex whitespace-nowrap'>Inspection Media Central
                            {(type === 'add' && !hasSavedOnce) && <span className='text-xs text-[#514f4f] ml-2 bg-[#FFFC8D] px-2 py-1 rounded-full border border-[#88AAF6] whitespace-nowrap'>Save General info first</span>}
                        </span>
                    </button>
                </div>

                {/* Form Content */}
                {activeTab === 'general' && (
                    <General type={type} formData={formData} setFormData={setFormData} disabledUnitId={hasSavedOnce} />
                )}

                {activeTab === 'checklist' && (
                    <CheckList prop='single' formData={formData} setFormData={setFormData} />
                )}

                {activeTab === 'media' && (
                    <Media formData={formData} setFormData={setFormData} />
                )}
            </div>
        </div>
    );
}