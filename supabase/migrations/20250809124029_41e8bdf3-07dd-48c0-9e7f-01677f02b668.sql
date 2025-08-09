-- Create some demo organizations and users for testing
-- Note: These won't be real auth users, but will populate the database with test data

-- Insert demo organizations
INSERT INTO public.organizations (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Insurance Co'),
  ('22222222-2222-2222-2222-222222222222', 'SafeGuard Insurance'),
  ('33333333-3333-3333-3333-333333333333', 'Premier Protection Inc')
ON CONFLICT (id) DO NOTHING;

-- Insert demo products
INSERT INTO public.products (organization_id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Home Insurance Premium', 'Comprehensive home insurance with full coverage'),
  ('11111111-1111-1111-1111-111111111111', 'Life Insurance Basic', 'Basic life insurance coverage'),
  ('22222222-2222-2222-2222-222222222222', 'Auto Insurance Economy', 'Budget-friendly auto insurance'),
  ('33333333-3333-3333-3333-333333333333', 'Business Insurance Pro', 'Professional business insurance package')
ON CONFLICT DO NOTHING;

-- Create a simple demo cancellation flow
INSERT INTO public.cancellation_flows (id, organization_id, name, description, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Standard Retention Flow', 'Basic retention flow with survey and discount offer', true)
ON CONFLICT (id) DO NOTHING;

-- Create a flow variant
INSERT INTO public.flow_variants (id, flow_id, name, traffic_allocation, is_control) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Main Variant', 1.0, true)
ON CONFLICT (id) DO NOTHING;

-- Create flow steps
INSERT INTO public.flow_steps (variant_id, step_order, component_name, configuration) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'FeedbackSurvey', '{"title": "Before you go...", "description": "Help us understand why you want to cancel", "questions": [{"id": "reason", "type": "select", "label": "What''s the main reason for cancelling?", "options": ["Too expensive", "Not using enough", "Found a better alternative", "Poor customer service", "Other"], "required": true}]}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 'DiscountOffer', '{"title": "Wait! We have an offer for you", "description": "Before you cancel, let us make this right with a special discount", "discountPercent": 25, "discountDuration": 6}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 'FinalConfirmation', '{"title": "Final confirmation", "description": "Are you sure you want to cancel your policy? This action cannot be undone.", "confirmText": "Yes, cancel my policy"}')
ON CONFLICT DO NOTHING;

-- Create a demo admin user profile (this will need a real auth user to work)
-- For testing, you can sign up with any email and this org will be available

-- The system is now ready for testing! 
-- When you sign up as an admin, you can use "Acme Insurance Co" as your organization name
-- or create a new one. The flow above will be active and ready to test.