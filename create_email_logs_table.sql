-- Create email logs table for tracking all customer communications
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Email details
  template_key text NOT NULL,
  template_name text,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  status text DEFAULT 'sent', -- sent, failed, pending, bounced
  error_message text,
  
  -- Related entities (remove foreign key constraints for now)
  client_id uuid,
  booking_id uuid,
  quote_request_id uuid,
  invoice_id uuid,
  payment_attempt_id uuid,
  
  -- Email content
  html_content text,
  text_content text,
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Delivery tracking
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  bounce_reason text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Admin tracking
  created_by uuid,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_client_id ON public.email_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_key ON public.email_logs(template_key);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON public.email_logs(recipient_email);

-- Create index for customer portal queries
CREATE INDEX IF NOT EXISTS idx_email_logs_client_portal ON public.email_logs(client_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Policies for email logs (simplified)
CREATE POLICY "Allow admins to view all email logs" ON public.email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update email logs" ON public.email_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to view their own email logs
CREATE POLICY "Allow users to view their own email logs" ON public.email_logs
  FOR SELECT USING (
    recipient_email = (
      SELECT email FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.email_logs TO authenticated;
GRANT INSERT ON public.email_logs TO authenticated;
GRANT UPDATE ON public.email_logs TO authenticated;

-- Add comments
COMMENT ON TABLE public.email_logs IS 'Logs all emails sent to customers for tracking and analytics';
COMMENT ON COLUMN public.email_logs.template_key IS 'Template key used for the email';
COMMENT ON COLUMN public.email_logs.status IS 'Email delivery status: sent, failed, pending, bounced';
COMMENT ON COLUMN public.email_logs.metadata IS 'Additional metadata like email service response';
