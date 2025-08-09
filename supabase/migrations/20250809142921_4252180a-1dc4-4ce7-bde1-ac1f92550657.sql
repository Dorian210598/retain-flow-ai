-- Expand interaction_events table to support session recording
-- Add additional fields to event_data JSONB for session tracking

-- First, let's see the current structure
-- ALTER TABLE interaction_events ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}';

-- The event_data JSONB will now support additional fields:
-- {
--   "mouse_position": {"x": 100, "y": 200},
--   "viewport": {"width": 1920, "height": 1080},
--   "element_selector": "button.primary",
--   "time_on_element": 2500,
--   "scroll_position": {"x": 0, "y": 150},
--   "element_text": "Click me",
--   "page_url": "/dashboard",
--   "session_duration": 30000
-- }

-- Add indexes for better performance on session replay queries
CREATE INDEX IF NOT EXISTS idx_interaction_events_session_timeline 
ON interaction_events (session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_interaction_events_event_data_mouse 
ON interaction_events USING GIN (event_data) 
WHERE event_data ? 'mouse_position';

-- Add a function to get session replay data
CREATE OR REPLACE FUNCTION public.get_session_replay_data(session_uuid UUID)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  timestamp TIMESTAMPTZ,
  event_data JSONB,
  step_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    ie.id as event_id,
    ie.event_type,
    ie.timestamp,
    ie.event_data,
    fs.step_name
  FROM interaction_events ie
  LEFT JOIN flow_steps fs ON ie.step_id = fs.id
  WHERE ie.session_id = session_uuid
  ORDER BY ie.timestamp ASC;
$$;