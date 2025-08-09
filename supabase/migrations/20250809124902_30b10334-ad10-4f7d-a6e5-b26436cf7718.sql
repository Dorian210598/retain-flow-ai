-- Create a cancellation flow for the Demo Insurance Company organization
INSERT INTO public.cancellation_flows (id, organization_id, name, description, is_active) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '550e8400-e29b-41d4-a716-446655440000', 'Demo Retention Flow', 'Demo retention flow for testing', true)
ON CONFLICT (id) DO NOTHING;

-- Create a flow variant
INSERT INTO public.flow_variants (id, flow_id, name, traffic_allocation, is_control) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Demo Variant', 1.0, true)
ON CONFLICT (id) DO NOTHING;

-- Create flow steps for the Demo Insurance Company
INSERT INTO public.flow_steps (variant_id, step_order, component_name, configuration) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 'FeedbackSurvey', '{"title": "Before you cancel your policy...", "description": "Help us understand your decision", "questions": [{"id": "reason", "type": "select", "label": "What''s the main reason for cancelling?", "options": ["Too expensive", "Not using it enough", "Found a better deal", "Poor customer service", "Moving/relocating", "Other"], "required": true}, {"id": "details", "type": "text", "label": "Any additional comments?", "required": false}]}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 2, 'DiscountOffer', '{"title": "Wait! Special offer just for you", "description": "We value your business and want to make things right", "discountPercent": 20, "discountDuration": 3}'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 3, 'FinalConfirmation', '{"title": "Final confirmation required", "description": "This will permanently cancel your policy. You can always reactivate later, but this action cannot be undone.", "confirmText": "Yes, I want to cancel my policy"}')
ON CONFLICT DO NOTHING;