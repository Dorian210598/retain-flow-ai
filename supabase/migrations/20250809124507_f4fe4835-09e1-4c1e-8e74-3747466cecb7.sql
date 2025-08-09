-- Create a demo policy for the client user that just signed up
-- First, get the demo product ID
DO $$
DECLARE
    demo_product_id UUID;
    demo_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    -- Get the demo product
    SELECT id INTO demo_product_id FROM public.products WHERE organization_id = demo_org_id LIMIT 1;
    
    -- Create a policy for the client user
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
        '48106843-7bd4-43a7-8ea0-5a448d1218dd', -- The client user ID from the network logs
        demo_product_id,
        'POL-DEMO-' || EXTRACT(EPOCH FROM NOW())::text,
        'active',
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE + INTERVAL '6 months',
        false,
        false
    ) ON CONFLICT DO NOTHING;
END $$;