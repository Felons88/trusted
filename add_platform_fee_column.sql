-- Add platform_fee column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to describe the column
COMMENT ON COLUMN bookings.platform_fee IS '4% platform fee charged on bookings';

-- Add platform_fee column to invoices table (needed for NewInvoice form)
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS platform_fee numeric(10,2) DEFAULT 0.00;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.platform_fee IS 'Platform processing fee for the invoice';

-- Add index for better performance if needed
CREATE INDEX IF NOT EXISTS idx_invoices_platform_fee ON public.invoices(platform_fee);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'invoices' AND column_name = 'platform_fee';
