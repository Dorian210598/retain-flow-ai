import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Filter, Eye, Edit, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClientManagementProps {
  onBack?: () => void;
}

interface Client {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  policies: ClientPolicy[];
  sessions: FlowSession[];
}

interface ClientPolicy {
  id: string;
  policy_number: string;
  status: string; // Changed from union type to string
  start_date: string;
  renewal_date: string;
  has_active_claim: boolean;
  has_cfar_benefit: boolean;
  products?: {
    name: string;
    description: string;
  };
}

interface FlowSession {
  id: string;
  start_time: string;
  end_time: string | null;
  outcome: 'retained' | 'cancelled' | null;
  flow_variants?: {
    name: string;
    cancellation_flows?: {
      name: string;
    };
  };
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter, riskFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);

      // Get all client profiles with their policies and sessions
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          client_policies (
            *,
            products (name, description)
          )
        `)
        .eq('role', 'client');

      if (profilesError) throw profilesError;

      // Get flow sessions for each client
      const clientIds = profiles?.map(p => p.id) || [];
      const { data: sessions, error: sessionsError } = await supabase
        .from('flow_sessions')
        .select(`
          *,
          flow_variants (
            name,
            cancellation_flows (name)
          )
        `)
        .in('client_id', clientIds);

      if (sessionsError) throw sessionsError;

      // Combine data
      const clientsWithData: Client[] = profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        policies: profile.client_policies || [],
        sessions: sessions?.filter(s => s.client_id === profile.id) || []
      })) || [];

      setClients(clientsWithData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load clients: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.policies.some(p => p.policy_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client =>
        client.policies.some(p => p.status === statusFilter)
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(client => {
        const riskLevel = calculateRiskLevel(client);
        return riskLevel === riskFilter;
      });
    }

    setFilteredClients(filtered);
  };

  const calculateRiskLevel = (client: Client): 'low' | 'medium' | 'high' => {
    const recentSessions = client.sessions.filter(s => {
      const sessionDate = new Date(s.start_time);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return sessionDate > thirtyDaysAgo;
    });

    const hasActiveClaim = client.policies.some(p => p.has_active_claim);
    const hasRecentCancellationAttempt = recentSessions.length > 0;
    const hasFailedRetention = recentSessions.some(s => s.outcome === 'cancelled');

    if (hasFailedRetention || (hasActiveClaim && hasRecentCancellationAttempt)) {
      return 'high';
    } else if (hasRecentCancellationAttempt || hasActiveClaim) {
      return 'medium';
    }
    return 'low';
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Medium Risk</Badge>;
      case 'low':
        return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />Low Risk</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading clients...</div>;
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
                <h1 className="text-2xl font-bold">Client Management</h1>
                <p className="text-muted-foreground">Manage clients and their policies</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {clients.reduce((acc, client) => acc + client.policies.filter(p => p.status === 'active').length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High Risk Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {clients.filter(client => calculateRiskLevel(client) === 'high').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.reduce((acc, client) => {
                  const recentSessions = client.sessions.filter(s => {
                    const sessionDate = new Date(s.start_time);
                    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return sessionDate > sevenDaysAgo;
                  });
                  return acc + recentSessions.length;
                }, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Client Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients or policy numbers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Policy Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Client Table */}
        <Card>
          <CardHeader>
            <CardTitle>Clients ({filteredClients.length})</CardTitle>
            <CardDescription>Comprehensive view of all clients and their policies</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Policies</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Recent Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const riskLevel = calculateRiskLevel(client);
                  const activePolicies = client.policies.filter(p => p.status === 'active');
                  const recentSessions = client.sessions.filter(s => {
                    const sessionDate = new Date(s.start_time);
                    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                    return sessionDate > thirtyDaysAgo;
                  });

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {client.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-medium">{client.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              Member since {new Date(client.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{activePolicies.length} active</div>
                          {activePolicies.slice(0, 2).map(policy => (
                            <div key={policy.id} className="text-sm text-muted-foreground">
                              {policy.policy_number} - {getStatusBadge(policy.status)}
                            </div>
                          ))}
                          {activePolicies.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{activePolicies.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getRiskBadge(riskLevel)}
                      </TableCell>
                      <TableCell>
                        {recentSessions.length > 0 ? (
                          <div className="text-sm">
                            <div>{recentSessions.length} session(s)</div>
                            <div className="text-muted-foreground">
                              Last: {new Date(recentSessions[0].start_time).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No recent activity</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Client Details: {client.full_name}</DialogTitle>
                              <DialogDescription>
                                Comprehensive view of client policies and session history
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedClient && (
                              <div className="space-y-6">
                                {/* Client Info */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Client Information</h4>
                                    <div className="space-y-1 text-sm">
                                      <div>Name: {selectedClient.full_name}</div>
                                      <div>Member since: {new Date(selectedClient.created_at).toLocaleDateString()}</div>
                                      <div>Risk Level: {getRiskBadge(calculateRiskLevel(selectedClient))}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* Policies */}
                                <div>
                                  <h4 className="font-semibold mb-3">Policies ({selectedClient.policies.length})</h4>
                                  <div className="space-y-2">
                                    {selectedClient.policies.map(policy => (
                                      <div key={policy.id} className="border rounded-lg p-3">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <div className="font-medium">{policy.policy_number}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {policy.products?.name} - {policy.products?.description}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                              Start: {new Date(policy.start_date).toLocaleDateString()} | 
                                              Renewal: {new Date(policy.renewal_date).toLocaleDateString()}
                                            </div>
                                          </div>
                                          <div className="flex flex-col gap-1">
                                            {getStatusBadge(policy.status)}
                                            {policy.has_active_claim && (
                                              <Badge variant="destructive" className="text-xs">Active Claim</Badge>
                                            )}
                                            {policy.has_cfar_benefit && (
                                              <Badge variant="outline" className="text-xs">CFAR</Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Sessions */}
                                <div>
                                  <h4 className="font-semibold mb-3">Session History ({selectedClient.sessions.length})</h4>
                                  <div className="space-y-2">
                                    {selectedClient.sessions.length > 0 ? (
                                      selectedClient.sessions.map(session => (
                                        <div key={session.id} className="border rounded-lg p-3">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <div className="text-sm font-medium">
                                                {session.flow_variants?.cancellation_flows?.name || 'Unknown Flow'}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                Started: {new Date(session.start_time).toLocaleString()}
                                              </div>
                                              {session.end_time && (
                                                <div className="text-sm text-muted-foreground">
                                                  Ended: {new Date(session.end_time).toLocaleString()}
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                              {session.outcome === 'retained' && (
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                  <CheckCircle className="h-3 w-3 mr-1" />Retained
                                                </Badge>
                                              )}
                                              {session.outcome === 'cancelled' && (
                                                <Badge variant="destructive">
                                                  <XCircle className="h-3 w-3 mr-1" />Cancelled
                                                </Badge>
                                              )}
                                              {!session.outcome && (
                                                <Badge variant="secondary">
                                                  <Clock className="h-3 w-3 mr-1" />In Progress
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-4 text-muted-foreground">
                                        No cancellation sessions recorded
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};