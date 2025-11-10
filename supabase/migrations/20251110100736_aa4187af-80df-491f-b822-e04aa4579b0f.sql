
-- Update handle_new_user to assign all new clients to DAdmin organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  org_id UUID;
  default_product_id UUID;
BEGIN
  -- Extract user metadata
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    -- Create organization for admin users
    INSERT INTO public.organizations (name)
    VALUES (NEW.raw_user_meta_data->>'organization_name')
    RETURNING id INTO org_id;
  ELSE
    -- For client users, assign them to DAdmin organization
    SELECT id INTO org_id FROM public.organizations WHERE name = 'DAdmin';
    
    -- If DAdmin doesn't exist, create it
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name)
      VALUES ('DAdmin')
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

  -- Create default policy for client users
  IF NEW.raw_user_meta_data->>'role' = 'client' THEN
    -- Get or create a default product
    SELECT id INTO default_product_id 
    FROM public.products 
    WHERE organization_id = org_id 
    LIMIT 1;
    
    IF default_product_id IS NULL THEN
      INSERT INTO public.products (organization_id, name, description)
      VALUES (org_id, 'Standard Insurance Policy', 'Default insurance policy for new clients')
      RETURNING id INTO default_product_id;
    END IF;
    
    -- Create the policy
    INSERT INTO public.client_policies (
      client_id,
      product_id,
      policy_number,
      status,
      start_date,
      renewal_date,
      has_active_claim,
      has_cfar_benefit
    ) VALUES (
      NEW.id,
      default_product_id,
      'POL-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
      'active',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '1 year',
      false,
      false
    );
  END IF;

  RETURN NEW;
END;
$function$;
