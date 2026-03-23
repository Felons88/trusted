-- COMPREHENSIVE RLS RECURSION FIX
-- This fixes all potential circular references in RLS policies

-- Step 1: Drop ALL existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can do everything with clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own data" ON clients;
DROP POLICY IF EXISTS "Clients can update own data" ON clients;
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Clients can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Clients can manage own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Anyone can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;
DROP POLICY IF EXISTS "Anyone can view active add-ons" ON add_ons;
DROP POLICY IF EXISTS "Admins can manage add-ons" ON add_ons;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
DROP POLICY IF EXISTS "Clients can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Clients can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can view contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can view quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Anyone can create quote requests" ON quote_requests;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can view own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can insert own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can update own 2FA data" ON two_factor_auth;
DROP POLICY IF EXISTS "Users can delete own 2FA data" ON two_factor_auth;

-- Step 2: Create a helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = user_uuid;
  
  RETURN user_role = 'admin';
END;
$$;

-- Step 3: Recreate RLS policies with non-recursive logic

-- Profiles policies (use direct comparison instead of EXISTS)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin(auth.uid()));

-- Clients policies
CREATE POLICY "Admins can do everything with clients" ON clients FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can view own data" ON clients FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Clients can update own data" ON clients FOR UPDATE USING (user_id = auth.uid());

-- Vehicles policies
CREATE POLICY "Admins can manage all vehicles" ON vehicles FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can view own vehicles" ON vehicles FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = vehicles.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can manage own vehicles" ON vehicles FOR ALL USING (
  EXISTS (SELECT 1 FROM clients WHERE id = vehicles.client_id AND user_id = auth.uid())
);

-- Services policies (public read, admin write)
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage services" ON services FOR ALL USING (is_admin(auth.uid()));

-- Add-ons policies (public read, admin write)
CREATE POLICY "Anyone can view active add-ons" ON add_ons FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage add-ons" ON add_ons FOR ALL USING (is_admin(auth.uid()));

-- Bookings policies
CREATE POLICY "Admins can manage all bookings" ON bookings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can view own bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = bookings.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can create bookings" ON bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = bookings.client_id AND user_id = auth.uid())
);

-- Payments policies
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can view own payments" ON payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = payments.client_id AND user_id = auth.uid())
);

-- Invoices policies
CREATE POLICY "Admins can manage all invoices" ON invoices FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Clients can view own invoices" ON invoices FOR SELECT USING (
  EXISTS (SELECT 1 FROM clients WHERE id = invoices.client_id AND user_id = auth.uid())
);
CREATE POLICY "Clients can insert own invoices" ON invoices FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = invoices.client_id AND user_id = auth.uid())
);

-- Contact submissions (admin only)
CREATE POLICY "Admins can view contact submissions" ON contact_submissions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions FOR INSERT WITH CHECK (true);

-- Quote requests (admin only read, anyone can create)
CREATE POLICY "Admins can view quote requests" ON quote_requests FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can create quote requests" ON quote_requests FOR INSERT WITH CHECK (true);

-- Reviews policies
CREATE POLICY "Admins can manage all reviews" ON reviews FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Clients can create reviews" ON reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM clients WHERE id = reviews.client_id AND user_id = auth.uid())
);

-- Two Factor Auth policies
CREATE POLICY "Users can view own 2FA data" ON two_factor_auth FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own 2FA data" ON two_factor_auth FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own 2FA data" ON two_factor_auth FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own 2FA data" ON two_factor_auth FOR DELETE USING (auth.uid() = user_id);

-- Step 4: Test the fix
SELECT 'RLS recursion fix applied successfully' as status;

-- Test the admin function
SELECT is_admin('00000000-0000-0000-0000-000000000000'::uuid) as test_admin_check;
