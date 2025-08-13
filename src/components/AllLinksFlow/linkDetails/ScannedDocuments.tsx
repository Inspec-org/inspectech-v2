import React, { useState } from 'react';
import { DocumentInfo } from './types';
import GenericDataTable, { Column } from '@/components/tables/GenericDataTable';

interface ScannedDocumentsProps {
  documentInfo: DocumentInfo[];
  pageTabs: string[]
  limit: number,
  currentPage: number,
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  search: string,
  setSearch: React.Dispatch<React.SetStateAction<string>>
}


const ScannedDocuments: React.FC<ScannedDocumentsProps> = ({ documentInfo, pageTabs, limit, currentPage, loading, setLoading, search, setSearch }) => {
  const columns: Column<DocumentInfo>[] = [
      {
        header: <div className="text-center">Guest Name</div>,
        accessor: "emailAddress",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.full_name}</div>
        ),
      },
      {
        header: <div className="text-center">DOB</div>,
        accessor: "PhoneNumber",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.date_of_birth}</div>
        ),
      },
      {
        header: <div className="text-center">Gender</div>,
        accessor: "PhoneNumber",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.sex}</div>
        ),
      },
      {
        header: <div className="text-center">Document Number</div>,
        accessor: "AddedRooms",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.document_number}</div>
        ),
      },
      {
        header: <div className="text-center">Document Type</div>,
        accessor: "AddedRooms",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.document_type}</div>
        ),
      },
      {
        header: <div className="text-center">Issuuing Country</div>,
        accessor: "AddedGuests",
        cell: (row) => (
          <div className="text-center text-[var(--secondary)]">{row?.issuing_country}</div>
        ),
      },
    ];
  return (
    <div className="p-6">
      <GenericDataTable title='All Guests' data={documentInfo} tabs={pageTabs} columns={columns} pageSize={limit} currentPage={currentPage} loading={loading} setLoading={setLoading} querykey="guest_page" search={search} setSearch={setSearch} emptyStateImages={{
        "All Users": "/images/No Users.svg"
      }}
      />
    </div>
  );
};

export default ScannedDocuments;
