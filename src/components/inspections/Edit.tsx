'use client'
import React, { useState, useEffect, useContext } from 'react';
import { ArrowLeft, Users, Trash2, Save, Database, Info, CheckSquare, Image, Filter, Check, Edit2, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import General from './General';
import CheckList from './CheckLIst';
import Media from './Media';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { apiRequest } from '@/utils/apiWrapper';
import { toast } from 'react-toastify';
import { UserContext } from '@/context/authContext';
import { ClipLoader } from 'react-spinners';
import ReassignDepartmentModal from '../Modals/ReasssignDepartmentModal';
import { useModal } from '@/hooks/useModal';
import Cookies from 'js-cookie';
import { evaluateInspectionData, openDetailedResults as openDetailedResultsReport, ProcessResult } from './processing';

export interface FormData {
  unitId: string;
  departmentId: string;
  inspectionStatus: string;
  reviewReason: string;
  type: string;
  inspector: string;
  vendor: string;
  vendorId: string;
  location: string;
  delivered: string;
  durationMin: string;
  durationSec: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  notes: string;
  poNumber: string;
  owner: string;
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
  tireBrand: string;
  amenikis: string;
  conspicuityTape: string;
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
  dotFormPdfFileName?: string;
  additionalAttachment1: string;
  additionalAttachment2: string;
  additionalAttachment3: string;
}

export default function Edit({ type }: { type: string }) {
  const [activeTab, setActiveTab] = useState('general');
  const Router = useRouter();
  const { user } = useContext(UserContext);
  const [isSaved, setIsSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<FormData | null>(null);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const today = new Date();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const [department, setDepartment] = useState("");
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [showProcessDetails, setShowProcessDetails] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    unitId: '',
    departmentId: '',
    inspectionStatus: '',
    reviewReason: '',
    type: '53 Foot Trailer',
    inspector: '',
    vendor: '',
    vendorId: '',
    location: 'East Plant',
    delivered: '',
    durationMin: '5',
    durationSec: '00',
    dateDay: today.getDate().toString(),
    dateMonth: (today.getMonth() + 1).toString(),
    dateYear: today.getFullYear().toString(),
    notes: '',
    poNumber: '',
    owner: '',
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
    tireBrand: '',
    amenikis: '',
    conspicuityTape: '',
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
  useEffect(() => {
    const deptName = Cookies.get('selectedDepartment') || '';
    const deptId = Cookies.get('selectedDepartmentId') || '';
    setDepartment(deptId || '');
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
      } catch (e: any) { }
    })();
  }, []);



  useEffect(() => {
    const vendorName = Cookies.get('selectedVendor') || '';
    const vendorId = Cookies.get('selectedVendorId') || '';
    (async () => {
      try {
        const res = await apiRequest('/api/vendors/get-vendors');
        const json = await res.json();
        if (res.ok) {
          const vendor = (json.vendors || []).find((v: any) => v.name === vendorName);
          if (vendor?.name) {
            setFormData(prev => ({ ...prev, vendor: vendor.name, vendorId: vendor._id }));
          } else if (vendorName) {
            setFormData(prev => ({ ...prev, vendor: vendorName, vendorId: vendorId || '' }));
          }
        }
      } catch (e: any) { }
    })();
  }, []);

  useEffect(() => {
    if (type === 'edit') {
      const onDeptChanged = () => { Router.push(`/${user?.role}/inspections`); };
      const onVendorChanged = () => { Router.push(`/${user?.role}/inspections`); };
      window.addEventListener('selectedDepartmentChanged', onDeptChanged as EventListener);
      window.addEventListener('selectedVendorChanged', onVendorChanged as EventListener);
      return () => {
        window.removeEventListener('selectedDepartmentChanged', onDeptChanged as EventListener);
        window.removeEventListener('selectedVendorChanged', onVendorChanged as EventListener);
      };
    }
  }, [Router, user?.role, type]);

  useEffect(() => {
    console.log("params", type)
    if (type === "edit" && params?.inspection_id) {
      const unitId = params.inspection_id as string;
      setTimeout(() => {
        (async () => {
          try {
            setLoading(true);
            const res = await apiRequest(`/api/inspections/get-inspection-details?unitId=${encodeURIComponent(unitId)}`);
            const data = await res.json();

            if (res.ok && data.success && data.inspection) {
              const doc = data.inspection;
              console.log("doc", doc)
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
          finally {
            setLoading(false);
          }
        })();
      }, 1000)

    }
  }, [type, params]);


  useEffect(() => {
    if (lastSaved) {
      setIsSaved(JSON.stringify(formData) === JSON.stringify(lastSaved));
    }
  }, [formData, lastSaved]);


  const saveInspection = async () => {
    if (!formData.unitId || formData.unitId.trim() === '') return;
    try {
      setSaveLoading(true);
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
    finally {
      setSaveLoading(false);
    }
  };

  const uploadToCloudinary = async (field: string, file: File) => {
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('folder', 'inspections');
      body.append('unitId', formData.unitId || (params?.inspection_id as string) || '');
      body.append('field', field);
      body.append('originalFileName', file.name); // Add this line

      const res = await apiRequest('/api/uploads', { method: 'POST', body });
      const json = await res.json();

      console.log('Upload response:', json);

      if (!res.ok || !json.secure_url) {
        throw new Error(json.message || 'Upload failed');
      }
      const url: string = json.secure_url;

      console.log(`Setting ${field} to:`, url);

      setFormData(prev => {
        const updates: any = { [field]: url };
        // Store filename for PDFs
        if (field === 'dotFormPdfUrl' && json.originalFileName) {
          updates['dotFormPdfFileName'] = json.originalFileName;
        }
        return { ...prev, ...updates };
      });
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error(e.message || 'Upload failed');
      throw e; // Re-throw to handle in PDFUpload component
    }
  };


  const processInspectionData = () => {
    const source = lastSaved ?? formData;
    const res = evaluateInspectionData(source);
    setProcessResult(res);
    setShowProcessDetails(false);
  };

  const openDetailedResults = () => {
    const source = lastSaved ?? formData;
    openDetailedResultsReport(source);
  };


  return (
    <div className="bg-white p-4">
      {loading && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <ClipLoader color="#0075FF" size={40} />
        </div>
      )}
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
                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] w-full px-3 py-2' onClick={openModal}>
                  <Briefcase size={18} />
                  <span>Reassign Department</span>
                </button>

                <button className="flex gap-2 items-center bg-[#F49595]  text-sm rounded-xl text-white w-full px-3 py-2 cursor-not-allowed" disabled>
                  <Trash2 size={18} />
                  <span>Delete Inspection</span>
                </button>

                <button
                  className="group flex gap-2 items-center bg-white hover:bg-[#0075FF] border border-[#0075FF] text-sm rounded-xl text-[#0075FF] hover:text-white w-full px-3 py-2 disabled:opacity-60"
                  disabled={!formData.unitId || formData.unitId.trim() === '' || saveLoading}
                  onClick={saveInspection}
                >
                  {saveLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0075FF] group-hover:text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Edit2 size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>

                <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] w-full px-3 py-2' onClick={processInspectionData}>
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
                  disabled={!formData.unitId || formData.unitId.trim() === '' || saveLoading}
                  onClick={saveInspection}
                >
                  {saveLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>) : (
                    <>
                      <Edit2 size={18} />
                      <span>Save Changes</span>
                    </>
                  )}

                </button>


                <button className='flex gap-2 items-center bg-[#10B981] hover:bg-[#0F9D58] border px-2 py-2 text-sm rounded-xl text-white w-full whitespace-nowrap' disabled={!isSaved} onClick={() => Router.push(`/${user?.role}/inspections`)}>
                  <Check size={18} />
                  <span>Create Inspection</span>
                </button>
              </div>
            </>
          )}

        </div>

        {processResult && (
          <div className={`rounded-xl border px-4 py-3 mb-4 ${processResult.status === 'pass' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {processResult.status === 'pass' ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <XCircle size={18} className="text-red-600" />
                )}
                <span className="font-semibold">{processResult.status.toUpperCase()} - Inspection Data Processing Complete</span>
              </div>
              <button
                className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg border ${processResult.status === 'pass' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                onClick={openDetailedResults}
              >
                <span>View Detailed Results</span>
              </button>
            </div>
            {showProcessDetails && (
              <div className="mt-3 text-sm text-gray-700">
                {processResult.missing.length ? (
                  <>
                    <p className="mb-2">Missing fields:</p>
                    <ul className="list-disc pl-5">
                      {processResult.missing.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>All required checklist and media data are present.</p>
                )}
              </div>
            )}
          </div>
        )}

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
          <CheckList prop='single' formData={formData} setFormData={setFormData} missingKeys={processResult?.missingKeys} />
        )}

        {activeTab === 'media' && (
          <Media formData={formData} setFormData={setFormData} onUploadToCloudinary={uploadToCloudinary} />
        )}
      </div>
      <ReassignDepartmentModal
        isOpen={isOpen}
        onClose={closeModal}
        department={department}
        onDepartmentChange={setDepartment}
        selectedUnitIds={formData.unitId ? [formData.unitId] : []}
      />
    </div>
  );
}