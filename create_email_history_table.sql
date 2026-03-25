-- Create email history table for tracking all customer communications
CREATE TABLE IF NOT EXISTS public.email_history (
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
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON public.email_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_history_client_id ON public.email_history(client_id);
CREATE INDEX IF NOT EXISTS idx_email_history_template_key ON public.email_history(template_key);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON public.email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_booking_id ON public.email_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_email_history_recipient_email ON public.email_history(recipient_email);

-- Create index for customer portal queries
CREATE INDEX IF NOT EXISTS idx_email_history_client_portal ON public.email_history(client_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.email_history ENABLE ROW LEVEL SECURITY;

-- Policies for email history (simplified)
CREATE POLICY "Allow admins to view all email history" ON public.email_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to insert email history" ON public.email_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update email history" ON public.email_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to view their own email history
CREATE POLICY "Allow users to view their own email history" ON public.email_history
  FOR SELECT USING (
    recipient_email = (
      SELECT email FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.email_history TO authenticated;
GRANT INSERT ON public.email_history TO authenticated;
GRANT UPDATE ON public.email_history TO authenticated;

-- Add comments
COMMENT ON TABLE public.email_history IS 'Logs all emails sent to customers for tracking and analytics';
COMMENT ON COLUMN public.email_history.template_key IS 'Template key used for the email';
COMMENT ON COLUMN public.email_history.status IS 'Email delivery status: sent, failed, pending, bounced';
COMMENT ON COLUMN public.email_history.metadata IS 'Additional metadata like email service response';
