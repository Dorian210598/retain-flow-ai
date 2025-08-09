import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Calendar, AlertTriangle } from 'lucide-react';

export const ClientDashboard = () => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">My Insurance Policy</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.full_name}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                    <p className="text-lg font-semibold">POL-DEMO-001</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product</label>
                    <p className="text-lg font-semibold">Auto Insurance Comprehensive</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Renewal Date</label>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dec 31, 2024
                    </p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Coverage Benefits</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
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
                </CardTitle>
                <CardDescription>
                  Need to cancel your insurance policy?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We understand that circumstances change. Before you cancel, let us help you explore your options.
                </p>
                <Button variant="destructive" className="w-full">
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
                    <span className="text-muted-foreground">Jan 1, 2024</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Payment processed</span>
                    <span className="text-muted-foreground">Jan 1, 2024</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};