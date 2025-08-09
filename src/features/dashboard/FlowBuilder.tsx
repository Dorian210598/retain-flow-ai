import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Settings, Play, Pause, ArrowLeft } from 'lucide-react';

interface FlowBuilderProps {
  onBack?: () => void;
}

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ onBack }) => {
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
                <h1 className="text-2xl font-bold">Flow Builder</h1>
                <p className="text-muted-foreground">Create and manage cancellation flows</p>
              </div>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Flow
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Flows */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Active Flows</CardTitle>
                <CardDescription>Manage your current cancellation flows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border border-green-200 bg-green-50/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-green-800">Demo Retention Flow</h3>
                        <p className="text-sm text-green-600 mt-1">3 steps: Survey → Discount → Confirmation</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                          <span>✅ Active</span>
                          <span>📊 100% traffic</span>
                          <span>📈 0 sessions</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center py-8 text-muted-foreground">
                    <p>This is your only active flow.</p>
                    <Button variant="outline" className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Another Flow
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Flow
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Flow Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Play className="h-4 w-4 mr-2" />
                  Test Flow
                </Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Available Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Feedback Survey</h4>
                  <p className="text-xs text-muted-foreground">Collect cancellation reasons</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Discount Offer</h4>
                  <p className="text-xs text-muted-foreground">Present retention offers</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium">Final Confirmation</h4>
                  <p className="text-xs text-muted-foreground">Confirm cancellation</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};