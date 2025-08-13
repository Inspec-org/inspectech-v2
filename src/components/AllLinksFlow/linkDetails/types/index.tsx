export interface DocumentInfo {
  id: string;
  full_name: string;
  sex: string;
  document_number: string;
  document_type: string;
  issuing_country: string;
  date_of_birth: string;
}

export interface GeneratedLinkInfo {
  id: string;
  link: string;
  created_at: string;
  check_in: string;
  check_out: string;
}