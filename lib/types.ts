export type Member = {
  id: string;
  household_id: string;
  sl_no: number;
  name: string;
  age: number | null;
  relation: string | null;
  education: string | null;
  technical_qualification: string | null;
  occupation: string | null;
  blood_group: string | null;
  phone: string | null;
};

export type Household = {
  id: string;
  serial_no: number;
  submitted_at: string;
  head_name: string;
  house_name: string;
  head_age: number;
  phone: string;
  house_type: 'sheet' | 'ode' | 'warp';
  has_chronic_illness: boolean;
  chronic_details: string | null;
  receives_aid: boolean;
  aid_details: string | null;
  photo_path: string;
  updated_at: string | null;
  members?: Member[] | { count: number }[];
};
