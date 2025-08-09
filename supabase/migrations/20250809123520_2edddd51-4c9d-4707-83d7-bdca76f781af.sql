-- Create trigger to automatically create profiles and organizations for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Extract user metadata
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    -- Create organization for admin users
    INSERT INTO public.organizations (name)
    VALUES (NEW.raw_user_meta_data->>'organization_name')
    RETURNING id INTO org_id;
  ELSE
    -- For client users, we'll need to assign them to an existing organization
    -- For demo purposes, let's create a default organization if none exists
    SELECT id INTO org_id FROM public.organizations LIMIT 1;
    
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name)
      VALUES ('Demo Organization')
      RETURNING id INTO org_id;
    END IF;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (
    id,
    organization_id,
    full_name,
    role
  ) VALUES (
    NEW.id,
    org_id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'role')::public.app_role
  );

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some demo data for testing
-- First create a demo organization
INSERT INTO public.organizations (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Insurance Company')
ON CONFLICT (id) DO NOTHING;

-- Create a demo product
INSERT INTO public.products (organization_id, name, description)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Auto Insurance Comprehensive',
  'Full comprehensive auto insurance coverage with 24/7 support'
)
ON CONFLICT DO NOTHING;