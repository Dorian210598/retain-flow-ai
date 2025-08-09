-- Fix security warnings by recreating functions with proper search_path
-- We need to drop cascade and recreate everything because functions are referenced by policies

-- First drop all policies that depend on the functions
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products in their organization" ON public.products;
DROP POLICY IF EXISTS "Admins can view all policies in their organization" ON public.client_policies;
DROP POLICY IF EXISTS "Users can view flows in their organization" ON public.cancellation_flows;
DROP POLICY IF EXISTS "Admins can manage flows in their organization" ON public.cancellation_flows;
DROP POLICY IF EXISTS "Users can view variants in their organization" ON public.flow_variants;
DROP POLICY IF EXISTS "Admins can manage variants in their organization" ON public.flow_variants;
DROP POLICY IF EXISTS "Users can view steps in their organization" ON public.flow_steps;
DROP POLICY IF EXISTS "Admins can manage steps in their organization" ON public.flow_steps;
DROP POLICY IF EXISTS "Admins can view all sessions in their organization" ON public.flow_sessions;
DROP POLICY IF EXISTS "Admins can view all events in their organization" ON public.interaction_events;

-- Drop the functions
DROP FUNCTION IF EXISTS public.get_my_organization_id() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- Recreate functions with proper search_path
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

-- Recreate all the policies
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_my_organization_id());

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Admins can manage products in their organization"
ON public.products FOR ALL
TO authenticated
USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');

CREATE POLICY "Admins can view all policies in their organization"
ON public.client_policies FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  client_id IN (
    SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Users can view flows in their organization"
ON public.cancellation_flows FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Admins can manage flows in their organization"
ON public.cancellation_flows FOR ALL
TO authenticated
USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');

CREATE POLICY "Users can view variants in their organization"
ON public.flow_variants FOR SELECT
TO authenticated
USING (
  flow_id IN (
    SELECT id FROM public.cancellation_flows WHERE organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Admins can manage variants in their organization"
ON public.flow_variants FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  flow_id IN (
    SELECT id FROM public.cancellation_flows WHERE organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Users can view steps in their organization"
ON public.flow_steps FOR SELECT
TO authenticated
USING (
  variant_id IN (
    SELECT fv.id FROM public.flow_variants fv
    JOIN public.cancellation_flows cf ON fv.flow_id = cf.id
    WHERE cf.organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Admins can manage steps in their organization"
ON public.flow_steps FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  variant_id IN (
    SELECT fv.id FROM public.flow_variants fv
    JOIN public.cancellation_flows cf ON fv.flow_id = cf.id
    WHERE cf.organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Admins can view all sessions in their organization"
ON public.flow_sessions FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  client_id IN (
    SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()
  )
);

CREATE POLICY "Admins can view all events in their organization"
ON public.interaction_events FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  session_id IN (
    SELECT fs.id FROM public.flow_sessions fs
    JOIN public.profiles p ON fs.client_id = p.id
    WHERE p.organization_id = public.get_my_organization_id()
  )
);