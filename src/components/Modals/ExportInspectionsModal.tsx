// /Users/mlb/Desktop/InspecTech/src/components/Modals/ExportInspectionsModal.tsx
import React from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { Modal } from '../ui/modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  selectedExportType: string;
  onSelectedExportTypeChange: (val: string) => void;
};

const ExportInspectionsModal: React.FC<Props> = ({ isOpen, onClose, selectedExportType, onSelectedExportTypeChange }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[500px] p-4 ">
      <div>
        <div className="flex gap-2 items-center mb-2 border-b border-gray-200 pb-4">
          <Download className="w-6 h-6" />
          <h2 className="text-lg font-semibold">Export Data</h2>
        </div>
        <p className="text-gray-600 mb-6 text-sm">Select a pormat to export 40 inspection records</p>

        <div>
          <div className="flex gap-2 items-start mb-5 border rounded-xl p-4">
            <div>
              <input type="radio" name="format" value="csv" checked={selectedExportType === 'csv'} onChange={(e) => onSelectedExportTypeChange(e.target.value)} className="circle-checkbox" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex flex-col">
                <span>CSV File</span>
                <span className="text-gray-400 text-xs">Export as comma-separated values file</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 items-start mb-5 border rounded-xl p-4">
            <div>
              <input type="radio" name="format" value="json" checked={selectedExportType === 'json'} onChange={(e) => onSelectedExportTypeChange(e.target.value)} className="circle-checkbox" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex flex-col">
                <span>JSON Data</span>
                <span className="text-gray-400 text-xs">Export as JavaScript Object Notation</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 items-start mb-5 border rounded-xl p-4">
            <div>
              <input type="radio" name="format" value="excel" checked={selectedExportType === 'excel'} onChange={(e) => onSelectedExportTypeChange(e.target.value)} className="circle-checkbox" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex flex-col">
                <span>EXCEL File</span>
                <span className="text-gray-400 text-xs">Export in Microsoft Excel format</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="border border-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition">
            Cancel
          </button>
          <button onClick={onClose} className="bg-[#7844AB] text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition flex gap-2 items-center">
            <ArrowRight className="w-4 h-4" />
            Export As {selectedExportType.toUpperCase()}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportInspectionsModal;