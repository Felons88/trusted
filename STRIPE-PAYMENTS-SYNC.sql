-- STRIPE PAYMENTS SYNC FUNCTION
-- This script creates functions to sync Stripe payments with your local database

-- Function to create a payment record from invoice payment
CREATE OR REPLACE FUNCTION public.create_payment_from_invoice(
    p_invoice_id UUID,
    p_payment_intent_id TEXT,
    p_amount DECIMAL,
    p_status TEXT DEFAULT 'paid'
)
RETURNS TABLE (
    success BOOLEAN,
    payment_id UUID,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment_id UUID;
    v_booking_id UUID;
    v_client_id UUID;
BEGIN
    -- Get invoice details
    SELECT booking_id, client_id INTO v_booking_id, v_client_id
    FROM public.invoices 
    WHERE id = p_invoice_id;
    
    IF v_booking_id IS NULL THEN
        RETURN QUERY SELECT false, NULL::UUID, 'Invoice not found or has no booking';
        RETURN;
    END IF;
    
    -- Generate new payment ID
    v_payment_id := gen_random_uuid();
    
    -- Insert payment record
    INSERT INTO public.payments (
        id,
        booking_id,
        invoice_id,
        payment_intent_id,
        stripe_payment_intent_id,
        amount,
        status,
        payment_method,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_payment_id,
        v_booking_id,
        p_invoice_id,
        p_payment_intent_id,
        p_payment_intent_id,
        p_amount,
        p_status,
        'stripe',
        jsonb_build_object('source', 'invoice_payment', 'invoice_id', p_invoice_id),
        NOW(),
        NOW()
    );
    
    -- Update invoice status
    UPDATE public.invoices 
    SET status = 'paid',
        payment_status = 'completed',
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    -- Update booking status
    UPDATE public.bookings 
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE id = v_booking_id;
    
    RETURN QUERY SELECT 
        true as success, 
        v_payment_id as payment_id, 
        'Payment created successfully from invoice' as message;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success, 
            NULL::UUID as payment_id, 
            'Error creating payment: ' || SQLERRM as message;
END;
$$;

-- Function to sync all paid invoices that don't have payment records
CREATE OR REPLACE FUNCTION public.sync_paid_invoices_to_payments()
RETURNS TABLE (
    success BOOLEAN,
    payments_created INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
    v_invoice RECORD;
    v_payment_id UUID;
BEGIN
    -- Find all paid invoices that don't have corresponding payment records
    FOR v_invoice IN 
        SELECT i.id, i.booking_id, i.client_id, i.total_amount, i.payment_intent_id
        FROM public.invoices i
        LEFT JOIN public.payments p ON i.payment_intent_id = p.payment_intent_id
        WHERE i.status = 'paid' 
        AND p.id IS NULL
        AND i.payment_intent_id IS NOT NULL
    LOOP
        -- Create payment record for each paid invoice
        v_payment_id := gen_random_uuid();
        
        INSERT INTO public.payments (
            id,
            booking_id,
            invoice_id,
            payment_intent_id,
            stripe_payment_intent_id,
            amount,
            status,
            payment_method,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            v_payment_id,
            v_invoice.booking_id,
            v_invoice.id,
            v_invoice.payment_intent_id,
            v_invoice.payment_intent_id,
            v_invoice.total_amount,
            'paid',
            'stripe',
            jsonb_build_object('source', 'sync_from_invoice', 'invoice_id', v_invoice.id),
            NOW(),
            NOW()
        );
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
        true as success, 
        v_count as payments_created, 
        'Synced ' || v_count || ' payments from paid invoices' as message;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success, 
            0 as payments_created, 
            'Error syncing payments: ' || SQLERRM as message;
END;
$$;

-- Update payments table to include invoice_id relationship
DO $$
BEGIN
    -- Add invoice_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND table_schema = 'public' 
        AND column_name = 'invoice_id'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
        RAISE NOTICE 'Added invoice_id column to payments table';
    END IF;
    
    -- Add client_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND table_schema = 'public' 
        AND column_name = 'client_id'
    ) THEN
        ALTER TABLE public.payments ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
        RAISE NOTICE 'Added client_id column to payments table';
    END IF;
END $$;

-- Function to update payment records with client information
CREATE OR REPLACE FUNCTION public.update_payment_client_info()
RETURNS TABLE (
    success BOOLEAN,
    payments_updated INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Update payment records with client_id from bookings
    UPDATE public.payments 
    SET client_id = (
        SELECT client_id 
        FROM public.bookings 
        WHERE public.bookings.id = public.payments.booking_id
    )
    WHERE client_id IS NULL 
    AND booking_id IS NOT NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT 
        true as success, 
        v_count as payments_updated, 
        'Updated client info for ' || v_count || ' payments' as message;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false as success, 
            0 as payments_updated, 
            'Error updating payment client info: ' || SQLERRM as message;
END;
$$;

-- Create a view for payments with client and invoice info
CREATE OR REPLACE VIEW public.payments_with_details AS
SELECT 
    p.*,
    c.full_name as client_name,
    c.email as client_email,
    i.invoice_number,
    i.status as invoice_status
FROM public.payments p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.invoices i ON p.invoice_id = i.id;

SELECT 'Stripe payments sync functions created successfully!' as result;
