import React from 'react';
import { useFlowRenderer } from '../hooks/useFlowRenderer';
import { componentMap } from './componentMap';
import { Skeleton } from '@/components/ui/skeleton';

interface FlowRendererProps {
  policyId: string;
}

export const FlowRenderer: React.FC<FlowRendererProps> = ({ policyId }) => {
  const {
    currentStep,
    loading,
    currentStepIndex,
    totalSteps,
    handleNext,
    handleAccept,
    handleDecline
  } = useFlowRenderer(policyId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Flow Available</h1>
          <p className="text-muted-foreground">There's no active cancellation flow configured.</p>
        </div>
      </div>
    );
  }

  const ComponentToRender = componentMap[currentStep.component_name as keyof typeof componentMap];

  if (!ComponentToRender) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Component Not Found</h1>
          <p className="text-muted-foreground">Component "{currentStep.component_name}" is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Progress indicator */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Policy Cancellation</h1>
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <ComponentToRender
          {...currentStep.configuration}
          onNext={handleNext}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      </main>
    </div>
  );
};