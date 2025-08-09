import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, RotateCcw, MousePointer, Clock, Target } from 'lucide-react';

interface SessionEvent {
  event_id: string;
  event_type: string;
  event_timestamp: string;
  event_data: any;
  component_name?: string;
}

interface Session {
  id: string;
  start_time: string;
  end_time?: string;
  client_id: string;
  outcome?: string;
}

interface SessionReplayProps {
  onBack?: () => void;
}

export const SessionReplay = ({ onBack }: SessionReplayProps) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Fetch available sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await supabase
          .from('flow_sessions')
          .select('id, start_time, end_time, client_id, outcome')
          .order('start_time', { ascending: false })
          .limit(20);

        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fetch events for selected session
  useEffect(() => {
    if (!selectedSession) return;

    const fetchEvents = async () => {
      try {
        const { data } = await supabase.rpc('get_session_replay_data', {
          session_uuid: selectedSession
        });

        setEvents(data || []);
        setCurrentEventIndex(0);
      } catch (error) {
        console.error('Error fetching session events:', error);
      }
    };

    fetchEvents();
  }, [selectedSession]);

  // Playback controller
  useEffect(() => {
    if (!isPlaying || currentEventIndex >= events.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentEventIndex(prev => prev + 1);
    }, 1000 / playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, events.length, playbackSpeed]);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setCurrentEventIndex(0);
    setIsPlaying(false);
  };

  const renderMousePath = () => {
    const mouseEvents = events
      .slice(0, currentEventIndex + 1)
      .filter(e => e.event_type === 'mouse_move' && e.event_data?.mouse_position);

    console.log('🖱️ Rendering mouse path with events:', mouseEvents.length);

    if (mouseEvents.length === 0) return (
      <div className="text-center text-muted-foreground py-8">
        No mouse movement data recorded
      </div>
    );

    return (
      <div className="relative w-full h-64 bg-muted/20 border rounded-lg overflow-hidden">
        <div className="absolute inset-0">
          {mouseEvents.map((event, index) => {
            const pos = event.event_data.mouse_position;
            const opacity = Math.max(0.1, (index + 1) / mouseEvents.length);
            
            return (
              <div
                key={event.event_id}
                className="absolute w-2 h-2 bg-primary rounded-full"
                style={{
                  left: `${(pos.x / 1920) * 100}%`,
                  top: `${(pos.y / 1080) * 100}%`,
                  opacity,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            );
          })}
        </div>
        
        {/* Current mouse position */}
        {events[currentEventIndex]?.event_data?.mouse_position && (
          <div
            className="absolute w-4 h-4 bg-primary border-2 border-background rounded-full"
            style={{
              left: `${(events[currentEventIndex].event_data.mouse_position.x / 1920) * 100}%`,
              top: `${(events[currentEventIndex].event_data.mouse_position.y / 1080) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <MousePointer className="w-3 h-3 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  };

  const renderEventTimeline = () => {
    const visibleEvents = events.slice(Math.max(0, currentEventIndex - 5), currentEventIndex + 10);
    
    console.log('📋 Rendering timeline with events:', visibleEvents.length, 'Current index:', currentEventIndex);

    if (visibleEvents.length === 0) return (
      <div className="text-center text-muted-foreground py-8">
        No events recorded for this session
      </div>
    );

    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {visibleEvents.map((event, index) => {
          const actualIndex = Math.max(0, currentEventIndex - 5) + index;
          const isCurrent = actualIndex === currentEventIndex;
          
          return (
            <div
              key={event.event_id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isCurrent ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
              }`}
            >
              <Badge variant={isCurrent ? 'default' : 'secondary'} className="text-xs">
                {event.event_type}
              </Badge>
              
              <div className="flex-1 text-sm">
                {event.event_data?.element_selector && (
                  <span className="text-muted-foreground">
                    {event.event_data.element_selector}
                  </span>
                )}
                {event.event_data?.element_text && (
                  <span className="ml-2 text-xs">
                    "{event.event_data.element_text.slice(0, 30)}..."
                  </span>
                )}
              </div>
              
              <span className="text-xs text-muted-foreground">
                {new Date(event.event_timestamp).toLocaleTimeString()}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHeatmap = () => {
    const clickEvents = events
      .filter(e => e.event_type === 'click' && e.event_data?.mouse_position)
      .slice(0, currentEventIndex + 1);

    console.log('👆 Rendering heatmap with click events:', clickEvents.length);

    if (clickEvents.length === 0) return (
      <div className="text-center text-muted-foreground py-8">
        No click data recorded
      </div>
    );

    const heatmapData = clickEvents.reduce((acc, event) => {
      const pos = event.event_data.mouse_position;
      const key = `${Math.floor(pos.x / 50)}-${Math.floor(pos.y / 50)}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const maxClicks = Math.max(...Object.values(heatmapData), 1);

    return (
      <div className="relative w-full h-64 bg-muted/20 border rounded-lg overflow-hidden">
        {Object.entries(heatmapData).map(([key, count]) => {
          const [x, y] = key.split('-').map(Number);
          const intensity = count / maxClicks;
          
          return (
            <div
              key={key}
              className="absolute w-12 h-12 rounded-full"
              style={{
                left: `${(x * 50 / 1920) * 100}%`,
                top: `${(y * 50 / 1080) * 100}%`,
                backgroundColor: `rgba(239, 68, 68, ${intensity * 0.7})`,
                transform: 'translate(-50%, -50%)'
              }}
              title={`${count} clicks`}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button onClick={onBack} variant="outline">
          ← Back to Analytics
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Session Replay
          </CardTitle>
          <CardDescription>
            Analyze user interactions and mouse behavior patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Session Selector */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(session.start_time).toLocaleString()}
                      {session.outcome && (
                        <Badge variant="outline" className="ml-2">
                          {session.outcome}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSession && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={isPlaying ? handlePause : handlePlay}
                  variant="outline"
                  size="sm"
                  disabled={currentEventIndex >= events.length - 1}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                  </SelectContent>
                </Select>

                <span className="text-sm text-muted-foreground">
                  {currentEventIndex + 1} / {events.length} events
                </span>
              </div>
            )}
          </div>

          {selectedSession && events.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mouse Path Visualization */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Mouse Path</h3>
                {renderMousePath()}
              </div>

              {/* Click Heatmap */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Click Heatmap</h3>
                {renderHeatmap()}
              </div>

              {/* Event Timeline */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold mb-3">Event Timeline</h3>
                {renderEventTimeline()}
              </div>
            </div>
          )}

          {selectedSession && events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No interaction events recorded for this session
            </div>
          )}

          {!selectedSession && (
            <div className="text-center py-8 text-muted-foreground">
              Select a session to view the replay
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};