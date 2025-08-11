export interface DocumentInfo {
  hostName: string;
  dob: string;
  gender: string;
  documentNo: string;
  documentType: string;
  issuingCountry: string;
  roomNo: string;
}

export interface GeneratedLinkInfo {
  url: string;
  generatedOn: string;
  checkInDate: string;
  checkOutDate: string;
}