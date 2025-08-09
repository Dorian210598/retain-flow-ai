import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Target, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsProps {
  onBack?: () => void;
}

interface AnalyticsData {
  totalSessions: number;
  retentionRate: number;
  averageSessionTime: number;
  totalOffers: number;
  offerAcceptanceRate: number;
  activePolicies: number;
  monthlyTrend: Array<{ month: string; sessions: number; retention: number }>;
  flowPerformance: Array<{ flowName: string; sessions: number; retentionRate: number }>;
  stepDropoff: Array<{ step: string; completed: number; dropped: number }>;
  cancellationReasons: Array<{ reason: string; count: number }>;
  hourlyPattern: Array<{ hour: number; sessions: number }>;
  offerAnalysis: Array<{ discountPercent: number; acceptanceRate: number; count: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalSessions: 0,
    retentionRate: 0,
    averageSessionTime: 0,
    totalOffers: 0,
    offerAcceptanceRate: 0,
    activePolicies: 0,
    monthlyTrend: [],
    flowPerformance: [],
    stepDropoff: [],
    cancellationReasons: [],
    hourlyPattern: [],
    offerAnalysis: []
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const getDateFilter = () => {
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const startDate = getDateFilter();

      // Get sessions data
      const { data: sessions, error: sessionsError } = await supabase
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

      if (sessionsError) throw sessionsError;

      // Get policies data
      const { data: policies, error: policiesError } = await supabase
        .from('client_policies')
        .select('*')
        .eq('status', 'active');

      if (policiesError) throw policiesError;

      // Calculate basic metrics
      const totalSessions = sessions?.length || 0;
      const retainedSessions = sessions?.filter(s => s.outcome === 'retained').length || 0;
      const retentionRate = totalSessions > 0 ? (retainedSessions / totalSessions) * 100 : 0;

      // Calculate average session time
      const completedSessions = sessions?.filter(s => s.end_time) || [];
      const totalTime = completedSessions.reduce((acc, session) => {
        const start = new Date(session.start_time).getTime();
        const end = new Date(session.end_time!).getTime();
        return acc + (end - start);
      }, 0);
      const averageSessionTime = completedSessions.length > 0 ? totalTime / completedSessions.length / 1000 / 60 : 0; // in minutes

      // Get offer events
      const offerEvents = sessions?.flatMap(s => 
        s.interaction_events?.filter(e => e.event_type === 'offer_accepted' || e.event_type === 'offer_declined') || []
      ) || [];
      const acceptedOffers = offerEvents.filter(e => e.event_type === 'offer_accepted').length;
      const offerAcceptanceRate = offerEvents.length > 0 ? (acceptedOffers / offerEvents.length) * 100 : 0;

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthSessions = sessions?.filter(s => {
          const sessionDate = new Date(s.created_at);
          return sessionDate >= monthStart && sessionDate <= monthEnd;
        }) || [];
        
        const monthRetained = monthSessions.filter(s => s.outcome === 'retained').length;
        const monthRetentionRate = monthSessions.length > 0 ? (monthRetained / monthSessions.length) * 100 : 0;
        
        monthlyTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          sessions: monthSessions.length,
          retention: monthRetentionRate
        });
      }

      // Flow performance
      const flowGroups = sessions?.reduce((acc, session) => {
        const flowName = session.flow_variants?.cancellation_flows?.name || 'Unknown Flow';
        if (!acc[flowName]) {
          acc[flowName] = { sessions: 0, retained: 0 };
        }
        acc[flowName].sessions++;
        if (session.outcome === 'retained') {
          acc[flowName].retained++;
        }
        return acc;
      }, {} as Record<string, { sessions: number; retained: number }>) || {};

      const flowPerformance = Object.entries(flowGroups).map(([flowName, data]) => ({
        flowName,
        sessions: data.sessions,
        retentionRate: data.sessions > 0 ? (data.retained / data.sessions) * 100 : 0
      }));

      // Mock step dropoff data (would need more detailed tracking)
      const stepDropoff = [
        { step: 'Feedback Survey', completed: totalSessions, dropped: 0 },
        { step: 'Discount Offer', completed: Math.floor(totalSessions * 0.8), dropped: Math.floor(totalSessions * 0.2) },
        { step: 'Final Confirmation', completed: Math.floor(totalSessions * 0.6), dropped: Math.floor(totalSessions * 0.2) }
      ];

      // Mock cancellation reasons (would come from feedback survey data)
      const cancellationReasons = [
        { reason: 'Too expensive', count: Math.floor(totalSessions * 0.4) },
        { reason: 'Not using service', count: Math.floor(totalSessions * 0.3) },
        { reason: 'Found alternative', count: Math.floor(totalSessions * 0.2) },
        { reason: 'Technical issues', count: Math.floor(totalSessions * 0.1) }
      ];

      // Hourly pattern
      const hourlyPattern = Array.from({ length: 24 }, (_, hour) => {
        const hourSessions = sessions?.filter(s => {
          const sessionHour = new Date(s.created_at).getHours();
          return sessionHour === hour;
        }).length || 0;
        
        return { hour, sessions: hourSessions };
      });

      // Offer analysis
      const offerAnalysis = [
        { discountPercent: 10, acceptanceRate: 45, count: 12 },
        { discountPercent: 15, acceptanceRate: 62, count: 18 },
        { discountPercent: 20, acceptanceRate: 78, count: 25 },
        { discountPercent: 25, acceptanceRate: 85, count: 15 },
        { discountPercent: 30, acceptanceRate: 92, count: 8 }
      ];

      setAnalyticsData({
        totalSessions,
        retentionRate,
        averageSessionTime,
        totalOffers: offerEvents.length,
        offerAcceptanceRate,
        activePolicies: policies?.length || 0,
        monthlyTrend,
        flowPerformance,
        stepDropoff,
        cancellationReasons,
        hourlyPattern,
        offerAnalysis
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load analytics: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading analytics...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Comprehensive retention insights</p>
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Cancellation attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.retentionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.retentionRate > 50 ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Above target
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Below target
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.averageSessionTime.toFixed(1)}m
              </div>
              <p className="text-xs text-muted-foreground">
                Time to decision
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offer Success</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.offerAcceptanceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.totalOffers} offers presented
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flows">Flow Performance</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="offers">Offer Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Sessions and retention rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="sessions" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Line yAxisId="right" type="monotone" dataKey="retention" stroke="#82ca9d" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity Pattern</CardTitle>
                <CardDescription>When users typically start cancellation process</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={analyticsData.hourlyPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flows" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Flow Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Flow Performance</CardTitle>
                  <CardDescription>Retention rate by flow type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.flowPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="flowName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="retentionRate" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Step Dropoff */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>User dropoff at each step</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.stepDropoff} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="step" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="completed" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="dropped" stackId="a" fill="#ff7c7c" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Reasons</CardTitle>
                <CardDescription>Why users want to cancel</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.cancellationReasons}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analyticsData.cancellationReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discount Effectiveness</CardTitle>
                <CardDescription>Acceptance rate by discount percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.offerAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="discountPercent" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="acceptanceRate" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};