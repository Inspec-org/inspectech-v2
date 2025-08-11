import React from 'react';
import { DocumentInfo } from './types';

interface ScannedDocumentsProps {
  documentInfo: DocumentInfo;
}

const ScannedDocuments: React.FC<ScannedDocumentsProps> = ({ documentInfo }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Scanned Documents</h2>
      
      <div className="border border-gray-200 rounded-xl p-6 ">
        <div className='max-w-2xl '>
        <h3 className="text-xl font-semibold mb-6">
          Host Name: <span className='text-lg font-medium'>{documentInfo.hostName}</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-y-4 ">
          <div className="text-sm">
            <span className=" font-medium">DOB: </span>
            <span className="text-gray-700">{documentInfo.dob}</span>
          </div>
          
          <div className="text-sm">
            <span className=" font-medium">Gender: </span>
            <span className="text-gray-700">{documentInfo.gender}</span>
          </div>
          
          <div className="text-sm">
            <span className=" font-medium">Document no: </span>
            <span className="text-gray-700">{documentInfo.documentNo}</span>
          </div>
          
          <div className="text-sm">
            <span className=" font-medium">Document Type: </span>
            <span className="text-gray-700">{documentInfo.documentType}</span>
          </div>
          
          <div className="text-sm">
            <span className=" font-medium">Issuing Country: </span>
            <span className="text-gray-700">{documentInfo.issuingCountry}</span>
          </div>
          
          <div className="text-sm">
            <span className=" font-medium">Room no: </span>
            <span className="text-gray-700">{documentInfo.roomNo}</span>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ScannedDocuments;
