export type RegistrationStatus = "pending_payment" | "paid";

export type Registration = {
  id: number;
  nama_ktp: string;
  full_name: string;
  nik: string;
  email: string;
  phone: string;
  institution: string;
  kota_asal: string;
  profession: string;
  tour_ikn: boolean;
  additional_info: string;
  registration_code: string;
  status: RegistrationStatus;
  payment_link: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: number;
  registration_id: number;
  registration_code: string;
  payer_name: string;
  payer_email: string;
  amount: string;
  payment_method: string;
  status: "success";
  paid_at: string;
  created_at: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};
