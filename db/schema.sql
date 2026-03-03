CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  nama_ktp TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nik TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  institution TEXT NOT NULL,
  kota_asal TEXT NOT NULL DEFAULT '',
  profession TEXT NOT NULL,
  tour_ikn BOOLEAN NOT NULL DEFAULT FALSE,
  additional_info TEXT NOT NULL DEFAULT '',
  registration_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  attendance_status TEXT NOT NULL DEFAULT 'pending',
  attendance_type TEXT NOT NULL DEFAULT 'online',
  payment_link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  registration_code TEXT NOT NULL UNIQUE,
  payer_name TEXT NOT NULL,
  payer_email TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'manual_transfer',
  status TEXT NOT NULL DEFAULT 'success',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_code ON registrations(registration_code);
CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at DESC);
