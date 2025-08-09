-- Fix security warnings by setting search_path for helper functions
DROP FUNCTION IF EXISTS public.get_my_organization_id();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Recreate helper functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;