-- Add missing step components to fix foreign key constraint errors
INSERT INTO public.step_components (component_name, description, default_config_schema) VALUES
('CallbackScheduler', 'Schedule support calls', '{
  "title": "Schedule a Call",
  "description": "Talk to our team before cancelling",
  "timeSlots": [
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM", 
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM"
  ]
}'::jsonb),
('ServiceUpgrade', 'Offer premium plans', '{
  "title": "Upgrade Your Plan",
  "description": "Get more value with premium features",
  "upgrades": [
    {
      "name": "Premium Plan",
      "price": "29.99",
      "features": ["Extra coverage", "24/7 support", "Premium benefits"]
    }
  ]
}'::jsonb),
('LoyaltyReward', 'Special offers for loyal customers', '{
  "title": "Loyalty Reward",
  "description": "Thank you for being a valued customer",
  "rewards": [
    {
      "type": "discount", 
      "value": "25% off next year",
      "description": "Special loyalty discount"
    }
  ]
}'::jsonb),
('CompletionSummary', 'Show completion summary', '{
  "title": "Process Complete",
  "description": "Summary of your choices"
}'::jsonb);