-- Update existing flow to admin's organization and add demo data
-- First, update the existing flow to be in admin's organization
UPDATE cancellation_flows 
SET organization_id = '42e5915f-acaf-4164-abbb-0804704892d4',
    name = 'Admin Test Retention Flow'
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Move the client to admin's organization
UPDATE profiles 
SET organization_id = '42e5915f-acaf-4164-abbb-0804704892d4'
WHERE id = '48106843-7bd4-43a7-8ea0-5a448d1218dd';

-- Create a product for the admin's organization if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products WHERE id = '11111111-1111-1111-1111-111111111111') THEN
        INSERT INTO products (id, organization_id, name, description)
        VALUES (
          '11111111-1111-1111-1111-111111111111',
          '42e5915f-acaf-4164-abbb-0804704892d4',
          'Premium Insurance Package',
          'Comprehensive insurance package with full coverage'
        );
    END IF;
END $$;

-- Update the client policy to use this product
UPDATE client_policies 
SET product_id = '11111111-1111-1111-1111-111111111111'
WHERE client_id = '48106843-7bd4-43a7-8ea0-5a448d1218dd';

-- Create demo flow sessions with different outcomes for analytics (if they don't exist)
DO $$
BEGIN
    -- Only insert if sessions don't exist
    IF NOT EXISTS (SELECT 1 FROM flow_sessions WHERE id = 'd0000001-0001-0001-0001-000000000001') THEN
        INSERT INTO flow_sessions (id, client_id, policy_id, flow_variant_id, start_time, end_time, outcome) VALUES
        -- Recent sessions (last 7 days) with mixed outcomes
        ('d0000001-0001-0001-0001-000000000001', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '15 minutes', 'retained'),
        ('d0000002-0002-0002-0002-000000000002', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes', 'cancelled'),
        ('d0000003-0003-0003-0003-000000000003', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '12 minutes', 'retained'),
        ('d0000004-0004-0004-0004-000000000004', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '5 minutes', 'cancelled'),
        ('d0000005-0005-0005-0005-000000000005', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '20 minutes', 'retained'),
        ('d0000006-0006-0006-0006-000000000006', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '10 minutes', 'retained'),
        ('d0000007-0007-0007-0007-000000000007', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '7 minutes', 'retained'),
        
        -- Older sessions for monthly trends
        ('d0000008-0008-0008-0008-000000000008', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '25 minutes', 'retained'),
        ('d0000009-0009-0009-0009-000000000009', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '14 minutes', 'retained'),
        ('d0000010-0010-0010-0010-000000000010', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '9 minutes', 'cancelled'),
        ('d0000011-0011-0011-0011-000000000011', '48106843-7bd4-43a7-8ea0-5a448d1218dd', '6b521cb9-4756-42b6-9eae-0421e419866e', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days' + INTERVAL '22 minutes', 'retained');
    END IF;
END $$;

-- Create interaction events for these demo sessions
DO $$
BEGIN
    -- Only insert if events don't exist
    IF NOT EXISTS (SELECT 1 FROM interaction_events WHERE session_id = 'd0000001-0001-0001-0001-000000000001') THEN
        INSERT INTO interaction_events (session_id, step_id, event_type, event_data, timestamp) VALUES
        -- Events for retained sessions (showing offer acceptance)
        ('d0000001-0001-0001-0001-000000000001', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 3}'::jsonb, NOW() - INTERVAL '1 day' + INTERVAL '10 minutes'),
        ('d0000003-0003-0003-0003-000000000003', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 3}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '8 minutes'),
        ('d0000005-0005-0005-0005-000000000005', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 3}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '15 minutes'),
        ('d0000006-0006-0006-0006-000000000006', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 3}'::jsonb, NOW() - INTERVAL '6 days' + INTERVAL '7 minutes'),
        ('d0000007-0007-0007-0007-000000000007', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_accepted', '{"discountPercent": 20, "discountDuration": 3}'::jsonb, NOW() - INTERVAL '7 days' + INTERVAL '5 minutes'),
        
        -- Events for cancelled sessions (showing offer declined)
        ('d0000002-0002-0002-0002-000000000002', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_declined', '{}'::jsonb, NOW() - INTERVAL '2 days' + INTERVAL '6 minutes'),
        ('d0000004-0004-0004-0004-000000000004', 'cf522f9b-4774-4b06-8f41-3086ca070dc1', 'offer_declined', '{}'::jsonb, NOW() - INTERVAL '4 days' + INTERVAL '3 minutes'),
        
        -- Step completion events
        ('d0000001-0001-0001-0001-000000000001', 'a7cc2412-b714-4c16-8c36-a2e751bead7a', 'step_completed', '{"reason": "Too expensive"}'::jsonb, NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
        ('d0000002-0002-0002-0002-000000000002', 'a7cc2412-b714-4c16-8c36-a2e751bead7a', 'step_completed', '{"reason": "Not using it enough"}'::jsonb, NOW() - INTERVAL '2 days' + INTERVAL '3 minutes'),
        ('d0000003-0003-0003-0003-000000000003', 'a7cc2412-b714-4c16-8c36-a2e751bead7a', 'step_completed', '{"reason": "Found a better deal"}'::jsonb, NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'),
        ('d0000004-0004-0004-0004-000000000004', 'a7cc2412-b714-4c16-8c36-a2e751bead7a', 'step_completed', '{"reason": "Poor customer service"}'::jsonb, NOW() - INTERVAL '4 days' + INTERVAL '2 minutes'),
        ('d0000005-0005-0005-0005-000000000005', 'a7cc2412-b714-4c16-8c36-a2e751bead7a', 'step_completed', '{"reason": "Too expensive"}'::jsonb, NOW() - INTERVAL '5 days' + INTERVAL '6 minutes');
    END IF;
END $$;