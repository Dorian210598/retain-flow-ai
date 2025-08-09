import React, { useEffect } from 'react';
import { useFlowRenderer } from '../hooks/useFlowRenderer';
import { componentMap } from './componentMap';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { useSessionRecorder } from '@/hooks/useSessionRecorder';

interface FlowRendererProps {
  policyId: string;
  onBackToDashboard?: () => void;
}

export const FlowRenderer: React.FC<FlowRendererProps> = ({ policyId, onBackToDashboard }) => {
  const {
    currentStep,
    loading,
    currentStepIndex,
    totalSteps,
    handleNext,
    handleAccept,
    handleDecline,
    isCompleted,
    completionData,
    handleResetFlow,
    sessionId
  } = useFlowRenderer(policyId);

  // Monitor sessionId changes
  useEffect(() => {
    console.log('🔍 SessionId changed in FlowRenderer:', sessionId);
  }, [sessionId]);

  // Initialize session recording for the current step  
  console.log('🎭 FlowRenderer session recording setup:', { 
    sessionId, 
    currentStepId: currentStep?.id, 
    loading, 
    isCompleted,
    shouldRecord: !!(sessionId && currentStep?.id && !loading && !isCompleted)
  });
  
  useSessionRecorder({
    sessionId: sessionId || '', 
    stepId: currentStep?.id || '',
    throttleMs: 100
  });

  console.log('FlowRenderer state:', { isCompleted, completionData, currentStep });

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

  // Show completion summary if flow is completed
  if (isCompleted && completionData) {
    const CompletionSummary = componentMap['CompletionSummary'];
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-lg font-semibold">Process Complete</h1>
          </div>
        </div>
        <main className="container mx-auto px-4 py-8">
          <CompletionSummary
            outcome={completionData.outcome}
            discountData={completionData.discountData}
            onClose={onBackToDashboard || handleResetFlow}
          />
        </main>
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Policy Cancellation</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 cursor-help text-muted-foreground hover:text-primary" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Przechodzisz przez wieloetapowy proces anulowania. Każdy etap może zawierać różne oferty lub pytania mające na celu zatrzymanie Cię jako klienta. Obserwuj, jak różne strategie wpływają na Twoje decyzje.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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