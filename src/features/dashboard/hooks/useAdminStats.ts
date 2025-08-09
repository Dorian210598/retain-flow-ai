import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AdminStats {
  activeFlows: number;
  totalSessions: number;
  retentionRate: number;
  totalClients: number;
  loading: boolean;
}

export const useAdminStats = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    activeFlows: 0,
    totalSessions: 0,
    retentionRate: 0,
    totalClients: 0,
    loading: true
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadStats();
    }
  }, [profile]);

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Fetch active flows
      const { data: activeFlows, error: flowError } = await supabase
        .from('cancellation_flows')
        .select('id')
        .eq('is_active', true);

      if (flowError) throw flowError;

      // Fetch all sessions for clients in this organization
      const { data: sessions, error: sessionError } = await supabase
        .from('flow_sessions')
        .select('id, outcome, client_id');

      if (sessionError) throw sessionError;

      // Fetch total clients in organization
      const { data: clients, error: clientError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'client');

      if (clientError) throw clientError;

      // Calculate retention rate
      const completedSessions = sessions?.filter(s => s.outcome !== null) || [];
      const retainedSessions = completedSessions.filter(s => s.outcome === 'retained');
      const retentionRate = completedSessions.length > 0 
        ? Math.round((retainedSessions.length / completedSessions.length) * 100) 
        : 0;

      setStats({
        activeFlows: activeFlows?.length || 0,
        totalSessions: sessions?.length || 0,
        retentionRate,
        totalClients: clients?.length || 0,
        loading: false
      });

    } catch (error) {
      console.error('Error loading admin stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  return { stats, refreshStats: loadStats };
};