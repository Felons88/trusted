-- Add issue_date column to invoices table
ALTER TABLE invoices 
ADD COLUMN issue_date DATE DEFAULT CURRENT_DATE;

-- Add comment to describe the column
COMMENT ON COLUMN invoices.issue_date IS 'Date when the invoice was issued';
