'use client'
import React, { useContext, useEffect, useMemo, useState } from 'react';
import GeneratedLink from './GeneratedLink';
import ScannedDocuments from './ScannedDocuments';
import { DocumentInfo, GeneratedLinkInfo } from './types';
import { FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { UserContext } from "@/context/authContext";
import { buildRequestBody } from '@/utils/apiWrapper';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface DocumentViewerProps {
  sessionId: string;
}

const LinkDetails: React.FC<DocumentViewerProps> = ({ sessionId }) => {
  const router = useRouter();
  const pathname = usePathname()
  const searchParams = useSearchParams();
  const [linkInfo, setLinkInfo] = React.useState<GeneratedLinkInfo | null>(null);
  const [guestInfo, setGuestInfo] = React.useState<DocumentInfo[]>([]);
  const [totalGuests, setTotalGuests] = useState(0);
  const { user } = useContext(UserContext);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = useState("");
  const params = useParams();
  const link_id = params.link_id as string;
  const currentPage = parseInt(searchParams.get("guest_page") || "1", 10);
  const limit = 10
  const pageTabs = useMemo(() => {
    const totalPages = Math.ceil(totalGuests / limit);
    return Array.from({ length: totalPages }, (_, i) => (i + 1).toString());
  }, [totalGuests, limit]);

  useEffect(() => {
    if (search) {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("guest_page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [search]);

  // Fetch link data only once when user.email is available
useEffect(() => {
  if (user?.email) {
    const linkBuiltPayload = buildRequestBody({
      email: user.email,
      link_id: link_id
    });
    fetchLinkData(linkBuiltPayload);
  }
}, [user]); // only depends on user

// Fetch guest data whenever page or search changes
useEffect(() => {
  if (user?.email) {
    const timeout = setTimeout(() => {
      const guestBuiltPayload = buildRequestBody({
        email: user.email,
        link_id: link_id,
        page: currentPage,
        limit: limit,
        search_query: search // fixed typo
      });
      fetchGuestData(guestBuiltPayload);
    }, 500); // small debounce for search/page change

    return () => clearTimeout(timeout);
  }
}, [user, currentPage, search]); // runs when these change

  const fetchLinkData = async (payload: any) => {
    try {
      const response = await fetch("/api/allLinksFlow/get_link_details", {
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
      console.log(result.data.data)
      setLinkInfo(result.data.data.link_info);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
      console.log("error", err);
    }
  };
  const fetchGuestData = async (payload: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/allLinksFlow/get_link_guest_details", {
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
      console.log(result.data.data)
      setGuestInfo(result.data.data.guests);
      setTotalGuests(result.data.data.total_guests);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      toast.error(errorMessage);
      console.log("error", err);
    } finally {
      setLoading(false)
    }
  };

  const handleBack = () => {
    const link_page = searchParams.get("link_page") || "1";
    router.push(`/allLinks/?link_page=${link_page}`);
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 lg:p-6">
      <div className="flex items-center mb-5 border-b border-gray-200  pb-4">
        {/* Back Button alongside Title */}
        <button
          onClick={handleBack}
          className="text-gray-800  mr-3 text-xl" // Same color as title
        >
          <FaArrowLeft className="w-4 h-4" /> {/* Arrow Icon */}
        </button>
        <h2 className="text-2xl font-weight-600 text-gray-800 ">
          Link Details
        </h2>
      </div>
      <div className=" items-center mb-5  pb-4">
        <GeneratedLink linkInfo={linkInfo} />
        <ScannedDocuments documentInfo={guestInfo} pageTabs={pageTabs} limit={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} search={search} setSearch={setSearch} />
      </div>
    </div>
  );
};

export default LinkDetails;