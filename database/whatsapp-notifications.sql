CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  booking_id text PRIMARY KEY REFERENCES bookings(id),
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','accepted','failed','uncertain','cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  message_id text,
  error text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON whatsapp_notifications FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON whatsapp_notifications TO duujato_app;
CREATE INDEX IF NOT EXISTS idx_whatsapp_created ON whatsapp_notifications(created_at);
DROP POLICY IF EXISTS whatsapp_server_access ON whatsapp_notifications;
CREATE POLICY whatsapp_server_access ON whatsapp_notifications TO duujato_app USING (true) WITH CHECK (true);
