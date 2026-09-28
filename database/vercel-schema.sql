-- Duu Jato: banco separado no Supabase, usado exclusivamente pelo servidor Vercel.
CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '',
  duration integer NOT NULL, price_cents integer, active integer NOT NULL DEFAULT 1, sort integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY, service_id text NOT NULL, service_name text NOT NULL, duration integer NOT NULL,
  date text NOT NULL, time text NOT NULL, customer text NOT NULL, phone text NOT NULL,
  vehicle text NOT NULL, plate text NOT NULL, status text NOT NULL DEFAULT 'pending',
  created_at text NOT NULL, manage_token_hash text UNIQUE
);
CREATE TABLE IF NOT EXISTS occupied_slots (
  date text NOT NULL, time text NOT NULL, booking_id text NOT NULL, bay integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_occupied_date_time_bay ON occupied_slots(date,time,bay);
CREATE TABLE IF NOT EXISTS business_settings (
  id integer PRIMARY KEY, name text NOT NULL DEFAULT 'Duu Jato', phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '', notice text NOT NULL DEFAULT '', capacity integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS weekly_hours (
  weekday integer PRIMARY KEY, enabled integer NOT NULL, opening text NOT NULL, closing text NOT NULL,
  break_start text, break_end text
);
CREATE TABLE IF NOT EXISTS closed_dates (date text PRIMARY KEY, reason text NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS admin_accounts (email text PRIMARY KEY, created_at text NOT NULL);
CREATE TABLE IF NOT EXISTS cash_entries (
  id text PRIMARY KEY, type text NOT NULL, date text NOT NULL, category text NOT NULL,
  description text NOT NULL, amount_cents integer NOT NULL, payment_method text NOT NULL,
  created_at text NOT NULL, booking_id text, voided_at text
);
CREATE INDEX IF NOT EXISTS idx_cash_entries_date ON cash_entries(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cash_booking_active ON cash_entries(booking_id) WHERE booking_id IS NOT NULL AND voided_at IS NULL;
-- O browser não acessa tabelas pelo Data API; acesso passa pelas rotas com controle no servidor.
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupied_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON services,bookings,occupied_slots,business_settings,weekly_hours,closed_dates,admin_accounts,cash_entries FROM anon,authenticated;
