import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Table, BarChart3, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExportControlsProps {
  timeRange: string;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ timeRange }) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<string>('csv');
  const [exportType, setExportType] = useState<string>('summary');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch data based on timeRange
      const startDate = getDateFilter();
      
      const { data: sessions, error } = await supabase
        .from('flow_sessions')
        .select(`
          *,
          flow_variants (
            name,
            flow_id,
            cancellation_flows (name)
          ),
          interaction_events (*)
        `)
        .gte('created_at', startDate);

      if (error) throw error;

      // Generate export data based on type
      let exportData: any[] = [];
      let filename = '';

      switch (exportType) {
        case 'summary':
          exportData = generateSummaryReport(sessions || []);
          filename = `retention-summary-${timeRange}`;
          break;
        case 'sessions':
          exportData = generateSessionsReport(sessions || []);
          filename = `sessions-detail-${timeRange}`;
          break;
        case 'flows':
          exportData = generateFlowsReport(sessions || []);
          filename = `flow-performance-${timeRange}`;
          break;
        case 'events':
          exportData = generateEventsReport(sessions || []);
          filename = `interaction-events-${timeRange}`;
          break;
      }

      // Export based on format
      if (exportFormat === 'csv') {
        downloadCSV(exportData, filename);
      } else if (exportFormat === 'json') {
        downloadJSON(exportData, filename);
      } else if (exportFormat === 'pdf') {
        await generatePDFReport(exportData, filename);
      }

      toast({
        title: "Export successful",
        description: `${exportType} report exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  };

  const generateSummaryReport = (sessions: any[]) => {
    const totalSessions = sessions.length;
    const retainedSessions = sessions.filter(s => s.outcome === 'retained').length;
    const retentionRate = totalSessions > 0 ? (retainedSessions / totalSessions) * 100 : 0;

    return [{
      metric: 'Summary Report',
      total_sessions: totalSessions,
      retained_sessions: retainedSessions,
      retention_rate: `${retentionRate.toFixed(2)}%`,
      time_period: timeRange,
      generated_at: new Date().toISOString()
    }];
  };

  const generateSessionsReport = (sessions: any[]) => {
    return sessions.map(session => ({
      session_id: session.id,
      start_time: session.start_time,
      end_time: session.end_time,
      outcome: session.outcome,
      flow_name: session.flow_variants?.cancellation_flows?.name || 'Unknown',
      variant_name: session.flow_variants?.name || 'Unknown',
      interaction_count: session.interaction_events?.length || 0,
      duration_minutes: session.end_time 
        ? Math.round((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000)
        : null
    }));
  };

  const generateFlowsReport = (sessions: any[]) => {
    const flowGroups = sessions.reduce((acc, session) => {
      const flowName = session.flow_variants?.cancellation_flows?.name || 'Unknown Flow';
      if (!acc[flowName]) {
        acc[flowName] = { sessions: 0, retained: 0 };
      }
      acc[flowName].sessions++;
      if (session.outcome === 'retained') {
        acc[flowName].retained++;
      }
      return acc;
    }, {} as Record<string, { sessions: number; retained: number }>);

    return Object.entries(flowGroups).map(([flowName, data]: [string, { sessions: number; retained: number }]) => ({
      flow_name: flowName,
      total_sessions: data.sessions,
      retained_sessions: data.retained,
      retention_rate: `${data.sessions > 0 ? ((data.retained / data.sessions) * 100).toFixed(2) : 0}%`
    }));
  };

  const generateEventsReport = (sessions: any[]) => {
    const events: any[] = [];
    sessions.forEach(session => {
      session.interaction_events?.forEach((event: any) => {
        events.push({
          session_id: session.id,
          event_type: event.event_type,
          event_data: JSON.stringify(event.event_data || {}),
          timestamp: event.timestamp,
          flow_name: session.flow_variants?.cancellation_flows?.name || 'Unknown'
        });
      });
    });
    return events;
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generatePDFReport = async (data: any[], filename: string) => {
    // This would require a PDF generation library like jsPDF
    // For now, we'll just download as JSON with a message
    toast({
      title: "PDF Export",
      description: "PDF export would require additional setup. Downloading as JSON instead.",
    });
    downloadJSON(data, filename);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Analytics
        </CardTitle>
        <CardDescription>Download analytics data in various formats for further analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Type</label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary Report</SelectItem>
                <SelectItem value="sessions">Detailed Sessions</SelectItem>
                <SelectItem value="flows">Flow Performance</SelectItem>
                <SelectItem value="events">Interaction Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {timeRange === '7d' ? 'Last 7 days' : timeRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
          </Badge>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? 'Exporting...' : `Export ${exportType} as ${exportFormat.toUpperCase()}`}
        </Button>
      </CardContent>
    </Card>
  );
};