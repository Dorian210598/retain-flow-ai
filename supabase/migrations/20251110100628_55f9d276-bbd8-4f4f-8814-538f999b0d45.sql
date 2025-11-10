
-- Move Dorian Tester to DAdmin organization
UPDATE profiles 
SET organization_id = 'f8dd7ac8-7b9f-433b-92f7-73554032db93'
WHERE id = '3929a6a7-b4c8-4fde-950c-0b43a484128c';

-- Activate Premium Ret flow
UPDATE cancellation_flows
SET is_active = true
WHERE id = '188c8f80-c259-445d-a007-590bb43dd36b';
