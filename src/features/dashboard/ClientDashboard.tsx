import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOwlGuide } from '@/components/OwlGuideProvider';
import { Shield, Calendar, AlertTriangle, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FlowRenderer } from '@/features/cancellation-flow-renderer/components/FlowRenderer';

interface ClientPolicy {
  id: string;
  policy_number: string;
  status: string;
  start_date: string;
  renewal_date: string;
  has_active_claim: boolean;
  has_cfar_benefit: boolean;
  product: {
    name: string;
    description: string;
  };
}

export const ClientDashboard = () => {
  const { profile, signOut } = useAuth();
  const { showOwlMessage } = useOwlGuide();
  const [policy, setPolicy] = useState<ClientPolicy | null>(null);
  const [showCancellation, setShowCancellation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadClientPolicy();
    }
  }, [profile?.id]);

  const loadClientPolicy = async () => {
    if (!profile?.id) {
      console.log('No profile ID available yet');
      return;
    }

    console.log('Loading policy for user:', profile.id);
    try {
      const { data, error } = await supabase
        .from('client_policies')
        .select(`
          *,
          products (
            name,
            description
          )
        `)
        .eq('client_id', profile?.id)
        .eq('status', 'active')
        .maybeSingle();

      console.log('Query result:', data);
      if (error) {
        console.error('Error loading policy:', error);
      } else {
        setPolicy(data ? {
          ...data,
          product: data.products
        } : null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCancellation = () => {
    if (policy) {
      setShowCancellation(true);
    }
  };

  const handleBackToDashboard = () => {
    setShowCancellation(false);
  };

  if (showCancellation && policy) {
    return <FlowRenderer policyId={policy.id} onBackToDashboard={handleBackToDashboard} />;
  }

  // Show welcome message only once
  useEffect(() => {
    if (!loading && policy) {
      const timer = setTimeout(() => {
        showOwlMessage({
          message: "To jest panel klienta z przykładową polisą. Kliknij 'Start Cancellation Process' aby rozpocząć badanie! 📋",
          position: 'bottom-right',
          autoClose: true,
          delay: 5000
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, policy, showOwlMessage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold">My Insurance Policy</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-5 h-5 cursor-help text-muted-foreground hover:text-primary ml-2" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>To w badaniu symulujemy przykładową polisę ubezpieczeniową. Kliknij "Start Cancellation Process", aby przejść przez proces anulowania i zobaczyć różne strategie retencji.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!policy ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No Active Policy Found</h2>
            <p className="text-muted-foreground">You don't have any active insurance policies.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Policy Overview
                  </CardTitle>
                  <CardDescription>Your current insurance policy details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Policy Number</label>
                      <p className="text-lg font-semibold">{policy.policy_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product</label>
                      <p className="text-lg font-semibold">{policy.product.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Renewal Date</label>
                      <p className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(policy.renewal_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Coverage Benefits</h4>
                    <p className="text-sm text-muted-foreground">{policy.product.description}</p>
                    <ul className="space-y-1 text-sm text-muted-foreground mt-2">
                      <li>• Full comprehensive coverage</li>
                      <li>• 24/7 roadside assistance</li>
                      <li>• No claim limits</li>
                      <li>• Collision and theft protection</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Cancel Policy
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-primary ml-1" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p>To jest główny element badania - przycisk inicjujący proces anulowania polisy. Po kliknięciu przejdziesz przez różne etapy, które mogą zawierać oferty specjalne, ankiety czy propozycje rozmów.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  <CardDescription>
                    Need to cancel your insurance policy?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    We understand that circumstances change. Before you cancel, let us help you explore your options.
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleStartCancellation}
                  >
                    Start Cancellation Process
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Policy activated</span>
                      <span className="text-muted-foreground">{new Date(policy.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Payment processed</span>
                      <span className="text-muted-foreground">{new Date(policy.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};