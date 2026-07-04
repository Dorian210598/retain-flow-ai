-- ============ TYPES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.policy_status AS ENUM ('active', 'pending_cancellation', 'cancelled');
CREATE TYPE public.session_outcome AS ENUM ('retained', 'cancelled');

-- ============ TABLES ============
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.client_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  policy_number text NOT NULL UNIQUE,
  status public.policy_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL,
  renewal_date date NOT NULL,
  has_active_claim boolean NOT NULL DEFAULT false,
  has_cfar_benefit boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.step_components (
  component_name text PRIMARY KEY,
  description text NOT NULL,
  default_config_schema jsonb NOT NULL
);

CREATE TABLE public.cancellation_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.flow_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES public.cancellation_flows(id) ON DELETE CASCADE,
  name text NOT NULL,
  traffic_allocation double precision NOT NULL DEFAULT 1.0 CHECK (traffic_allocation >= 0.0 AND traffic_allocation <= 1.0),
  is_control boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.flow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.flow_variants(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  component_name text NOT NULL REFERENCES public.step_components(component_name),
  configuration jsonb NOT NULL DEFAULT '{}',
  condition jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(variant_id, step_order)
);

CREATE TABLE public.flow_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES public.client_policies(id) ON DELETE CASCADE,
  flow_variant_id uuid NOT NULL REFERENCES public.flow_variants(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  outcome public.session_outcome,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.flow_sessions(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES public.flow_steps(id) ON DELETE CASCADE,
  "timestamp" timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'
);

CREATE INDEX idx_interaction_events_event_data_mouse ON public.interaction_events USING gin (event_data) WHERE (event_data ? 'mouse_position');
CREATE INDEX idx_interaction_events_session_timeline ON public.interaction_events (session_id, "timestamp");

-- ============ GRANTS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.step_components TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cancellation_flows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interaction_events TO authenticated;
GRANT ALL ON public.organizations, public.profiles, public.products, public.client_policies, public.step_components, public.cancellation_flows, public.flow_variants, public.flow_steps, public.flow_sessions, public.interaction_events TO service_role;

-- ============ RLS ============
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

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.get_my_organization_id() RETURNS uuid
  LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT organization_id FROM public.profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text
  LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT role::text FROM public.profiles WHERE id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.get_session_replay_data(session_uuid uuid)
RETURNS TABLE(event_id uuid, event_type text, event_timestamp timestamptz, event_data jsonb, component_name text)
  LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT ie.id, ie.event_type, ie.timestamp, ie.event_data, fs.component_name
  FROM interaction_events ie
  LEFT JOIN flow_steps fs ON ie.step_id = fs.id
  WHERE ie.session_id = session_uuid
  ORDER BY ie.timestamp ASC;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  org_id uuid;
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'New Organization'))
    RETURNING id INTO org_id;
  ELSE
    SELECT id INTO org_id FROM public.organizations LIMIT 1;
    IF org_id IS NULL THEN
      INSERT INTO public.organizations (name) VALUES ('Demo Organization') RETURNING id INTO org_id;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, organization_id, full_name, role)
  VALUES (
    NEW.id,
    org_id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'client')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ POLICIES ============
CREATE POLICY "Users can view their own organization" ON public.organizations FOR SELECT TO authenticated USING (id = public.get_my_organization_id());
CREATE POLICY "Users can view profiles in their organization" ON public.profiles FOR SELECT TO authenticated USING (organization_id = public.get_my_organization_id());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view products in their organization" ON public.products FOR SELECT TO authenticated USING (organization_id = public.get_my_organization_id());
CREATE POLICY "Admins can manage products in their organization" ON public.products FOR ALL TO authenticated USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');
CREATE POLICY "Clients can view their own policies" ON public.client_policies FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Admins can view all policies in their organization" ON public.client_policies FOR SELECT TO authenticated USING (public.get_my_role() = 'admin' AND client_id IN (SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()));
CREATE POLICY "All authenticated users can view step components" ON public.step_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view flows in their organization" ON public.cancellation_flows FOR SELECT TO authenticated USING (organization_id = public.get_my_organization_id());
CREATE POLICY "Admins can manage flows in their organization" ON public.cancellation_flows FOR ALL TO authenticated USING (organization_id = public.get_my_organization_id() AND public.get_my_role() = 'admin');
CREATE POLICY "Users can view variants in their organization" ON public.flow_variants FOR SELECT TO authenticated USING (flow_id IN (SELECT id FROM public.cancellation_flows WHERE organization_id = public.get_my_organization_id()));
CREATE POLICY "Admins can manage variants in their organization" ON public.flow_variants FOR ALL TO authenticated USING (public.get_my_role() = 'admin' AND flow_id IN (SELECT id FROM public.cancellation_flows WHERE organization_id = public.get_my_organization_id()));
CREATE POLICY "Users can view steps in their organization" ON public.flow_steps FOR SELECT TO authenticated USING (variant_id IN (SELECT fv.id FROM public.flow_variants fv JOIN public.cancellation_flows cf ON fv.flow_id = cf.id WHERE cf.organization_id = public.get_my_organization_id()));
CREATE POLICY "Admins can manage steps in their organization" ON public.flow_steps FOR ALL TO authenticated USING (public.get_my_role() = 'admin' AND variant_id IN (SELECT fv.id FROM public.flow_variants fv JOIN public.cancellation_flows cf ON fv.flow_id = cf.id WHERE cf.organization_id = public.get_my_organization_id()));
CREATE POLICY "Clients can view their own sessions" ON public.flow_sessions FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Clients can create their own sessions" ON public.flow_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Clients can update their own sessions" ON public.flow_sessions FOR UPDATE TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Admins can view all sessions in their organization" ON public.flow_sessions FOR SELECT TO authenticated USING (public.get_my_role() = 'admin' AND client_id IN (SELECT id FROM public.profiles WHERE organization_id = public.get_my_organization_id()));
CREATE POLICY "Clients can manage events for their own sessions" ON public.interaction_events FOR ALL TO authenticated USING (session_id IN (SELECT id FROM public.flow_sessions WHERE client_id = auth.uid()));
CREATE POLICY "Admins can view all events in their organization" ON public.interaction_events FOR SELECT TO authenticated USING (public.get_my_role() = 'admin' AND session_id IN (SELECT fs.id FROM public.flow_sessions fs JOIN public.profiles p ON fs.client_id = p.id WHERE p.organization_id = public.get_my_organization_id()));

-- ============ SEED DATA (org-scoped only; user-linked rows omitted) ============
INSERT INTO public.organizations (id, name, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000','Demo Insurance Company','2025-08-09 12:35:17.460191+00'),
  ('42e5915f-acaf-4164-abbb-0804704892d4','Test','2025-08-09 12:38:21.598167+00'),
  ('11111111-1111-1111-1111-111111111111','Acme Insurance Co','2025-08-09 12:40:26.693546+00'),
  ('22222222-2222-2222-2222-222222222222','SafeGuard Insurance','2025-08-09 12:40:26.693546+00'),
  ('33333333-3333-3333-3333-333333333333','Premier Protection Inc','2025-08-09 12:40:26.693546+00');

INSERT INTO public.products (id, organization_id, name, description, created_at) VALUES
  ('0e3582e6-9f86-435d-b39b-6a37c9173bf7','550e8400-e29b-41d4-a716-446655440000','Auto Insurance Comprehensive','Full comprehensive auto insurance coverage with 24/7 support','2025-08-09 12:35:17.460191+00'),
  ('76fa2eb2-2b1c-4305-b5bc-a234d3b6e869','11111111-1111-1111-1111-111111111111','Home Insurance Premium','Comprehensive home insurance with full coverage','2025-08-09 12:40:26.693546+00'),
  ('144e1cfb-34a6-4c0e-a9e2-85ad992e2485','11111111-1111-1111-1111-111111111111','Life Insurance Basic','Basic life insurance coverage','2025-08-09 12:40:26.693546+00'),
  ('e6680ccf-af64-4600-903e-742ef16c6282','22222222-2222-2222-2222-222222222222','Auto Insurance Economy','Budget-friendly auto insurance','2025-08-09 12:40:26.693546+00'),
  ('1c1386d9-f91f-461d-8d35-50a8809f8b00','33333333-3333-3333-3333-333333333333','Business Insurance Pro','Professional business insurance package','2025-08-09 12:40:26.693546+00'),
  ('11111111-1111-1111-1111-111111111111','42e5915f-acaf-4164-abbb-0804704892d4','Premium Insurance Package','Comprehensive insurance package with full coverage','2025-08-09 13:26:22.933743+00');

INSERT INTO public.step_components (component_name, description, default_config_schema) VALUES
('FeedbackSurvey','Collects feedback about cancellation reasons','{"title": "Help us improve", "questions": [{"id": "reason", "type": "select", "label": "Why are you cancelling?", "options": ["Too expensive", "Not using enough", "Found alternative", "Other"]}], "description": "Please tell us why you are cancelling"}'::jsonb),
('DiscountOffer','Offers a discount to retain the customer','{"title": "Special Offer Just For You", "description": "We would hate to see you go. Here is an exclusive discount to help you stay.", "discountPercent": 20, "discountDuration": 3}'::jsonb),
('ProductSwap','Offers alternative products','{"title": "Maybe try something different?", "description": "We have other products that might better fit your needs.", "productsToOffer": []}'::jsonb),
('PauseSubscription','Offers to pause subscription instead of cancelling','{"title": "Take a break instead?", "description": "You can pause your policy and resume it later when you are ready.", "pauseOptions": [1, 2, 3, 6]}'::jsonb),
('ValueReinforcement','Reminds user of benefits they will lose','{"title": "You will be giving up a lot", "benefits": ["Full coverage protection", "24/7 customer support", "No claim limits"], "description": "Here is what you will lose when you cancel your policy."}'::jsonb),
('FinalConfirmation','Final step to confirm cancellation','{"title": "Are you sure?", "confirmText": "Yes, cancel my policy", "description": "This action cannot be undone. Your policy will be cancelled immediately."}'::jsonb);

INSERT INTO public.cancellation_flows (id, organization_id, name, description, is_active, created_at) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','Standard Retention Flow','Basic retention flow with survey and discount offer',true,'2025-08-09 12:40:26.693546+00'),
  ('4ff6b0ee-029f-496d-bd35-c2a9546f536a','42e5915f-acaf-4164-abbb-0804704892d4','testing flow creation','',false,'2025-08-09 13:10:18.459967+00'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc','42e5915f-acaf-4164-abbb-0804704892d4','Admin Test Retention Flow','Demo retention flow for testing',true,'2025-08-09 12:49:00.343297+00');

INSERT INTO public.flow_variants (id, flow_id, name, traffic_allocation, is_control, created_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Main Variant',1,true,'2025-08-09 12:40:26.693546+00'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd','cccccccc-cccc-cccc-cccc-cccccccccccc','Demo Variant',1,true,'2025-08-09 12:49:00.343297+00'),
  ('d7bdce26-4003-4d71-b8b6-3990d5ff192c','4ff6b0ee-029f-496d-bd35-c2a9546f536a','Default Variant',1,true,'2025-08-09 13:10:18.578031+00');

INSERT INTO public.flow_steps (id, variant_id, step_order, component_name, configuration, condition, created_at) VALUES
  ('c96ce864-5f85-434d-958d-a1624b2f24ec', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'FeedbackSurvey', '{"title": "Before you go...", "questions": [{"id": "reason", "type": "select", "label": "What''s the main reason for cancelling?", "options": ["Too expensive", "Not using enough", "Found a better alternative", "Poor customer service", "Other"], "required": true}], "description": "Help us understand why you want to cancel"}'::jsonb, NULL, '2025-08-09 12:40:26.693546+00'),
  ('d5499758-d87f-4214-b60d-09bb42b9ed5b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'DiscountOffer', '{"title": "Wait! We have an offer for you", "description": "Before you cancel, let us make this right with a special discount", "discountPercent": 25, "discountDuration": 6}'::jsonb, NULL, '2025-08-09 12:40:26.693546+00'),
  ('e7822183-7f9c-4a07-8c8e-e8ed18da86e6', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 'FinalConfirmation', '{"title": "Final confirmation", "confirmText": "Yes, cancel my policy", "description": "Are you sure you want to cancel your policy? This action cannot be undone."}'::jsonb, NULL, '2025-08-09 12:40:26.693546+00'),
  ('a7cc2412-b714-4c16-8c36-a2e751bead7a', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 'FeedbackSurvey', '{"title": "Before you cancel your policy...", "questions": [{"id": "reason", "type": "select", "label": "What''s the main reason for cancelling?", "options": ["Too expensive", "Not using it enough", "Found a better deal", "Poor customer service", "Moving/relocating", "Other"], "required": true}, {"id": "details", "type": "text", "label": "Any additional comments?", "required": false}], "description": "Help us understand your decision"}'::jsonb, NULL, '2025-08-09 12:49:00.343297+00'),
  ('cf522f9b-4774-4b06-8f41-3086ca070dc1', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 'DiscountOffer', '{"title": "Wait! Special offer just for you", "description": "We value your business and want to make things right", "discountPercent": 20, "discountDuration": 3}'::jsonb, NULL, '2025-08-09 12:49:00.343297+00'),
  ('85979456-5921-415d-9e4c-41b8ab78a44c', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 3, 'FinalConfirmation', '{"title": "Final confirmation required", "confirmText": "Yes, I want to cancel my policy", "description": "This will permanently cancel your policy. You can always reactivate later, but this action cannot be undone."}'::jsonb, NULL, '2025-08-09 12:49:00.343297+00'),
  ('db54efad-8fc7-4d2b-b9a2-1c19132940ee', 'd7bdce26-4003-4d71-b8b6-3990d5ff192c', 1, 'FeedbackSurvey', '{"title": "Why are you cancelling?", "reasons": ["Too expensive", "Not using it", "Found alternative", "Technical issues"], "description": "Help us understand your reasons"}'::jsonb, NULL, '2025-08-09 13:10:28.622046+00'),
  ('39d1a421-75c7-4e93-b2e6-52aded73ef43', 'd7bdce26-4003-4d71-b8b6-3990d5ff192c', 2, 'DiscountOffer', '{"title": "Special Offer Just For You", "description": "We''d hate to see you go. Here''s an exclusive discount to help you stay.", "discountPercent": 20, "discountDuration": 3}'::jsonb, NULL, '2025-08-09 13:10:45.638402+00'),
  ('210f6eda-1c97-4fda-a9ed-52f4dc08ada2', 'd7bdce26-4003-4d71-b8b6-3990d5ff192c', 3, 'FinalConfirmation', '{"title": "Are you sure?", "confirmText": "Yes, cancel my policy", "description": "This action cannot be undone. Your policy will be cancelled immediately."}'::jsonb, NULL, '2025-08-09 13:12:45.157751+00'),
  ('599b15fb-5c1b-4fc7-a405-092db1eea954', 'd7bdce26-4003-4d71-b8b6-3990d5ff192c', 4, 'FinalConfirmation', '{"title": "Are you sure?", "confirmText": "Yes, cancel my policy", "description": "This action cannot be undone. Your policy will be cancelled immediately."}'::jsonb, NULL, '2025-08-09 13:12:58.769621+00'),
  ('9b6e1f11-c3ca-4be1-af91-a3aa0af31924', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 'PauseSubscription', '{"title": "Take a break instead", "description": "Not ready to cancel? Pause your subscription temporarily and come back when you''re ready.", "pauseOptions": [{"label": "1 Month", "duration": 30, "description": "Perfect for a short break"}, {"label": "3 Months", "duration": 90, "description": "Ideal for seasonal breaks"}, {"label": "6 Months", "duration": 180, "description": "Extended pause option"}]}'::jsonb, NULL, '2025-08-09 14:03:38.290411+00'),
  ('8db7c38f-7ed6-40d4-a3db-f4c607187939', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5, 'PauseSubscription', '{"title": "Take a break instead", "description": "Not ready to cancel? Pause your subscription temporarily and come back when you''re ready.", "pauseOptions": [{"label": "1 Month", "duration": 30, "description": "Perfect for a short break"}, {"label": "3 Months", "duration": 90, "description": "Ideal for seasonal breaks"}, {"label": "6 Months", "duration": 180, "description": "Extended pause option"}]}'::jsonb, NULL, '2025-08-09 14:03:47.471967+00'),
  ('071ff90a-5104-44d0-93a4-0993591731dc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 6, 'FeedbackSurvey', '{"title": "Why are you cancelling?", "questions": [{"id": "reason", "type": "select", "label": "What''s your main reason for cancelling?", "options": ["Too expensive", "Not using it", "Found alternative", "Technical issues"], "required": true}], "description": "Help us understand your reasons"}'::jsonb, NULL, '2025-08-09 17:22:29.397798+00');