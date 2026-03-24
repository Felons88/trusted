-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    minimum_amount DECIMAL(10,2) DEFAULT 0 CHECK (minimum_amount >= 0),
    maximum_discount DECIMAL(10,2), -- Max discount for percentage codes
    usage_limit INTEGER DEFAULT NULL, -- Null for unlimited
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Discount Code Usage Tracking Table
CREATE TABLE IF NOT EXISTS discount_code_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    original_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add discount columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_total DECIMAL(10,2);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active_dates ON discount_codes(is_active, starts_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code_id ON discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_invoice_id ON discount_code_usage(invoice_id);

-- RLS Policies for discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all discount codes" ON discount_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can insert discount codes" ON discount_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can update discount codes" ON discount_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can delete discount codes" ON discount_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for discount_code_usage
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all discount usage" ON discount_code_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Users can view their own discount usage" ON discount_code_usage
    FOR SELECT USING (client_id IS NOT NULL);

-- Function to validate and apply discount code
CREATE OR REPLACE FUNCTION validate_and_apply_discount(
    p_code TEXT,
    p_amount DECIMAL(10,2)
)
RETURNS TABLE(
    discount_code_id UUID,
    is_valid BOOLEAN,
    discount_amount DECIMAL(10,2),
    final_amount DECIMAL(10,2),
    error_message TEXT
) AS $$
DECLARE
    v_discount_code discount_codes%ROWTYPE;
    v_discount_amount DECIMAL(10,2) := 0;
    v_final_amount DECIMAL(10,2) := p_amount;
    v_error_message TEXT := NULL;
BEGIN
    -- Find the discount code
    SELECT * INTO v_discount_code
    FROM discount_codes
    WHERE code = UPPER(p_code)
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Check if code exists
    IF v_discount_code IS NULL THEN
        v_error_message := 'Invalid discount code';
        RETURN QUERY SELECT 
            NULL::UUID, 
            false, 
            0::DECIMAL(10,2), 
            p_amount, 
            v_error_message;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_discount_code.usage_limit IS NOT NULL 
       AND v_discount_code.usage_count >= v_discount_code.usage_limit THEN
        v_error_message := 'Discount code has reached its usage limit';
        RETURN QUERY SELECT 
            v_discount_code.id, 
            false, 
            0::DECIMAL(10,2), 
            p_amount, 
            v_error_message;
        RETURN;
    END IF;
    
    -- Check minimum amount
    IF p_amount < v_discount_code.minimum_amount THEN
        v_error_message := 'Minimum order amount of $' || v_discount_code.minimum_amount || ' required';
        RETURN QUERY SELECT 
            v_discount_code.id, 
            false, 
            0::DECIMAL(10,2), 
            p_amount, 
            v_error_message;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_discount_code.discount_type = 'percentage' THEN
        v_discount_amount := p_amount * (v_discount_code.discount_value / 100);
        
        -- Apply maximum discount limit if set
        IF v_discount_code.maximum_discount IS NOT NULL 
           AND v_discount_amount > v_discount_code.maximum_discount THEN
            v_discount_amount := v_discount_code.maximum_discount;
        END IF;
    ELSE -- fixed_amount
        v_discount_amount := v_discount_code.discount_value;
        
        -- Don't allow discount to exceed order amount
        IF v_discount_amount > p_amount THEN
            v_discount_amount := p_amount;
        END IF;
    END IF;
    
    v_final_amount := p_amount - v_discount_amount;
    
    -- Ensure final amount is not negative
    IF v_final_amount < 0 THEN
        v_final_amount := 0;
        v_discount_amount := p_amount;
    END IF;
    
    RETURN QUERY SELECT 
        v_discount_code.id, 
        true, 
        v_discount_amount, 
        v_final_amount, 
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record discount usage
CREATE OR REPLACE FUNCTION record_discount_usage(
    p_discount_code_id UUID,
    p_invoice_id UUID,
    p_client_id UUID,
    p_discount_amount DECIMAL(10,2),
    p_original_amount DECIMAL(10,2),
    p_final_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
    -- Insert usage record
    INSERT INTO discount_code_usage (
        discount_code_id,
        invoice_id,
        client_id,
        discount_amount,
        original_amount,
        final_amount
    ) VALUES (
        p_discount_code_id,
        p_invoice_id,
        p_client_id,
        p_discount_amount,
        p_original_amount,
        p_final_amount
    );
    
    -- Update usage count
    UPDATE discount_codes 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = p_discount_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample discount codes
INSERT INTO discount_codes (code, description, discount_type, discount_value, minimum_amount, usage_limit, expires_at) VALUES
('WELCOME10', 'Welcome discount for new customers', 'percentage', 10, 50, 100, NOW() + INTERVAL '3 months'),
('SAVE25', 'Save $25 on orders over $100', 'fixed_amount', 25, 100, 50, NOW() + INTERVAL '2 months'),
('SPRING20', 'Spring cleaning special - 20% off', 'percentage', 20, 75, NULL, NOW() + INTERVAL '1 month'),
('LOYALTY15', 'Loyalty discount for returning customers', 'percentage', 15, 0, NULL, NOW() + INTERVAL '6 months');

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discount_codes_updated_at 
    BEFORE UPDATE ON discount_codes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
