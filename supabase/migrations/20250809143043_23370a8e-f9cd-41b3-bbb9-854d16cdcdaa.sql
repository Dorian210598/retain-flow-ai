-- Add indexes for better performance on session replay queries
CREATE INDEX IF NOT EXISTS idx_interaction_events_session_timeline 
ON interaction_events (session_id, "timestamp");

CREATE INDEX IF NOT EXISTS idx_interaction_events_event_data_mouse 
ON interaction_events USING GIN (event_data) 
WHERE event_data ? 'mouse_position';

-- Add a function to get session replay data
CREATE OR REPLACE FUNCTION public.get_session_replay_data(session_uuid UUID)
RETURNS TABLE (
  event_id UUID,
  event_type TEXT,
  event_timestamp TIMESTAMPTZ,
  event_data JSONB,
  component_name TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    ie.id as event_id,
    ie.event_type,
    ie.timestamp as event_timestamp,
    ie.event_data,
    fs.component_name
  FROM interaction_events ie
  LEFT JOIN flow_steps fs ON ie.step_id = fs.id
  WHERE ie.session_id = session_uuid
  ORDER BY ie.timestamp ASC;
$$;