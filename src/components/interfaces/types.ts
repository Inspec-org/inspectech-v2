export type User = {
  id: string;
  profile_image_url: string;
  full_name: string;
  email: string;
  phone: number;
};

export type Room = {
    name: string;
    external_id: number;
    added_on: string;
};


export type Guest = {
    id: string;
    guest_add_type: string;
    tck_number: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    sex: string;
    document_type: string;
    document_number: string;
    room_no: number;
    property: string;
};