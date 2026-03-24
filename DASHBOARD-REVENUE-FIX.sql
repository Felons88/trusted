-- QUICK FIX: DASHBOARD REVENUE & PAYMENTS FROM INVOICES
-- This script makes dashboard show real revenue and payments tab show invoice payments

-- 1. Update Dashboard to show real revenue from paid invoices
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
    total_bookings BIGINT,
    pending_bookings BIGINT,
    completed_bookings BIGINT,
    total_revenue DECIMAL,
    pending_revenue DECIMAL,
    total_clients BIGINT,
    new_quotes BIGINT,
    total_vehicles BIGINT,
    active_services BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(COUNT(*), 0) as total_bookings,
        COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0) as pending_bookings,
        COALESCE(COUNT(*) FILTER (WHERE status = 'completed' OR status = 'confirmed'), 0) as completed_bookings,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE status != 'paid'), 0) as pending_revenue,
        COALESCE((SELECT COUNT(*) FROM public.clients), 0) as total_clients,
        COALESCE((SELECT COUNT(*) FROM public.quote_requests WHERE status = 'pending'), 0) as new_quotes,
        COALESCE((SELECT COUNT(*) FROM public.vehicles WHERE is_active = true), 0) as total_vehicles,
        COALESCE((SELECT COUNT(*) FROM public.services WHERE is_active = true), 0) as active_services
    FROM public.invoices;
END;
$$;

-- 2. Create a simple view for payments from invoices
CREATE OR REPLACE VIEW public.invoice_payments AS
SELECT 
    id as payment_id,
    invoice_number,
    client_id,
    total_amount as amount,
    'paid' as status,
    'stripe' as payment_method,
    created_at,
    updated_at,
    'invoice' as source_type
FROM public.invoices 
WHERE status = 'paid';

-- 3. Create a function to get payments for the Payments tab
CREATE OR REPLACE FUNCTION public.get_all_payments()
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    client_id UUID,
    client_name TEXT,
    amount DECIMAL,
    status TEXT,
    payment_method TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.invoice_number,
        i.client_id,
        COALESCE(c.full_name, 'Unknown Client') as client_name,
        i.total_amount as amount,
        i.status,
        'stripe' as payment_method,
        i.created_at,
        i.updated_at
    FROM public.invoices i
    LEFT JOIN public.clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC;
END;
$$;

-- 4. Update the Dashboard component's data loading
-- (This will be in the React component, not SQL)

SELECT 'Dashboard revenue and payments fix completed!' as result;
