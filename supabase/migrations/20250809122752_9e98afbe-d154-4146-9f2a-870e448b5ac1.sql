-- Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.policy_status AS ENUM ('active', 'pending_cancellation', 'cancelled');
CREATE TYPE public.session_outcome AS ENUM ('retained', 'cancelled');

-- Organizations table (multi-tenancy)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enhanced profiles table with roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client policies table
CREATE TABLE public.client_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL UNIQUE,
  status public.policy_status NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  has_active_claim BOOLEAN NOT NULL DEFAULT false,
  has_cfar_benefit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step components registry
CREATE TABLE public.step_components (
  component_name TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  default_config_schema JSONB NOT NULL
);

-- Cancellation flows
CREATE TABLE public.cancellation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flow variants for A/B testing
CREATE TABLE public.flow_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.cancellation_flows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  traffic_allocation FLOAT NOT NULL DEFAULT 1.0 CHECK (traffic_allocation >= 0.0 AND traffic_allocation <= 1.0),
  is_control BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Flow steps
CREATE TABLE public.flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL REFERENCES public.flow_variants(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  component_name TEXT NOT NULL REFERENCES public.step_components(component_name),
  configuration JSONB NOT NULL DEFAULT '{}',
  condition JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(variant_id, step_order)
);

-- Flow sessions for analytics
CREATE TABLE public.flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES public.client_policies(id) ON DELETE CASCADE,
  flow_variant_id UUID NOT NULL REFERENCES public.flow_variants(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  outcome public.session_outcome,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interaction events for detailed analytics
CREATE TABLE public.interaction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.flow_sessions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.flow_steps(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS UUID LANGUAGE sql SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
TO authenticated
USING (id = public.get_my_organization_id());

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- RLS Policies for products
CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Admins can manage products in their organization"
ON public.products FOR ALL
TO authenticated
USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');

-- RLS Policies for client_policies
CREATE POLICY "Clients can view their own policies"
ON public.client_policies FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all policies in their organization"
ON public.client_policies FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  client_id IN (
    SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()
  )
);

-- RLS Policies for step_components (public read access for all authenticated users)
CREATE POLICY "All authenticated users can view step components"
ON public.step_components FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for cancellation_flows
CREATE POLICY "Users can view flows in their organization"
ON public.cancellation_flows FOR SELECT
TO authenticated
USING (organization_id = public.get_my_organization_id());

CREATE POLICY "Admins can manage flows in their organization"
ON public.cancellation_flows FOR ALL
TO authenticated
USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');

-- RLS Policies for flow_variants
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

-- RLS Policies for flow_steps
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

-- RLS Policies for flow_sessions
CREATE POLICY "Clients can view their own sessions"
ON public.flow_sessions FOR SELECT
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Clients can create their own sessions"
ON public.flow_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own sessions"
ON public.flow_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = client_id);

CREATE POLICY "Admins can view all sessions in their organization"
ON public.flow_sessions FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'admin' AND
  client_id IN (
    SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()
  )
);

-- RLS Policies for interaction_events
CREATE POLICY "Clients can manage events for their own sessions"
ON public.interaction_events FOR ALL
TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.flow_sessions WHERE client_id = auth.uid()
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

-- Create update trigger for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default step components
INSERT INTO public.step_components (component_name, description, default_config_schema) VALUES
('FeedbackSurvey', 'Collects feedback about cancellation reasons', '{"questions": [{"id": "reason", "type": "select", "label": "Why are you cancelling?", "options": ["Too expensive", "Not using enough", "Found alternative", "Other"]}], "title": "Help us improve", "description": "Please tell us why you''re cancelling"}'),
('DiscountOffer', 'Offers a discount to retain the customer', '{"discountPercent": 20, "discountDuration": 3, "title": "Special Offer Just For You", "description": "We''d hate to see you go. Here''s an exclusive discount to help you stay."}'),
('ProductSwap', 'Offers alternative products', '{"productsToOffer": [], "title": "Maybe try something different?", "description": "We have other products that might better fit your needs."}'),
('PauseSubscription', 'Offers to pause subscription instead of cancelling', '{"pauseOptions": [1, 2, 3, 6], "title": "Take a break instead?", "description": "You can pause your policy and resume it later when you''re ready."}'),
('ValueReinforcement', 'Reminds user of benefits they will lose', '{"benefits": ["Full coverage protection", "24/7 customer support", "No claim limits"], "title": "You''ll be giving up a lot", "description": "Here''s what you''ll lose when you cancel your policy."}'),
('FinalConfirmation', 'Final step to confirm cancellation', '{"title": "Are you sure?", "description": "This action cannot be undone. Your policy will be cancelled immediately.", "confirmText": "Yes, cancel my policy"}');