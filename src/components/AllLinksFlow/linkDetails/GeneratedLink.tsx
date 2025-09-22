import React from 'react';
import { GeneratedLinkInfo } from './types';

interface GeneratedLinkProps {
  linkInfo: GeneratedLinkInfo | null;
}


const GeneratedLink: React.FC<GeneratedLinkProps> = ({ linkInfo }) => {
  return (
    <div className=" border border-gray-200 rounded-xl p-6 mb-8">
      <h2 className="text-xl font-semibold  mb-4">Generated Link</h2>
      
      <div className="mb-6 border-b border-gray-200 pb-4">
        <a 
          href={linkInfo?.link}
          className="text-[#4958E9] hover:text-blue-800 underline break-all text-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkInfo?.link}
        </a>
      </div>

      <div className="grid grid-cols-3 max-w-2xl">
        <div>
          <div className="font-medium mb-1 text-sm">Generated on</div>
          <div className="text-gray-600 text-sm">{linkInfo?.created_at.slice(0, 10)}</div>
        </div>
        
        <div>
          <div className="font-medium mb-1 text-sm">Check-in Date</div>
          <div className="text-gray-600 text-sm">{linkInfo?.check_in}</div>
        </div>
        
        <div>
          <div className="font-medium mb-1 text-sm">Check-out Date</div>
          <div className="text-gray-600 text-sm">{linkInfo?.check_out}</div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedLink;
