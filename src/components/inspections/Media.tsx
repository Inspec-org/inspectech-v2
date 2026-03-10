import React, { useEffect, useState, useRef } from 'react';
import { Upload, Check, LucideImage, ChevronUp, ChevronDown, Camera, CloudUpload, X, ZoomIn } from 'lucide-react';
import type { FormData as InspectionFormData } from './Edit';
import { toast } from 'react-toastify';
interface UploadCardProps {
    title: string;
    description: string;
    currentUrl?: string | null;
    onUploadToCloudinary: (file: File) => Promise<void>;
    onRemove?: () => void;
    onZoom?: () => void;
    uploadAreaId?: string;
}
type TabType = 'Front Left Side' | 'Front Right Side' | 'Rare Left Side' | 'Rare Right Side' | 'Inside Trailer Image' | 'Door Details Image';

const UploadCard: React.FC<UploadCardProps> = ({ title, description, currentUrl, onUploadToCloudinary, onRemove, onZoom, uploadAreaId }) => {
    const [isUploaded, setIsUploaded] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setIsUploaded(false);
            setUploadProgress(0);
            handleUpload(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleUpload = async (file?: File) => {
        const toUpload = file ?? selectedFile;
        if (toUpload) {
            setIsUploading(true);
            setUploadProgress(0);
            let interval: number | undefined;
            try {
                interval = window.setInterval(() => {
                    setUploadProgress((p) => (p < 95 ? p + 5 : p));
                }, 300);
                await onUploadToCloudinary(toUpload);
                setIsUploaded(true);
                setUploadProgress(100);
                toast.success("Image Uploaded Successfully")
            }
            catch (e) {
                toast.error("Image Upload Failed")
            }
            finally {
                setIsUploading(false);
                if (interval) {
                    clearInterval(interval);
                }
            }
        }
    };

    const isEmpty = !(previewUrl || currentUrl);
    return (
        <div className="border border-gray-300 rounded-lg p-4 bg-white h-full flex flex-col">
            <div className="mb-4">
                <h3 className="font-semibold text-base mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>

            <div
                className={`border-2 border-dashed rounded-lg ${isEmpty ? 'p-8 min-h-[200px] cursor-pointer hover:bg-gray-50' : 'p-2'} mb-4 flex flex-col items-center justify-center relative flex-1 ${isDragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    setSelectedFile(file);
                    const url = URL.createObjectURL(file);
                    setPreviewUrl(url);
                    setIsUploaded(false);
                    setUploadProgress(0);
                    handleUpload(file);
                }}
                onClick={() => { if (!(previewUrl || currentUrl)) inputRef.current?.click(); }}
                data-upload-area={uploadAreaId ?? title}
            >
                {(previewUrl || currentUrl) ? (
                    <>
                        <img src={previewUrl || currentUrl || ''} alt="Preview" className="w-full max-h-56 object-contain" />
                        {onRemove && (
                            <button
                                type="button"
                                onClick={() => { setSelectedFile(null); setPreviewUrl(null); setIsUploaded(false); onRemove(); }}
                                className="absolute top-2 right-2 bg-white/90 hover:bg-white border border-gray-300 rounded-full p-1 shadow-sm"
                                aria-label="Remove image"
                            >
                                <X size={16} className="text-gray-700" />
                            </button>
                        )}
                        {onZoom && (
                            <button
                                type="button"
                                onClick={onZoom}
                                className="absolute bottom-2 left-2 bg-white/90 hover:bg-white rounded-full px-2 py-1 text-xs "
                                aria-label="Zoom slideshow"
                            >
                                <ZoomIn size={20} />
                            </button>
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 mb-3 flex items-center justify-center">
                            <LucideImage className='opacity-40' size={56} />
                        </div>
                        <p className="text-sm text-gray-600 mb-1 text-center">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">Supported formats: JPG, PNG</p>
                        <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
                    </>
                )}
            </div>

            <label className="block w-full mb-3">
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    ref={inputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="border border-gray-300 rounded-lg py-2 px-4 text-center cursor-pointer bg-[#FAF4FF] hover:bg-[#FAF4FF]/60 flex items-center justify-center gap-2">
                    <Upload size={16} />
                    <span className="text-sm font-medium ">Select Image</span>
                </div>
            </label>

            {isUploading && (
                <div className="w-full mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-center">{uploadProgress}%</p>
                </div>
            )}

            {/* {isUploaded && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                        <Check size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-green-800">Upload Successful</p>
                        <p className="text-sm text-green-700">Inside Trailer image successfully saved to the database</p>
                    </div>
                </div>
            )} */}
        </div>
    );
};

const PDFUpload: React.FC<{
    onUploadToCloudinary: (file: File) => Promise<void>;
    currentUrl?: string | null;
    currentFileName?: string | null; // Add this
}> = ({ onUploadToCloudinary, currentUrl, currentFileName }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string | null>(null);

    // Set preview URL and filename from props on mount
    useEffect(() => {
        if (currentUrl) {
            setPreviewUrl(currentUrl);
        }
        if (currentFileName) {
            setOriginalFileName(currentFileName);
        }
    }, [currentUrl, currentFileName]);

    const handleUpload = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        let interval: number | undefined;

        try {
            interval = window.setInterval(() => {
                setUploadProgress((p) => (p < 95 ? p + 5 : p));
            }, 300);

            await onUploadToCloudinary(file);
            setUploadProgress(100);

            toast.success("PDF Uploaded Successfully");
        } catch (e: any) {
            toast.error(e?.message || "PDF Upload Failed");
            ;
        } finally {
            setIsUploading(false);
            if (interval) {
                clearInterval(interval);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Please select a PDF file');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File size exceeds 5MB. Please select a smaller file.');
            return;
        }

        setUploadedFile(file);
        setOriginalFileName(file.name);
        setUploadProgress(0);

        void handleUpload(file);

        e.target.value = '';
    };

    const handleViewPDF = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
        }
    };
    return (
        <div className="">
            <div className="border border-gray-300 rounded-lg p-4 bg-white h-full flex flex-col">
                <h2 className="text-lg font-semibold mb-4">DOT Form PDF</h2>

                <p className="text-sm text-gray-700 mb-4">
                    Maximum file size: 5MB
                </p>

                <label className="inline-block mb-6">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />
                    <div className={`bg-purple-600 text-white rounded-lg py-2.5 px-6 font-medium hover:bg-purple-700 cursor-pointer inline-flex items-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <Upload size={18} />
                        Select PDF
                    </div>
                </label>

                <div className="border-t border-gray-300 pt-6 flex-grow">
                    {previewUrl ? (
                        <div className="text-sm text-gray-700 mb-4">
                            {/* <p className="font-medium mb-2 text-green-600">✓ PDF Saved in Database</p> */}
                            <div className="b">
                                <p className="font-medium mb-2 text-gray-800">
                                    {originalFileName || 'DOT Form.pdf'}
                                </p>
                                <button
                                    onClick={handleViewPDF}
                                    className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 hover:text-blue-800"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                    View PDF
                                </button>
                            </div>
                        </div>
                    ) : uploadedFile ? (
                        <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">Selected: {uploadedFile.name}</p>
                            <p className="text-gray-500">Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">No PDF Uploaded yet</p>
                    )}
                </div>

                {isUploading && (
                    <div className="w-full mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">{uploadProgress}%</p>
                    </div>
                )}


            </div>
        </div>
    );
};

const ImageAlignmentGuide: React.FC<{ onUploadToCloudinary: (field: string, file: File) => Promise<void> }> = ({ onUploadToCloudinary }) => {
    const [showGuide, setShowGuide] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('Front Left Side');

    const tabs: TabType[] = [
        'Front Left Side',
        'Front Right Side',
        'Rare Left Side',
        'Rare Right Side',
        'Inside Trailer Image',
        'Door Details Image'
    ];

    const referenceImages: Record<TabType, string> = {
        'Front Left Side': '/images/reference_images/front_left_reference.jpg',
        'Front Right Side': '/images/reference_images/front_right_reference.jpg',
        'Rare Left Side': '/images/reference_images/rear_left_reference.jpg',
        'Rare Right Side': '/images/reference_images/rear_right_reference.jpg',
        'Inside Trailer Image': '/images/reference_images/inside_trailer_reference.jpg',
        'Door Details Image': '/images/reference_images/door_details_reference.jpg',
    };

    const silhouetteImages: Record<TabType, string> = {
        'Front Left Side': '/images/reference_images/front_left_silhouette.svg',
        'Front Right Side': '/images/reference_images/front_right_silhouette.svg',
        'Rare Left Side': '/images/reference_images/rear_left_silhouette.svg',
        'Rare Right Side': '/images/reference_images/rear_right_silhouette.svg',
        'Inside Trailer Image': '/images/reference_images/inside_trailer_silhouette.svg',
        'Door Details Image': '/images/reference_images/door_details_silhouette.svg',
    };

    const referenceMaskImages: Record<TabType, string> = {
        'Front Left Side': '/images/reference_images/front_left_mask.png',
        'Front Right Side': '/images/reference_images/front_right_mask.png',
        'Rare Left Side': '/images/reference_images/rear_left_mask.png',
        'Rare Right Side': '/images/reference_images/rear_right_maskf.png',
        'Inside Trailer Image': '/images/reference_images/inside_trailer_mask.png',
        'Door Details Image': '/images/reference_images/door_details_mask.png',
    };

    const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
    const [overlayFile, setOverlayFile] = useState<File | null>(null);
    const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
    const [evalError, setEvalError] = useState<string | null>(null);
    const [computing, setComputing] = useState(false);
    const overlayInputRef = useRef<HTMLInputElement>(null);
    const cameraVideoRef = useRef<HTMLVideoElement>(null);
    const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showPermissionHelp, setShowPermissionHelp] = useState(false);
    const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const segCtrlRef = useRef<AbortController | null>(null);
    const segSeqRef = useRef(0);
    const [cameraSize, setCameraSize] = useState<{ width: number; height: number } | null>(null);

    
    const queryCameraPermission = async (): Promise<'granted'|'denied'|'prompt'|'unknown'> => {
        try {
            const res = await (navigator as any).permissions?.query?.({ name: 'camera' as any });
            return (res?.state as 'granted'|'denied'|'prompt') ?? 'unknown';
        } catch {
            return 'unknown';
        }
    };

    const startCamera = async () => {
        if (computing) return;

        try {
            setShowCamera(true);

            await new Promise(r => setTimeout(r, 50));

            const preview = previewRef.current;

            if (preview) {
                const rect = preview.getBoundingClientRect();

                setCameraSize({
                    width: rect.width,
                    height: rect.height
                });
            } else {
                setCameraSize({
                    width: 600,
                    height: 400
                });
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            cameraStreamRef.current = stream;

            const v = cameraVideoRef.current;
            if (v) {
                v.srcObject = stream;
                await v.play();
            }

        } catch (e: any) {
            setShowCamera(false);
            let state: 'granted'|'denied'|'prompt'|'unknown' = 'unknown';
            try {
                state = await queryCameraPermission();
                setPermissionState(state);
            } catch {}
            if (state === 'denied') {
                setShowPermissionHelp(true);
                toast.error('Camera access is blocked. Enable it in your browser settings, then retry.');
            } else {
                setShowPermissionHelp(true);
                toast.error('Unable to access camera. Please grant permission when prompted.');
            }
        }
    };
    const stopCamera = () => {
        const s = cameraStreamRef.current;
        if (s) s.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
        const v = cameraVideoRef.current;
        if (v) v.srcObject = null;
        setShowCamera(false);
    };
    const capturePhoto = () => {
        const v = cameraVideoRef.current;
        if (!v) return;
        if (v.videoWidth === 0 || v.videoHeight === 0) { toast.error('Camera is not ready'); return; }
        const c = cameraCanvasRef.current || document.createElement('canvas');
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((blob) => {
            if (!blob) { toast.error('Capture failed'); return; }
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            setOverlayFile(file);
            setOverlayUrl(url);
            setAlignmentScore(null);
            setEvalError(null);
            stopCamera();
        }, 'image/jpeg', 0.92);
    };
    const handleOverlayFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setOverlayFile(file);
        setOverlayUrl(url);
        setAlignmentScore(null);
        setEvalError(null);
        e.target.value = '';
    };

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

    const drawContain = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) => {
        const cw = size, ch = size;
        ctx.clearRect(0, 0, cw, ch);
        const ratio = Math.min(cw / img.width, ch / img.height);
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const dx = (cw - nw) / 2;
        const dy = (ch - nh) / 2;
        ctx.drawImage(img, dx, dy, nw, nh);
    };



    const computeAlignment = async () => {
        if (!overlayFile) return;
        setComputing(true);
        setAlignmentScore(null);
        setEvalError(null);
        let seq = 0;
        try {
            if (segCtrlRef.current) segCtrlRef.current.abort();
            const ctrl = new AbortController();
            segCtrlRef.current = ctrl;
            seq = segSeqRef.current + 1;
            segSeqRef.current = seq;
            const endpoint = 'https://mlbench-inspectech-segmentation.hf.space/segment/mask';
            const fd = new FormData();
            fd.append('file', overlayFile, overlayFile.name);
            fd.append('model', 'birefnet');
            fd.append('threshold', '0.5');
            const resp = await fetch(endpoint, { method: 'POST', body: fd, signal: ctrl.signal });
            console.log(resp, resp.ok);
            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                setComputing(false);
                throw new Error(errText || 'segmentation_failed');
            }
            console.log("api done")
            const blob = await resp.blob();
            const maskUrl = URL.createObjectURL(blob);

            // Load the mask from API
            const maskImg = await loadImage(maskUrl);
            URL.revokeObjectURL(maskUrl);

            let refMaskImg: HTMLImageElement;
            try {
                console.log('using precomputed mask');
                console.log(activeTab)
                console.log(referenceMaskImages);
                console.log(referenceMaskImages[activeTab]);

                const preMaskUrl = referenceMaskImages[activeTab];
                if (!preMaskUrl) throw new Error('no_precomputed_mask');
                refMaskImg = await loadImage(preMaskUrl);
            } catch {
                const refImageResponse = await fetch(referenceImages[activeTab]);
                const refImageBlob = await refImageResponse.blob();
                const refFile = new File([refImageBlob], 'reference.jpg', { type: refImageBlob.type });

                const fdRef = new FormData();
                fdRef.append('file', refFile);
                fdRef.append('model', 'birefnet');
                fdRef.append('threshold', '0.5');

                const respRef = await fetch(endpoint, { method: 'POST', body: fdRef, signal: ctrl.signal });
                if (!respRef.ok) {
                    throw new Error('Failed to get reference mask');
                }

                const refMaskBlob = await respRef.blob();
                const refMaskUrl = URL.createObjectURL(refMaskBlob);
                refMaskImg = await loadImage(refMaskUrl);
                URL.revokeObjectURL(refMaskUrl);
            }

            // Now compare the two masks
            const size = 256;

            const cRef = document.createElement('canvas');
            cRef.width = size;
            cRef.height = size;
            const ctxRef = cRef.getContext('2d')!;
            drawContain(ctxRef, refMaskImg, size);
            const refData = ctxRef.getImageData(0, 0, size, size).data;

            const cMask = document.createElement('canvas');
            cMask.width = size;
            cMask.height = size;
            const ctxMask = cMask.getContext('2d')!;
            drawContain(ctxMask, maskImg, size);
            const usrData = ctxMask.getImageData(0, 0, size, size).data;

            let inter = 0, union = 0;
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const i = (y * size + x) * 4;
                    const brRef = 0.299 * refData[i] + 0.587 * refData[i + 1] + 0.114 * refData[i + 2];
                    const refMask = brRef > 128;
                    const brUsr = 0.299 * usrData[i] + 0.587 * usrData[i + 1] + 0.114 * usrData[i + 2];
                    const usrMask = brUsr > 128;

                    if (refMask || usrMask) union++;
                    if (refMask && usrMask) inter++;
                }
            }
            const iou = union > 0 ? inter / union : 0;
            if (seq === segSeqRef.current) setAlignmentScore(Math.round(iou * 100));
        } catch (e: any) {
            if (e?.name === 'AbortError') return;
            setAlignmentScore(null);
            setEvalError('Alignment scoring failed');
            toast.error('Alignment scoring failed');
        } finally {
            if (seq === segSeqRef.current) setComputing(false);
        }
    };

    const tabFieldMap: Record<TabType, string> = {
        'Front Left Side': 'frontLeftSideUrl',
        'Front Right Side': 'frontRightSideUrl',
        'Rare Left Side': 'rearLeftSideUrl',
        'Rare Right Side': 'rearRightSideUrl',
        'Inside Trailer Image': 'insideTrailerImageUrl',
        'Door Details Image': 'doorDetailsImageUrl',
    };

    const handleSendToUploadArea = async () => {
        if (!overlayFile) return;
        try {
            await onUploadToCloudinary(tabFieldMap[activeTab], overlayFile);
            toast.success('Sent to upload area');
        } catch {
            toast.error('Failed to send to upload area');
        }
    };

    useEffect(() => {
        if (overlayFile) {
            void computeAlignment();
        }
    }, [overlayFile, activeTab]);

    return (
        <div className="">
            <div className="">
                <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold mb-1">Image Quality Framing Guide</h1>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">STEP 1:</span> Use the framing guide to capture high-quality inspection images with proper alignment and visibility
                            </p>
                            {showGuide && (
                                <p className="text-sm text-gray-600 mt-2">
                                    The upload your tested images to the database using the section below
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowGuide(!showGuide)}
                            className="flex gap-2 items-center bg-blue-50 border border-blue-500 px-3 py-2 text-sm rounded-lg text-blue-500 whitespace-nowrap"
                        >
                            {showGuide ? (
                                <span className="flex items-center gap-1">
                                    Hide <ChevronUp size={18} />
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    Show <ChevronDown size={18} />
                                </span>
                            )}

                        </button>
                    </div>
                </div>

                {showGuide && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 h-[600px] overflow-auto">
                        <div className="bg-purple-600 text-white rounded-lg p-8 text-center mb-6">
                            <h2 className="text-2xl font-semibold mb-2">Image Alignment Guide</h2>
                            <p className="text-sm">Upload your image and align it with the reference template</p>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-4 mb-6">
                            <div className="grid sm:grid-cols-3 grid-cols-1 gap-2 overflow-x-auto pb-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        disabled={computing}
                                        onClick={() => { if (computing) return; setActiveTab(tab); setOverlayUrl(null); }}
                                        className={`px-6 2xl:px-14 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-200'
                                            } ${computing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold text-center mb-2">
                                {`Get Your ${activeTab}`}
                            </h3>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Choose to upload from files or take a photo directly
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-6">
                                <div className={`bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 flex items-center gap-2 cursor-pointer ${computing ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={() => { if (!computing) overlayInputRef.current?.click(); }}>
                                    <input type="file" accept=".jpg,.jpeg,.png" ref={overlayInputRef} onChange={handleOverlayFileSelect} className="hidden" />
                                    Upload Image
                                </div>
                                <button
                                    disabled={computing}
                                    onClick={startCamera}
                                    className={`bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 flex items-center gap-2 ${computing ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    Take a Photo
                                </button>
                            </div>
                            {showCamera && (
                                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg p-6" style={{ maxWidth: '95vw' }}>
                                        <div
                                            className="relative bg-black rounded-lg overflow-hidden"
                                            style={{
                                                width: cameraSize?.width || 600,
                                                height: cameraSize?.height || 400
                                            }}
                                        >
                                            <video ref={cameraVideoRef} className="absolute inset-0 w-full h-full object-cover" playsInline autoPlay muted />
                                            <img src={silhouetteImages[activeTab]} alt="Silhouette guide" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50" />
                                        </div>
                                        <canvas ref={cameraCanvasRef} className="hidden" />
                                        <div className="flex gap-3 mt-4 justify-center">
                                            <button onClick={capturePhoto} className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700">Capture</button>
                                            <button onClick={stopCamera} className="bg-gray-200 px-6 py-2.5 rounded-full font-medium hover:bg-gray-300">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {showPermissionHelp && (
                                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg p-6 max-w-md w-[90vw]">
                                        <h3 className="text-lg font-semibold mb-2">Enable Camera Access</h3>
                                        <p className="text-sm text-gray-700 mb-3">
                                            {permissionState === 'denied'
                                                ? 'Camera access is blocked for this site. Please enable it in your browser settings, then retry.'
                                                : 'Please grant camera permission in the prompt when it appears.'}
                                        </p>
                                        <div className="text-xs text-gray-500 space-y-1 mb-4">
                                            <p>Chrome: Click the lock icon → Site settings → Camera → Allow.</p>
                                            <p>Safari (Mac): Safari → Settings → Websites → Camera → Allow.</p>
                                            <p>iPhone/iPad: Settings → Safari → Camera → Allow.</p>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <button onClick={() => setShowPermissionHelp(false)} className="bg-gray-200 px-4 py-2 rounded-lg">Close</button>
                                            <button onClick={() => { setShowPermissionHelp(false); startCamera(); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg">Retry</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                                <h4 className="text-lg font-semibold text-purple-700 mb-2">
                                    Alignment Scoring
                                </h4>
                                <div className="bg-white rounded-lg p-6 border border-gray-200">
                                    {!overlayUrl ? (
                                        <>
                                            <p className="text-xl font-semibold mb-1">Ready</p>
                                            <p className="text-sm text-gray-600">Position your image to match the reference guide</p>
                                        </>
                                    ) : computing ? (
                                        <>
                                            <p className="text-xl font-semibold mb-1">Evaluating...</p>
                                            <p className="text-sm text-gray-600">Analyzing alignment with the guide</p>
                                        </>
                                    ) : alignmentScore !== null ? (
                                        alignmentScore < 70 ? (
                                            <>
                                                <p className="text-xl font-semibold mb-1 text-yellow-600 flex items-center justify-center gap-2">
                                                    <span>⚠️</span> Need Improvement
                                                </p>
                                                <p className="text-sm text-gray-600">Position your image to match the reference guide</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xl font-semibold mb-1 text-green-700">PASS</p>
                                                <p className="text-sm text-gray-600">Position your image to match the reference guide</p>
                                                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <p className="text-sm text-green-800 mb-3">Great alignment! Quality image ready!</p>
                                                    <button type="button" className="bg-purple-600 text-white px-5 py-2 rounded-full font-medium hover:bg-purple-700" onClick={handleSendToUploadArea}>
                                                        Send to Upload Area
                                                    </button>
                                                    <p className="text-xs text-gray-600 mt-2">Click "Send to Upload Area" to automatically transfer this image to your upload section</p>
                                                </div>
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <p className="text-xl font-semibold mb-1 text-red-600 flex items-center justify-center gap-2">
                                                <span>⛔</span> Evaluation Failed
                                            </p>
                                            <p className="text-sm text-gray-600">We couldn’t score the alignment. Check your connection and try again.</p>
                                            <div className="mt-4">
                                                <button type="button" className="bg-purple-600 text-white px-5 py-2 rounded-full font-medium hover:bg-purple-700" onClick={computeAlignment}>
                                                    Retry Evaluation
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-purple-600 text-white p-4 text-center">
                                    <h3 className="font-semibold">Your Image+ Reference Overlay</h3>
                                </div>
                                <div className="p-6">

                                    <div ref={previewRef} className={`relative border border-gray-200 rounded-lg h-[400px] flex items-center justify-center ${overlayUrl ? 'bg-black' : 'bg-white'}`}>
                                        {overlayUrl ? (
                                            <>
                                                <img src={overlayUrl} alt="Uploaded" className="max-w-full h-full object-contain" />
                                                {alignmentScore !== null && (
                                                    <img src={silhouetteImages[activeTab]} alt="Silhouette" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ opacity: 0.6 }} />
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center text-sm text-gray-500">
                                                <p className="mb-1">Upload an image to preview overlay</p>
                                                <p className="text-xs">Supported formats - JPG, PNG. Max size 5MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-4">
                                        {overlayUrl && (
                                            <button type="button" className="text-xs text-purple-500 hover:text-purple-700" onClick={() => { setOverlayUrl(null); setAlignmentScore(null); }}>
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-purple-600 text-white p-4 text-center">
                                    <h3 className="font-semibold">Ideal Reference Template</h3>
                                </div>

                                <div className="p-6">
                                    <div className="relative border border-gray-200 rounded-lg h-[400px] bg-black flex items-center justify-center">
                                        <img
                                            src={referenceImages[activeTab]}
                                            alt="Reference template"
                                            className="max-w-full h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

const Media: React.FC<{ formData: InspectionFormData; setFormData: React.Dispatch<React.SetStateAction<InspectionFormData>>; onUploadToCloudinary: (field: string, file: File) => Promise<void>; }> = ({ formData, setFormData, onUploadToCloudinary }) => {
    const [showAdditional, setShowAdditional] = useState(false);

    const openSlideshow = (startTitle?: string) => {
        const slides = [
            { title: 'Front Left Side', url: formData.frontLeftSideUrl },
            { title: 'Front Right Side', url: formData.frontRightSideUrl },
            { title: 'Rear Left Side', url: formData.rearLeftSideUrl },
            { title: 'Rear Right Side', url: formData.rearRightSideUrl },
            { title: 'Inside Trailer Image', url: formData.insideTrailerImageUrl },
            { title: 'Door Details Image', url: formData.doorDetailsImageUrl },
            { title: 'DOT Form Image', url: formData.dotFormImageUrl },
            { title: 'Additional Attachment 1', url: formData.additionalAttachment1 },
            { title: 'Additional Attachment 2', url: formData.additionalAttachment2 },
            { title: 'Additional Attachment 3', url: formData.additionalAttachment3 },
        ].filter(s => !!s.url);
        if (slides.length === 0) return;
        const startIndex = startTitle ? slides.findIndex(s => s.title === startTitle) : 0;
        try {
            localStorage.setItem('inspections_slideshow', JSON.stringify(slides));
            localStorage.setItem('inspections_slideshow_start', String(Math.max(0, startIndex)));
        } catch { }
        window.open('/slide_show', '_blank');
    };

    const handleUpload = (file: File) => {
        setFormData((prev: any) => ({
            ...prev,
            additionalAttachments: [...(prev.additionalAttachments || []), file.name],
        }));
    };

    return (
        <div className="bg-white sm:p-4">
            <div className="border-b pb-2">
                <div className="">
                    <ImageAlignmentGuide onUploadToCloudinary={onUploadToCloudinary} />
                </div>

                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">1. Front of Trailer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UploadCard
                            title="Front Left Side"
                            description="Upload an image showing the front left of the trailer"
                            currentUrl={formData.frontLeftSideUrl}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('frontLeftSideUrl', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, frontLeftSideUrl: '' }))}
                            onZoom={() => openSlideshow('Front Left Side')}
                            uploadAreaId="frontLeftSideUrl"
                        />
                        <UploadCard
                            title="Front Right Side"
                            description="Upload an image showing the front right of the trailer"
                            currentUrl={formData.frontRightSideUrl}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('frontRightSideUrl', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, frontRightSideUrl: '' }))}
                            onZoom={() => openSlideshow('Front Right Side')}
                            uploadAreaId="frontRightSideUrl"
                        />
                    </div>
                </div>

                <div className='mb-5'>
                    <h2 className="text-lg font-semibold mb-4">2. Rear of Trailer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UploadCard
                            title="Rear Left Side"
                            description="Upload an image showing the rear left of the trailer"
                            currentUrl={formData.rearLeftSideUrl}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('rearLeftSideUrl', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, rearLeftSideUrl: '' }))}
                            onZoom={() => openSlideshow('Rear Left Side')}
                            uploadAreaId="rearLeftSideUrl"
                        />
                        <UploadCard
                            title="Rear Right Side"
                            description="Upload an image showing the rear right of the trailer"
                            currentUrl={formData.rearRightSideUrl}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('rearRightSideUrl', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, rearRightSideUrl: '' }))}
                            onZoom={() => openSlideshow('Rear Right Side')}
                            uploadAreaId="rearRightSideUrl"
                        />
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-5'>
                    <div>
                        <h2 className="text-lg font-semibold mb-4">3. Inside Trailer</h2>
                        <div className="">
                            <UploadCard
                                title="Inside Traier Image"
                                description="Upload an image showing the inside of the trailer"
                                currentUrl={formData.insideTrailerImageUrl}
                                onUploadToCloudinary={(file) => onUploadToCloudinary('insideTrailerImageUrl', file)}
                                onRemove={() => setFormData(prev => ({ ...prev, insideTrailerImageUrl: '' }))}
                                onZoom={() => openSlideshow('Inside Trailer Image')}
                                uploadAreaId="insideTrailerImageUrl"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-4">4. Door Details</h2>
                        <div className="">
                            <UploadCard
                                title="Door Details Image"
                                description="Upload an image showing the door details of the trailer"
                                currentUrl={formData.doorDetailsImageUrl}
                                onUploadToCloudinary={(file) => onUploadToCloudinary('doorDetailsImageUrl', file)}
                                onRemove={() => setFormData(prev => ({ ...prev, doorDetailsImageUrl: '' }))}
                                onZoom={() => openSlideshow('Door Details Image')}
                                uploadAreaId="doorDetailsImageUrl"
                            />
                        </div>
                    </div>
                </div>

                <div className='mb-5'>
                    <div className='mb-4'>
                        <h2 className="text-lg font-semibold">5. DOT/Safety Inspection Form</h2>
                        <p className='text-xs font-semibold text-[#11182780]'>Upload either an image OR a PDF of the DOT form (only one is required)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch h-full">
                        <UploadCard
                            title="DOT Form Image"
                            description="Upload an image showing the dot form of the trailer"
                            currentUrl={formData.dotFormImageUrl}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('dotFormImageUrl', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, dotFormImageUrl: '' }))}
                            onZoom={() => openSlideshow('DOT Form Image')}
                            uploadAreaId="dotFormImageUrl"
                        />
                        <PDFUpload
                            onUploadToCloudinary={(file) => onUploadToCloudinary('dotFormPdfUrl', file)}
                            currentUrl={formData.dotFormPdfUrl}
                            currentFileName={formData.dotFormPdfFileName}
                        />
                    </div>
                </div>
            </div>
            <div className='mt-5'>
                <div className='flex flex-col sm:flex-row justify-between gap-2'>
                    <div>
                        <h2 className="text-lg font-semibold">Additional DOT Form Attachments</h2>
                        <p className='text-xs font-semibold text-[#11182780]'>Upload additional images related to the DOT Safety Inspection form</p>
                    </div>
                    <button
                        onClick={() => setShowAdditional(!showAdditional)}
                        className="flex gap-2 items-center bg-[#F3EBFF66] border  px-3 py-2 text-sm rounded-lg whitespace-nowrap"
                    >
                        {showAdditional ? (
                            <span className="flex items-center gap-1">
                                Hide <ChevronUp size={18} />
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                Add Additional Attachments <ChevronDown size={18} />
                            </span>
                        )}
                    </button>
                </div>
                {showAdditional && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4">
                        <UploadCard
                            title="Additional Attachment 1"
                            description="Upload an image showing the additionalform1 of the trailer"
                            currentUrl={formData.additionalAttachment1}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('additionalAttachment1', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, additionalAttachment1: '' }))}
                            onZoom={() => openSlideshow('Additional Attachment 1')}
                            uploadAreaId="additionalAttachment1"
                        />
                        <UploadCard
                            title="Additional Attachment 2"
                            description="Upload an image showing the additionalform2 of the trailer"
                            currentUrl={formData.additionalAttachment2}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('additionalAttachment2', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, additionalAttachment2: '' }))}
                            onZoom={() => openSlideshow('Additional Attachment 2')}
                            uploadAreaId="additionalAttachment2"
                        />
                        <UploadCard
                            title="Additional Attachment 3"
                            description="Upload an image showing the additionalform3 of the trailer"
                            currentUrl={formData.additionalAttachment3}
                            onUploadToCloudinary={(file) => onUploadToCloudinary('additionalAttachment3', file)}
                            onRemove={() => setFormData(prev => ({ ...prev, additionalAttachment3: '' }))}
                            onZoom={() => openSlideshow('Additional Attachment 3')}
                            uploadAreaId="additionalAttachment3"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Media;
