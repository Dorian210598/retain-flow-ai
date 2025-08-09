-- Create some demo flow sessions and interaction events for analytics
-- First, let's create a flow for the admin's organization (Test - 42e5915f-acaf-4164-abbb-0804704892d4)

INSERT INTO cancellation_flows (id, organization_id, name, description, is_active)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '42e5915f-acaf-4164-abbb-0804704892d4',
  'Test Retention Flow',
  'Test retention flow for admin analytics',
  true
);

-- Create a flow variant
INSERT INTO flow_variants (id, name, flow_id, is_control, traffic_allocation)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Test Variant',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  true,
  1.0
);

-- Create flow steps
INSERT INTO flow_steps (id, variant_id, component_name, step_order, configuration) VALUES
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'FeedbackSurvey',
  1,
  '{"title": "Why are you leaving?", "description": "Help us understand", "questions": [{"id": "reason", "type": "select", "label": "Reason?", "options": ["Too expensive", "Not useful", "Found alternative"], "required": true}]}'::jsonb
),
(
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'DiscountOffer',
  2,
  '{"title": "Special Offer", "description": "20% discount", "discountPercent": 20, "discountDuration": 6}'::jsonb
),
(
  'gggggggg-gggg-gggg-gggg-gggggggggggg',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'FinalConfirmation',
  3,
  '{"title": "Final confirmation", "description": "Are you sure?", "confirmText": "Yes, cancel"}'::jsonb
);

-- Create some demo flow sessions with different outcomes
INSERT INTO flow_sessions (id, client_id, policy_id, flow_variant_id, start_time, end_time, outcome) VALUES
-- Recent sessions (last 7 days) - 5 retained, 3 cancelled
('sess0001-0001-0001-0001-000000000001', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', 'retained'),
('sess0002-0002-0002-0002-000000000002', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes', 'cancelled'),
('sess0003-0003-0003-0003-000000000003', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '12 minutes', 'retained'),
('sess0004-0004-0004-0004-000000000004', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '5 minutes', 'cancelled'),
('sess0005-0005-0005-0005-000000000005', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '20 minutes', 'retained'),
('sess0006-0006-0006-0006-000000000006', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', 'retained'),
('sess0007-0007-0007-0007-000000000007', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '7 minutes', 'retained'),
('sess0008-0008-0008-0008-000000000008', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '18 minutes', 'cancelled'),

-- Older sessions (30+ days ago) for monthly trends
('sess0009-0009-0009-0009-000000000009', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '25 minutes', 'retained'),
('sess0010-0010-0010-0010-000000000010', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '14 minutes', 'retained'),
('sess0011-0011-0011-0011-000000000011', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '9 minutes', 'cancelled'),
('sess0012-0012-0012-0012-000000000012', '7de207f9-6125-41f6-8247-9c5f2f98c856', '6b521cb9-4756-42b6-9eae-0421e419866e', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '22 minutes', 'retained');

-- Create interaction events for these sessions
INSERT INTO interaction_events (session_id, step_id, event_type, event_data, timestamp) VALUES
-- Events for retained sessions (showing offer acceptance)
('sess0001-0001-0001-0001-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 6}'::jsonb, NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
('sess0003-0003-0003-0003-000000000003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 6}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '8 minutes'),
('sess0005-0005-0005-0005-000000000005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 6}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '15 minutes'),
('sess0006-0006-0006-0006-000000000006', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 6}'::jsonb, NOW() - INTERVAL '6 days' + INTERVAL '7 minutes'),
('sess0007-0007-0007-0007-000000000007', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 6}'::jsonb, NOW() - INTERVAL '7 days' + INTERVAL '5 minutes'),

-- Events for cancelled sessions (showing offer declined)
('sess0002-0002-0002-0002-000000000002', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_declined', '{}'::jsonb, NOW() - INTERVAL '2 days' + INTERVAL '6 minutes'),
('sess0004-0004-0004-0004-000000000004', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_declined', '{}'::jsonb, NOW() - INTERVAL '4 days' + INTERVAL '3 minutes'),
('sess0008-0008-0008-0008-000000000008', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'offer_declined', '{}'::jsonb, NOW() - INTERVAL '8 days' + INTERVAL '12 minutes'),

-- Step completion events
('sess0001-0001-0001-0001-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'step_completed', '{"reason": "Too expensive"}'::jsonb, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
('sess0002-0002-0002-0002-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'step_completed', '{"reason": "Not useful"}'::jsonb, NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
('sess0003-0003-0003-0003-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'step_completed', '{"reason": "Found alternative"}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '4 minutes');

-- Also move the client user to the admin's organization so they can see each other's data
UPDATE profiles 
SET organization_id = '42e5915f-acaf-4164-abbb-0804704892d4'
WHERE id = '48106843-7bd4-43a7-8ea0-5a448d1218dd';

-- Update the client's policy to be for admin's organization products
-- First create a product for the admin's organization
INSERT INTO products (id, organization_id, name, description)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '42e5915f-acaf-4164-abbb-0804704892d4',
  'Premium Insurance Package',
  'Comprehensive insurance package with full coverage'
);

-- Update the client policy to use this product
UPDATE client_policies 
SET product_id = '11111111-1111-1111-1111-111111111111'
WHERE client_id = '48106843-7bd4-43a7-8ea0-5a448d1218dd';