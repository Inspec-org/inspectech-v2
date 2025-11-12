'use client'
import React, { useState } from 'react';
import { ArrowLeft, Users, Trash2, Save, Database, Info, CheckSquare, Image, Filter } from 'lucide-react';
import { CustomDropdown } from '../ui/dropdown/CustomDropdown';
import General from './General';
import CheckList from './CheckLIst';

export default function BatchEdit() {
    const [activeTab, setActiveTab] = useState('general');
   

    return (
        <div className="bg-white p-4">
            <div className="">
                {/* Header */}
                <button className='flex gap-2 items-center bg-[#F3EBFF66] px-2 py-2 text-sm rounded-xl'>
                    <ArrowLeft size={20} />
                    <span>Back to Inspection</span>
                </button>

                {/* Title and Action Buttons */}
                <div className="flex xl:flex-row flex-col items-start xl:items-center justify-between mb-6 mt-2">
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

                        <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap'>
                            <Save size={18} />
                            <span>Save Changes</span>
                        </button>

                        <button className='flex gap-2 items-center bg-[#F3EBFF66] border border-[#0075FF] px-2 py-2 text-sm rounded-xl text-[#0075FF] whitespace-nowrap'>
                            <Database size={18} />
                            <span>Process Inspection Data</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 ${activeTab === 'general'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Filter size={18} />
                        <span>General Information</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('checklist')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 ${activeTab === 'checklist'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <CheckSquare size={18} />
                        <span>Inspection Checklist</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('media')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 ${activeTab === 'media'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Image size={18} />
                        <span>Inspection Media Central</span>
                    </button>
                </div>

                {/* Form Content */}
                {activeTab === 'general' && (
                   <General />
                )}

                {activeTab === 'checklist' && (
                    <CheckList />
                )}

                {activeTab === 'media' && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-gray-600">Inspection Media Central content</p>
                    </div>
                )}
            </div>
        </div>
    );
}