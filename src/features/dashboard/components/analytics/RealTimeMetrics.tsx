import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Eye, Clock, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeData {
  activeSessions: number;
  sessionsToday: number;
  avgResponseTime: number;
  currentRetentionRate: number;
  lastUpdated: Date;
}

export const RealTimeMetrics: React.FC = () => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    activeSessions: 0,
    sessionsToday: 0,
    avgResponseTime: 0,
    currentRetentionRate: 0,
    lastUpdated: new Date(),
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const fetchRealTimeData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's sessions
        const { data: todaySessions } = await supabase
          .from('flow_sessions')
          .select('*')
          .gte('created_at', today.toISOString());

        // Get active sessions (started but not completed)
        const { data: activeSessions } = await supabase
          .from('flow_sessions')
          .select('*')
          .is('end_time', null);

        // Calculate metrics
        const sessionsToday = todaySessions?.length || 0;
        const activeCount = activeSessions?.length || 0;
        
        const completedToday = todaySessions?.filter(s => {
          if (!s.end_time) return false;
          const duration = new Date(s.end_time).getTime() - new Date(s.start_time).getTime();
          // Only include sessions shorter than 5 minutes (real user sessions)
          return duration > 0 && duration < (5 * 60 * 1000);
        }) || [];
        
        const avgResponseTime = completedToday.length > 0 
          ? completedToday.reduce((acc, session) => {
              const start = new Date(session.start_time).getTime();
              const end = new Date(session.end_time!).getTime();
              return acc + (end - start);
            }, 0) / completedToday.length / 1000 // in seconds
          : 0;

        const retainedToday = todaySessions?.filter(s => s.outcome === 'retained').length || 0;
        const currentRetentionRate = sessionsToday > 0 ? (retainedToday / sessionsToday) * 100 : 0;

        setRealTimeData({
          activeSessions: activeCount,
          sessionsToday,
          avgResponseTime,
          currentRetentionRate,
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      }
    };

    // Initial fetch
    fetchRealTimeData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-Time Metrics</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-muted-foreground">
            Live • Updated {realTimeData.lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {realTimeData.activeSessions}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {realTimeData.sessionsToday}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Since midnight
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {realTimeData.avgResponseTime < 60 ? `${realTimeData.avgResponseTime.toFixed(1)}s` : `${(realTimeData.avgResponseTime / 60).toFixed(1)}m`}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Average completion time
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Retention</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {realTimeData.currentRetentionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Today's rate
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};