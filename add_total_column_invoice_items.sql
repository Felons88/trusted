-- Add total column to invoice_items table
ALTER TABLE invoice_items 
ADD COLUMN total DECIMAL(10, 2) DEFAULT 0.00;

-- Add comment to describe the column
COMMENT ON COLUMN invoice_items.total IS 'Total price for this line item (quantity * unit_price)';
