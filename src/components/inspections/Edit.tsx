'use client'
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Trash2, Save, Database, Info, CheckSquare, Image, Filter, Check, Edit2, CheckCircle, Briefcase } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import General from './General';
import CheckList from './CheckLIst';
import Media from './Media';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';

export interface FormData {
  unitId: string;
  departmentId: string;
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
  additionalAttachment1: string;
  additionalAttachment2: string;
  additionalAttachment3: string;
}

export default function Edit({ type }: { type: string }) {
  const [activeTab, setActiveTab] = useState('general');
  const Router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<FormData | null>(null);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const today = new Date();

  const [formData, setFormData] = useState<FormData>({
    unitId: '',
    departmentId: '',
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
    additionalAttachment1: '',
    additionalAttachment2: '',
    additionalAttachment3: '',
  });

  const params = useParams<{ inspection_id: string }>();
  const searchParams = useSearchParams();
  useEffect(() => {
    const deptName = sessionStorage.getItem('selectedDepartment');
    (async () => {
      try {
        const res = await apiRequest('/api/departments/get-departments');
        const json = await res.json();
        if (res.ok) {
          const dept = (json.departments || []).find((d: any) => d.name === deptName);
          if (dept?._id) {
            setFormData(prev => ({ ...prev, departmentId: dept._id }));
          }
        }
      } catch (e: any) {}
    })();
  }, []);

  useEffect(() => {
    if (type === "edit" && params?.inspection_id) {
      const unitId = params.inspection_id as string;
      (async () => {
        try {
          const res = await apiRequest(`/api/inspections/get-inspection-details?unitId=${encodeURIComponent(unitId)}`);
          const data = await res.json();
          if (res.ok && data.success && data.inspection) {
            const doc = data.inspection;
            const normalized: any = {
              ...doc,
              additionalAttachments: Array.isArray(doc.additionalAttachments) ? doc.additionalAttachments : [],
            };
            setFormData(prev => ({ ...prev, ...normalized }));
            setInspectionId(doc._id ?? null);
            setHasSavedOnce(true);
            setLastSaved(normalized);
            setIsSaved(true);
          } else {
            toast.error(data.message || "Inspection not found");
          }
        } catch (error: any) {
          toast.error(error.message || "Server error");
        }
      })();
    }
  }, [type, params]);


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

  const uploadToCloudinary = async (field: string, file: File) => {
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'inspections');
      body.append('unitId', formData.unitId || (params?.inspection_id as string) || '');
      body.append('field', field);
      const res = await apiRequest('/api/uploads', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok || !json.secure_url) {
        throw new Error(json.message || 'Upload failed');
      }
      const url: string = json.secure_url;
      setFormData(prev => {
        // if (field === 'additionalAttachments') {
        //   const arr = Array.isArray(prev.additionalAttachments) ? prev.additionalAttachments : [];
        //   return { ...prev, additionalAttachments: [...arr, url] };
        // }
        return { ...prev, [field]: url };
      });
      // toast.success('Uploaded to Cloudinary');
    } catch (e: any) {
      toast.error(e.message || 'Cloudinary upload failed');
    }
  };

  return (
    <div className="bg-white p-4">
      <div className="">
        {/* Header */}
        <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#F3EBFF] px-2 py-2 text-sm rounded-xl' onClick={() => Router.back()}>
          <ArrowLeft size={20} />
          <span>Back to Inspection</span>
        </button>
        {/* Title and Action Buttons */}
        <div className="flex xl:flex-row flex-col items-start xl:items-center justify-between mb-6 mt-2">
          {type === "edit" ? (
            <>
              <h1 className="text-lg font-semibold text-purple-600 my-4 ">Edit Inspection - {formData.unitId}</h1>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] w-full px-3 py-2'>
                  <Briefcase size={18} />
                  <span>Reassign Department</span>
                </button>

                <button className="flex gap-2 items-center bg-[#F49595] hover:bg-red-600 hover:text-white  text-sm rounded-xl text-white w-full px-3 py-2">
                  <Trash2 size={18} />
                  <span>Delete Inspection</span>
                </button>

                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white border border-[#0075FF] text-sm rounded-xl text-[#0075FF] w-full px-3 py-2' disabled={!formData.unitId || formData.unitId.trim() === ''} onClick={saveInspection}>
                  <Edit2 size={18} />
                  <span>Save Changes</span>
                </button>

                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] w-full px-3 py-2'>
                  <CheckCircle size={18} />
                  <span>Process Inspection Data</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-purple-600 my-2">Create New Inspection</h1>

              <div className="flex gap-3">
                <button
                  className={`flex gap-2 items-center px-2 py-2 text-sm rounded-xl w-full border ${!formData.unitId || formData.unitId.trim() === ''
                    ? 'bg-purple-400 cursor-not-allowed text-white border-transparent'
                    : 'bg-[#7522BB] border-white text-white hover:bg-[#5a1a95]'
                    }`}
                  disabled={!formData.unitId || formData.unitId.trim() === ''}
                  onClick={saveInspection}
                >
                  <Edit2 size={18} />
                  <span>Save Changes</span>
                </button>


                <button className='flex gap-2 items-center bg-[#10B981] hover:bg-[#0F9D58] border px-2 py-2 text-sm rounded-xl text-white w-full whitespace-nowrap' disabled={!isSaved} onClick={() => Router.push(`/inspections`)}>
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
            className={`flex xl:flex-row flex-col items-center xl:items-start gap-2 px-4 py-3 border-b-2 w-1/3 text-sm hover:bg-[#F3E8FF] hover:text-purple-600 ${activeTab === 'general'
              ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <Filter size={18} />
            <div className='flex flex-col justify-between'>
              <span className='text-center leading-tight'>General Information</span>
              {type === 'add' && (
                <span className='text-[10px] text-[#638de9] bg-[#D2E8FD] rounded-full border border-[#88AAF6] px-2 py-0.5 whitespace-nowrap'>
                  Initialize & Save
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              if (type === 'add' && !hasSavedOnce) return;
              setActiveTab('checklist');
            }}
            disabled={type === 'add' && !hasSavedOnce}
            className={`flex xl:flex-row flex-col items-center xl:items-start gap-2 px-4 py-3 border-b-2 w-1/3 text-sm hover:bg-[#F3E8FF] hover:text-purple-600 ${activeTab === 'checklist'
              ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              } ${(type === 'add' && !hasSavedOnce) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CheckSquare size={18} />
            <div className='flex flex-col justify-between'>
              <span className='text-center leading-tight'>Inspection Checklist</span>
              {(type === 'add' && !hasSavedOnce) && (
                <span className='text-[10px] text-[#514f4f] bg-[#FFFC8D] px-2 py-0.5 rounded-full border border-[#88AAF6] whitespace-nowrap'>
                  Save General First
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              if (type === 'add' && !hasSavedOnce) return;
              setActiveTab('media');
            }}
            disabled={type === 'add' && !hasSavedOnce}
            className={`flex xl:flex-row flex-col items-center xl:items-start gap-2 px-4 py-3 border-b-2 w-1/3 text-sm hover:bg-[#F3E8FF] hover:text-purple-600 ${activeTab === 'media'
              ? 'border-purple-600 text-purple-600 bg-[#F3E8FF]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              } ${(type === 'add' && !hasSavedOnce) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Image size={18} />
            <div className='flex flex-col justify-between'>
              <span className='text-center leading-tight'>Inspection Media Central</span>
              {(type === 'add' && !hasSavedOnce) && (
                <span className='text-[10px] text-[#514f4f] bg-[#FFFC8D] rounded-full border border-[#88AAF6] px-2 py-0.5 whitespace-nowrap'>
                  Save General First
                </span>
              )}
            </div>
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
          <Media formData={formData} setFormData={setFormData} onUploadToCloudinary={uploadToCloudinary} />
        )}
      </div>
    </div>
  );
}