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
import Swal from 'sweetalert2';
import { UserContext } from '@/context/authContext';
import { ClipLoader } from 'react-spinners';
import ReassignDepartmentModal from '../Modals/ReasssignDepartmentModal';
import { useModal } from '@/hooks/useModal';
import Cookies from 'js-cookie';
import { processInspectionFull, openDetailedResults as openDetailedResultsReport, ProcessResult, ProcessSections, MediaReport } from './processing';

// Old FormData interface - Commented out
/*
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
  possessionStart: string;
  possessionEnd: string;
  manufacturer: string;
  modelYear: string;
  manufacturerAssetId: string;
  operator: string;
  program: string;
  cargoLockFitted: string;
  cargoLockInstalledDate: string;
  cargoLockType: string;
  conspicuityTapeInstallDate: string;
  estimatedDateOfAvailability: string;
  healthScore: string;
  invoiceNumber: string;
  lifecycleState: string;
  lifecycleStateReason: string;
  pulsatingLampManufacturer: string;
  pulsatingLampModel: string;
  pulsatingLampWiring: string;
  purchaseCondition: string;
  purchaseDate: string;
  purchaseType: string;
  tireSize: string;
  warrantyBatchId: string;
  absSensor: string;
  airTankMonitor: string;
  atisregulator: string;
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
  leftFrontOuter: string;
  leftFrontInner: string;
  leftRearOuter: string;
  leftRearInner: string;
  rightFrontOuter: string;
  rightFrontInner: string;
  rightRearOuter: string;
  rightRearInner: string;
  aerokits: string;
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
  cargoCamera: string;
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
*/

// New FormData interface with updated field names
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
  equipmentId: string;
  vin: string;
  licensePlateId: string;
  licensePlateCountry: string;
  licensePlateExpiration: string;
  licensePlateStateOrProvince: string;
  possessionOriginLocation: string;
  manufacturer: string;
  modelYear: string;
  cargoLockFitted: string;
  cargoLockInstalledDate: string;
  cargoLockType: string;
  conspicuityTapeInstallDate: string;
  estimatedDateOfAvailability: string;
  pulsatingLampInstallationDate: string;
  pulsatingLampManufacturer: string;
  pulsatingLampModel: string;
  pulsatingLampWiring: string;
  purchaseCondition: string;
  purchaseDate: string;
  purchaseType: string;
  tireSize: string;
  assetId: string;
  absSensor: string;
  atisRegulator: string;
  aerokits: string;
  airTankMonitor: string;
  axleType: string;
  brakeType: string;
  cargoCamera: string;
  cartbars: string;
  conspicuityTape: string;
  doorBranding: string;
  doorColor: string;
  doorSensor: string;
  doorType: string;
  grossAxleWeightRating: string;
  height: string;
  lashSystem: string;
  length: string;
  lightOutSensor: string;
  mudFlapType: string;
  panelBranding: string;
  sensorError: string;
  skirtColor: string;
  skirted: string;
  suspensionType: string;
  tpms: string;
  tireBrand: string;
  tireModel: string;
  treadDepthLeftFrontOuter: string;
  treadDepthLeftFrontInner: string;
  treadDepthLeftRearOuter: string;
  treadDepthLeftRearInner: string;
  treadDepthRightFrontOuter: string;
  treadDepthRightFrontInner: string;
  treadDepthRightRearOuter: string;
  treadDepthRightRearInner: string;
  trailerHeightDecal: string;
  ultrasonicCargoSensor: string;

  // Keep old field names for backward compatibility
  equipmentNumber: string;
  licensePlateState: string;
  possessionOrigin: string;
  noseBranding: string;
  captiveBeam: string;
  atisregulator: string;
  leftFrontOuter: string;
  leftFrontInner: string;
  leftRearOuter: string;
  leftRearInner: string;
  rightFrontOuter: string;
  rightFrontInner: string;
  rightRearOuter: string;
  rightRearInner: string;

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
  const [processLoading, setProcessLoading] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const [department, setDepartment] = useState("");
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [processSections, setProcessSections] = useState<ProcessSections | null>(null);
  const [mediaReport, setMediaReport] = useState<MediaReport | null>(null);
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  const params = useParams<{ inspection_id: string }>();
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
    equipmentId: '',
    vin: '',
    licensePlateId: '',
    licensePlateCountry: '',
    licensePlateExpiration: '',
    licensePlateStateOrProvince: '',
    possessionOriginLocation: '',
    manufacturer: '',
    modelYear: '',
    cargoLockFitted: '',
    cargoLockInstalledDate: '',
    cargoLockType: '',
    conspicuityTapeInstallDate: '',
    estimatedDateOfAvailability: '',
    pulsatingLampInstallationDate: '',
    pulsatingLampManufacturer: '',
    pulsatingLampModel: '',
    pulsatingLampWiring: '',
    purchaseCondition: '',
    purchaseDate: '',
    purchaseType: '',
    tireSize: '',
    assetId: '',
    absSensor: '',
    atisRegulator: '',
    aerokits: '',
    airTankMonitor: '',
    axleType: '',
    brakeType: '',
    cargoCamera: '',
    cartbars: '',
    conspicuityTape: '',
    doorBranding: '',
    doorColor: '',
    doorSensor: '',
    doorType: '',
    grossAxleWeightRating: '',
    height: '',
    lashSystem: '',
    length: '',
    lightOutSensor: '',
    mudFlapType: '',
    panelBranding: '',
    sensorError: '',
    skirtColor: '',
    skirted: '',
    suspensionType: '',
    tpms: '',
    tireBrand: '',
    tireModel: '',
    treadDepthLeftFrontOuter: '',
    treadDepthLeftFrontInner: '',
    treadDepthLeftRearOuter: '',
    treadDepthLeftRearInner: '',
    treadDepthRightFrontOuter: '',
    treadDepthRightFrontInner: '',
    treadDepthRightRearOuter: '',
    treadDepthRightRearInner: '',
    trailerHeightDecal: '',
    ultrasonicCargoSensor: '',
    // Old field names for backward compatibility
    equipmentNumber: '',
    licensePlateState: '',
    possessionOrigin: '',
    noseBranding: '',
    captiveBeam: '',
    atisregulator: '',
    leftFrontOuter: '',
    leftFrontInner: '',
    leftRearOuter: '',
    leftRearInner: '',
    rightFrontOuter: '',
    rightFrontInner: '',
    rightRearOuter: '',
    rightRearInner: '',
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

  useEffect(() => {
    const deptName = Cookies.get('selectedDepartment') || '';
    const deptId = Cookies.get('selectedDepartmentId') || '';
    setDepartment(deptId || '');
    setFormData(prev => ({ ...prev, departmentId: deptId }));
  }, []);

  const getVendor = () => {
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
  };

  useEffect(() => {
    if (type !== "edit") {
      getVendor();
    }
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

              const emptyBase = Object.fromEntries(
                Object.keys(formData).map(k => [k, ''])
              ) as unknown as FormData;


              console.log("doc", doc)
              const normalized: any = {
                ...emptyBase,
                ...doc,
                additionalAttachments: Array.isArray(doc.additionalAttachments) ? doc.additionalAttachments : [],
              };

              setFormData(normalized);
              getVendor();
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


  const saveInspection = async (silent = false, skipLoadingState = false) => {
    if (!formData.unitId || formData.unitId.trim() === '') return false;
    try {
      if (!skipLoadingState) setSaveLoading(true);
      // Check if this is a new inspection (no inspectionId) or an existing one
      const isNewInspection = !inspectionId;
      if (isNewInspection) {
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
          return true;
        } else {
          toast.error(data.message || 'Failed to save inspection');
          return false;
        }
      } else {
        // Only call update API if there are actual changes
        if (isSaved) {
          if (!silent) toast.info('No changes to save');
          return false;
        }
        const res = await apiRequest('/api/inspections/update-inspection', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setLastSaved(formData);
          setIsSaved(true);
          if (!silent) toast.success('Inspection updated');
          return true;
        } else {
          toast.error(data.message || 'Failed to update inspection');
          return false;
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Server error');
      return false;
    }
    finally {
      if (!skipLoadingState) setSaveLoading(false);
    }
  };

  const handleDeleteInspection = async () => {
    const unitId = formData.unitId || (params?.inspection_id as string) || '';
    if (!unitId) { toast.error('Unit ID missing'); return; }
    const result = await Swal.fire({
      title: 'Delete Inspection',
      text: 'Delete this inspection? This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Delete'
    });
    if (!result.isConfirmed) return;
    try {
      setLoading(true);
      const res = await apiRequest('/api/inspections/delete-inspections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, vendorId: formData.vendorId, departmentId: formData.departmentId })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Inspection deleted');
        Router.push(`/${user?.role}/inspections`);
      } else {
        toast.error(json.message || 'Failed to delete inspection');
      }
    } catch (e: any) {
      toast.error(e.message || 'Server error');
    } finally {
      setLoading(false);
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

      if (!res.ok || !json.secure_url) {
        throw new Error(json.message || 'Upload failed');
      }
      const url: string = json.secure_url;

      setFormData(prev => {
        const updates: any = { [field]: url };
        // Store filename for PDFs
        if (field === 'dotFormPdfUrl' && json.originalFileName) {
          updates['dotFormPdfFileName'] = json.originalFileName;
        }
        return { ...prev, ...updates };
      });
    } catch (e: any) {
      throw e;
    }
  };


  const processInspectionData = async () => {
    let didSave = false;
    if (!isSaved) {
      didSave = await saveInspection(true, true);
    }
    if (isSaved || didSave) {
      const unitId = formData.unitId || (params?.inspection_id as string) || '';

      setProcessLoading(true);
      setProcessResult(null);
      setProcessSections(null);
      setMediaReport(null);
      setShowProcessDetails(false);

      // ── 1. Checklist (fast ~1-2s) ─────────────────────────────────
      // Fire and handle immediately when it resolves
      const checklistPromise = apiRequest(
        `/mobile-api/inspections/processInspection?unitId=${encodeURIComponent(unitId)}`
      )
        .then((r) => r.json())
        .then((json) => {
          if (!json.success) throw new Error(json.message || 'Failed to process inspection');
          const { status, missing, missingKeys, sections } = json.data;
          setProcessResult({ status, missing, missingKeys });
          setProcessSections(sections);
        })
        .catch((e: any) => {
          toast.error(e.message || 'Error processing inspection');
        })
        .finally(() => {
          setProcessLoading(false); // stop spinner as soon as checklist is done
        });

      // ── 2. Media (slow ~30s) ──────────────────────────────────────
      // Fire in parallel; update media state when it eventually resolves
      apiRequest(
        `/mobile-api/inspections/processMedia?unitId=${encodeURIComponent(unitId)}`
      )
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setMediaReport(json.data as MediaReport);
        })
        .catch(() => {
          // Non-fatal – media banner simply won't show
        });
    }
  };

  // Reset processResult on component mount to clear stale validation results
  useEffect(() => {
    setProcessResult(null);
    setProcessSections(null);
    setMediaReport(null);
  }, []);

  const openDetailedResults = () => {
    const unitId = formData.unitId || (params?.inspection_id as string) || '';
    if (processSections) openDetailedResultsReport(unitId, processSections, mediaReport);
  };


  return (
    <div className="bg-white sm:p-4 p-2">
      {loading && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <ClipLoader color="#0075FF" size={40} />
        </div>
      )}
      <div className="">
        {/* Header */}
        <div className="mb-6 mt-2">
          <div className="flex justify-between flex-wrap items-center gap-2 flex-nowrap overflow-x-auto">
            <div>
              <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#F3EBFF] px-2 py-2 text-sm rounded-xl shrink-0' onClick={() => Router.back()}>
                <ArrowLeft size={20} />
                <span>Back to Inspection</span>
              </button>
            </div>
            <div className='flex items-center gap-4 flex-wrap'>
              {type === "edit" ? (
                <>
                  <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] px-3 py-2 whitespace-nowrap shrink-0' onClick={openModal}>
                    <Briefcase size={18} />
                    <span>Reassign Department</span>
                  </button>

                  {user?.role === "superadmin" && (
                    <button className='flex gap-2 items-center bg-[#ff3434] hover:bg-[#ff3434]/70 px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap shrink-0' onClick={handleDeleteInspection}>
                      <Trash2 size={18} />
                      Delete Inspection
                    </button>
                  )}

                  <button
                    className="group flex gap-2 items-center bg-white hover:bg-[#0075FF] border border-[#0075FF] text-sm rounded-xl text-[#0075FF] hover:text-white px-3 py-2 disabled:opacity-60 whitespace-nowrap shrink-0"
                    disabled={!formData.unitId || formData.unitId.trim() === '' || saveLoading}
                    onClick={() => saveInspection()}
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

                  <button className='flex gap-2 items-center bg-[#F3EBFF66] hover:bg-[#0075FF] hover:text-white  border border-[#0075FF] text-sm rounded-xl text-[#0075FF] px-3 py-2 whitespace-nowrap shrink-0 disabled:opacity-60' onClick={processInspectionData} disabled={processLoading}>
                    {processLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>Process Inspection Data</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`flex gap-2 items-center px-2 py-2 text-sm rounded-xl border ${!formData.unitId || formData.unitId.trim() === ''
                      ? 'bg-purple-400 cursor-not-allowed text-white border-transparent'
                      : 'bg-[#7522BB] border-white text-white hover:bg-[#5a1a95]'
                      }`}
                    disabled={!formData.unitId || formData.unitId.trim() === '' || saveLoading}
                    onClick={() => saveInspection()}
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

                  <button className='flex gap-2 items-center bg-[#10B981] hover:bg-[#0F9D58] border px-2 py-2 text-sm rounded-xl text-white whitespace-nowrap shrink-0' disabled={!isSaved} onClick={() => Router.push(`/${user?.role}/inspections`)}>
                    <Check size={18} />
                    <span>Create Inspection</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-2">
            {type === "edit" ? (
              <h1 className="text-lg font-semibold text-purple-600 my-4 ">Edit Inspection - {formData.unitId}</h1>
            ) : (
              <h1 className="text-lg font-semibold text-purple-600 my-2">Create New Inspection</h1>
            )}
          </div>
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
                <span className="font-semibold">
                  {processResult.status.toUpperCase()} – Inspection Checklist Complete
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Media still loading indicator */}
                {!mediaReport && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analysing media…
                  </span>
                )}
                {/* View Detailed Results — shown immediately for checklist; media section inside shows spinner until ready */}
                {processSections && (
                  <button
                    className={`flex items-center gap-2 px-3 py-1 text-sm rounded-lg border ${processResult.status === 'pass' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}`}
                    onClick={openDetailedResults}
                  >
                    <span>View Detailed Results</span>
                  </button>
                )}
              </div>
            </div>
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