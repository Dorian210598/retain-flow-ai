import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface FunnelStep {
  step: string;
  users: number;
  dropoffRate: number;
  conversionRate: number;
  avgTimeSpent: number;
}

interface FunnelAnalysisProps {
  data: FunnelStep[];
}

export const FunnelAnalysis: React.FC<FunnelAnalysisProps> = ({ data }) => {
  const maxUsers = Math.max(...data.map(d => d.users));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel Analysis</CardTitle>
        <CardDescription>Detailed breakdown of user journey through cancellation process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((step, index) => {
            const widthPercentage = (step.users / maxUsers) * 100;
            const isLastStep = index === data.length - 1;
            const nextStep = !isLastStep ? data[index + 1] : null;
            const dropoffCount = nextStep ? step.users - nextStep.users : 0;
            
            return (
              <div key={step.step} className="relative">
                {/* Step container */}
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-card/50">
                  {/* Step number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>

                  {/* Step content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{step.step}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {step.users} users
                        </Badge>
                        <Badge variant={step.conversionRate > 70 ? 'default' : 'destructive'}>
                          {step.conversionRate.toFixed(1)}% conversion
                        </Badge>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-3 mb-2">
                      <div 
                        className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Avg. time: {step.avgTimeSpent.toFixed(1)}m</span>
                      {step.dropoffRate > 0 && (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">
                            {step.dropoffRate.toFixed(1)}% drop-off
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop-off arrow */}
                {!isLastStep && dropoffCount > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        -{dropoffCount} users
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h5 className="font-semibold mb-2">Funnel Summary</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Overall Conversion:</span>
                <div className="font-bold text-lg">
                  {data.length > 0 ? ((data[data.length - 1].users / data[0].users) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Biggest Drop-off:</span>
                <div className="font-bold text-lg text-red-600 dark:text-red-400">
                  {Math.max(...data.map(d => d.dropoffRate)).toFixed(1)}%
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Avg. Journey Time:</span>
                <div className="font-bold text-lg">
                  {(data.reduce((acc, d) => acc + d.avgTimeSpent, 0) / data.length).toFixed(1)}m
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};