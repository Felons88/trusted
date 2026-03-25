-- USER PROFILE FIX
-- This script creates the profiles table and handles user profile creation

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR 
        auth.jwt() ->> 'role' = 'service_role'
    );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get or create profile (fallback for existing users)
CREATE OR REPLACE FUNCTION public.get_or_create_profile(user_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_record RECORD;
BEGIN
    -- Try to get existing profile
    SELECT * INTO profile_record 
    FROM public.profiles 
    WHERE id = user_id;
    
    -- If profile doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
            user_id,
            (SELECT email FROM auth.users WHERE id = user_id),
            COALESCE(
                (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id),
                split_part((SELECT email FROM auth.users WHERE id = user_id), '@', 1)
            )
        )
        RETURNING * INTO profile_record;
    END IF;
    
    -- Return the profile
    RETURN QUERY
    SELECT 
        profile_record.id,
        profile_record.email,
        profile_record.full_name,
        profile_record.phone,
        profile_record.avatar_url,
        profile_record.role,
        profile_record.created_at,
        profile_record.updated_at;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, return a basic profile
        RETURN QUERY
        SELECT 
            user_id,
            (SELECT email FROM auth.users WHERE id = user_id),
            split_part((SELECT email FROM auth.users WHERE id = user_id), '@', 1),
            NULL,
            NULL,
            'user',
            NOW(),
            NOW();
END;
$$;

-- Create a public view for profiles with fallback
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
    p.created_at,
    p.updated_at
FROM public.profiles p
UNION ALL
-- Fallback for users without profiles
SELECT 
    u.id,
    u.email,
    split_part(u.email, '@', 1) as full_name,
    NULL as phone,
    'user' as role,
    u.created_at,
    u.updated_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

SELECT 'User profile system created successfully!' as result;
