import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapData {
  hour: number;
  day: string;
  value: number;
  sessions: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getIntensity = (hour: number, day: string): { value: number; sessions: number } => {
    const entry = data.find(d => d.hour === hour && d.day === day);
    return { value: entry?.value || 0, sessions: entry?.sessions || 0 };
  };

  const maxValue = Math.max(...data.map(d => d.value));

  const getColor = (value: number): string => {
    if (value === 0) return 'bg-muted';
    
    const intensity = value / maxValue;
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900/30';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-800/50';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-700/70';
    if (intensity < 0.8) return 'bg-blue-400 dark:bg-blue-600/80';
    return 'bg-blue-500 dark:bg-blue-500/90';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>Session activity by day and hour (hover for details)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-12"></div>
            <div className="flex flex-1 gap-1">
              {[0, 6, 12, 18].map(hour => (
                <div key={hour} className="flex-1 text-xs text-center text-muted-foreground">
                  {hour}:00
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          {days.map(day => (
            <div key={day} className="flex items-center">
              <div className="w-12 text-xs text-muted-foreground font-medium">
                {day}
              </div>
              <div className="flex flex-1 gap-1">
                {hours.map(hour => {
                  const { value, sessions } = getIntensity(hour, day);
                  return (
                    <div
                      key={hour}
                      className={`flex-1 h-4 rounded-sm cursor-pointer transition-all hover:scale-110 ${getColor(value)}`}
                      title={`${day} ${hour}:00 - ${sessions} sessions (${value.toFixed(1)}% retention)`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Less activity</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted" />
              <div className="w-3 h-3 rounded-sm bg-blue-100 dark:bg-blue-900/30" />
              <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800/50" />
              <div className="w-3 h-3 rounded-sm bg-blue-300 dark:bg-blue-700/70" />
              <div className="w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-600/80" />
              <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-500/90" />
            </div>
            <span className="text-sm text-muted-foreground">More activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};