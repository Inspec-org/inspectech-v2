import React, { useState } from 'react';
import { Upload, Check, Image, ImageIcon, LucideImage, ChevronUp, ChevronDown, Camera, CloudUpload } from 'lucide-react';
import { FormData } from './BatchEdit';
interface UploadCardProps {
    title: string;
    description: string;
    onUpload: (file: File) => void;
}
type TabType = 'Front Left Side' | 'Front Right Side' | 'Rare Left Side' | 'Rare Right Side' | 'Inside Trailer Image' | 'Door Details Image';

const UploadCard: React.FC<UploadCardProps> = ({ title, description, onUpload }) => {
    const [isUploaded, setIsUploaded] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile);
            setIsUploaded(true);
        }
    };

    return (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <div className="mb-4">
                <h3 className="font-semibold text-base mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{description}</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4 flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-16 h-16 mb-3 flex items-center justify-center">
                    <LucideImage className='opacity-40' size={56} />
                </div>
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">Supported formats: JPG, PNG</p>
                <p className="text-xs text-gray-500">Maximum file size: 5MB</p>
            </div>

            <label className="block w-full mb-3">
                <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <div className="border border-gray-300 rounded-lg py-2 px-4 text-center cursor-pointer hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Upload size={16} />
                    <span className="text-sm font-medium">Select Image</span>
                </div>
            </label>

            <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="w-full bg-purple-600 text-white rounded-lg py-2 px-4 font-medium hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <CloudUpload size={16} />
                Upload to Database
            </button>

            {isUploaded && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                        <Check size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-green-800">Upload Successful</p>
                        <p className="text-sm text-green-700">Inside Trailer image successfully saved to the database</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const PDFUpload = () => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setUploadedFile(file);
        } else {
            alert('Please select a PDF file');
        }
    };

    const handleReload = () => {
        setUploadedFile(null);
    };

    return (
        <div className="">
            <div className="border border-gray-300 rounded-lg p-4 bg-white h-full">
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
                    />
                    <div className="bg-purple-600 text-white rounded-lg py-2.5 px-6 font-medium hover:bg-purple-700 cursor-pointer inline-flex items-center gap-2">
                        <Upload size={18} />
                        Upload PDF
                    </div>
                </label>

                <div className="border-t border-gray-300 pt-6">
                    {/* <button
                        onClick={handleReload}
                        className="flex items-center gap-2 text-gray-700 font-medium mb-4 hover:text-gray-900"
                    >
                        <RefreshCw size={18} />
                        Reload PDF
                    </button> */}

                    {uploadedFile ? (
                        <div className="text-sm text-gray-700">
                            <p className="font-medium mb-1">Uploaded: {uploadedFile.name}</p>
                            <p className="text-gray-500">Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">No PDF Uploaded yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ImageAlignmentGuide: React.FC = () => {
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
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="bg-purple-600 text-white rounded-lg p-8 text-center mb-6">
                            <h2 className="text-2xl font-semibold mb-2">Image Alignment Guide</h2>
                            <p className="text-sm">Upload your image and align it with the reference template</p>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-4 mb-6">
                            <div className="flex justify-between gap-2 overflow-x-auto pb-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 2xl:px-14 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold text-center mb-2">
                                Get Your Front Left Trailer Image
                            </h3>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Choose to upload from files or take a photo directly
                            </p>

                            <div className="flex justify-center gap-3 mb-6">
                                <button className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 flex items-center gap-2">
                                    {/* <Upload size={18} /> */}
                                    Upload Image
                                </button>
                                <button className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-purple-700 flex items-center gap-2">
                                    {/* <Camera size={18} /> */}
                                    Take a Photo
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6 text-center">
                                <h4 className="text-lg font-semibold text-purple-700 mb-2">
                                    Alignment Scoring
                                </h4>
                                <div className="bg-white rounded-lg p-6 border border-gray-200">
                                    <p className="text-xl font-semibold mb-1">Ready</p>
                                    <p className="text-sm text-gray-600">
                                        Position your image to match the reference guide
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-purple-600 text-white p-4 text-center">
                                    <h3 className="font-semibold">Your Image+ Reference Overlay</h3>
                                </div>
                                <div className="p-6 min-h-[400px] flex flex-col items-center justify-center text-center">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Upload, drag & drop image or take photo to start
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Supported formats - JPG, PNG
                                    </p>
                                    <p className="text-xs text-gray-500">Maximum file size:5MB</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                                <div className="bg-purple-600 text-white p-4 text-center">
                                    <h3 className="font-semibold">Ideal Reference Template</h3>
                                </div>
                                <div className="p-6 min-h-[400px] bg-gray-50">
                                    {/* Reference template placeholder */}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Media: React.FC<{ formData: FormData; setFormData: React.Dispatch<React.SetStateAction<FormData>> }> = ({ formData, setFormData }) => {
    const [showAdditional, setShowAdditional] = useState(false);

    const handleUpload = (file: File) => {
        setFormData((prev: any) => ({
            ...prev,
            additionalAttachments: [ ...(prev.additionalAttachments || []), file.name ],
        }));
    };

    return (
        <div className="bg-white p-4">
            <div className="border-b pb-2">
                <div className="">
                    <ImageAlignmentGuide />
                </div>

                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">1. Front of Trailer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UploadCard
                            title="Front Left Side"
                            description="Upload an image showing the front left of the trailer"
                            onUpload={handleUpload}
                        />
                        <UploadCard
                            title="Front Right Side"
                            description="Upload an image showing the front right of the trailer"
                            onUpload={handleUpload}
                        />
                    </div>
                </div>

                <div className='mb-5'>
                    <h2 className="text-lg font-semibold mb-4">2. Rear of Trailer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UploadCard
                            title="Rear Left Side"
                            description="Upload an image showing the rear left of the trailer"
                            onUpload={handleUpload}
                        />
                        <UploadCard
                            title="Rear Right Side"
                            description="Upload an image showing the rear right of the trailer"
                            onUpload={handleUpload}
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
                                onUpload={handleUpload}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-4">4. Door Details</h2>
                        <div className="">
                            <UploadCard
                                title="Door Details Image"
                                description="Upload an image showing the door details of the trailer"
                                onUpload={handleUpload}
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
                            onUpload={handleUpload}
                        />
                        <PDFUpload />
                    </div>
                </div>
            </div>
            <div className='mt-5'>
                <div className='flex justify-between gap-2'>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <UploadCard
                            title="Additional Attachment 1"
                            description="Upload an image showing the additionalform1 of the trailer"
                            onUpload={handleUpload}
                        />
                        <UploadCard
                            title="Additional Attachment 2"
                            description="Upload an image showing the additionalform2 of the trailer"
                            onUpload={handleUpload}
                        />
                        <UploadCard
                            title="Additional Attachment 3"
                            description="Upload an image showing the additionalform3 of the trailer"
                            onUpload={handleUpload}
                        />Additional Attachment 1
                    </div>
                )}
            </div>
        </div>
    );
};

export default Media;