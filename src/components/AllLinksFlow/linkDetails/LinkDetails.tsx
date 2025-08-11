'use client'
import React from 'react';
import GeneratedLink from './GeneratedLink';
import ScannedDocuments from './ScannedDocuments';
import { DocumentInfo, GeneratedLinkInfo } from './types';
import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface DocumentViewerProps {
    sessionId: string;
}

const LinkDetails: React.FC<DocumentViewerProps> = ({ sessionId, }) => {
    const [loading, setLoading] = React.useState(false);
    const fetchData = async (payload: any) => {
        try {
          setLoading(true)
          const response = await fetch("/api/allLinksFlow/get_links_details", {
            method: "POST",
            headers: {
              "Session": sessionId,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
    
          const result = await response.json();
    
          if (!response.ok || result.data.status === false) {
            throw new Error(result.data.message);
          }
    
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          toast.error(errorMessage);
          console.log("error", err);
        } finally {
          setLoading(false)
        }
      };
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
            <div className="flex items-center mb-5 border-b border-gray-200  pb-4">
                {/* Back Button alongside Title */}
                <button
                    // onClick={handleBack}
                    className="text-gray-800  mr-3 text-xl" // Same color as title
                >
                    <FaArrowLeft className="w-4 h-4" /> {/* Arrow Icon */}
                </button>
                <h2 className="text-2xl font-weight-600 text-gray-800 ">
                    Link Details
                </h2>
            </div>
            <div className=" items-center mb-5  pb-4">
                {/* <GeneratedLink linkInfo={linkInfo} />
                <ScannedDocuments documentInfo={documentInfo} /> */}
            </div>
        </div>
    );
};

export default LinkDetails;