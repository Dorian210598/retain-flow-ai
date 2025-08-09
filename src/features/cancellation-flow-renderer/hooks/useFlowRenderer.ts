import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FlowStep {
  id: string;
  step_order: number;
  component_name: string;
  configuration: any;
  condition?: any;
}

interface FlowVariant {
  id: string;
  name: string;
  flow_steps: FlowStep[];
}

export const useFlowRenderer = (policyId?: string) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [flowVariant, setFlowVariant] = useState<FlowVariant | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<{
    outcome: 'retained' | 'cancelled';
    discountData?: any;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🚀 useFlowRenderer effect triggered with policyId:', policyId);
    if (policyId) {
      loadActiveFlow();
    }
  }, [policyId]);

  const loadActiveFlow = async () => {
    try {
      // Get active flow for the organization
      const { data: flows, error: flowError } = await supabase
        .from('cancellation_flows')
        .select(`
          *,
          flow_variants (
            *,
            flow_steps (
              *
            )
          )
        `)
        .eq('is_active', true)
        .maybeSingle();

      if (flowError) {
        console.error('Flow error:', flowError);
        throw flowError;
      }

      if (!flows) {
        throw new Error('No active cancellation flow found');
      }

      console.log('Loaded flow:', flows);

      // For now, use the first variant (in a real app, this would be A/B test logic)
      const variant = flows.flow_variants?.[0];
      if (!variant) throw new Error('No flow variants found');

      // Sort steps by order
      variant.flow_steps.sort((a: any, b: any) => a.step_order - b.step_order);
      
      setFlowVariant(variant);
      console.log('Flow variant set:', variant);

      // Create a new session
      console.log('🎬 Creating new session for policy:', policyId, 'variant:', variant.id);
      
      const { data: session, error: sessionError } = await supabase
        .from('flow_sessions')
        .insert({
          policy_id: policyId,
          flow_variant_id: variant.id,
          client_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      console.log('🔥 BEFORE SESSION CHECK - sessionError:', sessionError);
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw sessionError;
      }
      
      console.log('🔥 NEW CODE: Session created successfully:', session);
      console.log('📝 About to set sessionId to:', session.id);
      
      try {
        // Force state update with callback to ensure it's set
        setSessionId(prevId => {
          console.log('🔄 SessionId changing from', prevId, 'to', session.id);
          return session.id;
        });
        console.log('📝 setSessionId called successfully with:', session.id);
      } catch (setError) {
        console.error('❌ Error in setSessionId:', setError);
      }

    } catch (error: any) {
      console.error('Error loading flow:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load cancellation flow",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, eventData: any = {}) => {
    if (!sessionId || !flowVariant) return;

    const currentStep = flowVariant.flow_steps[currentStepIndex];
    if (!currentStep) return;

    try {
      await supabase
        .from('interaction_events')
        .insert({
          session_id: sessionId,
          step_id: currentStep.id,
          event_type: eventType,
          event_data: eventData
        });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  const handleNext = async (data?: any) => {
    await trackEvent('step_completed', data);
    
    if (currentStepIndex < (flowVariant?.flow_steps.length ?? 0) - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      console.log('Completing session with outcome: cancelled');
      await completeSession('cancelled');
    }
  };

  const handleAccept = async (data?: any) => {
    console.log('Handle accept called with data:', data);
    await trackEvent('offer_accepted', data);
    await completeSession('retained', data);
  };

  const handleDecline = async (data?: any) => {
    await trackEvent('offer_declined', data);
    await handleNext(data);
  };

  const completeSession = async (outcome: 'retained' | 'cancelled', data?: any) => {
    console.log('completeSession called with:', { outcome, data, sessionId });
    if (!sessionId) return;

    try {
      await supabase
        .from('flow_sessions')
        .update({
          end_time: new Date().toISOString(),
          outcome
        })
        .eq('id', sessionId);

      // Set completion state instead of just showing toast
      console.log('Setting completion data:', { outcome, discountData: data });
      setCompletionData({
        outcome,
        discountData: data
      });
      setIsCompleted(true);
      console.log('Completion state set, isCompleted should be true');

    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: "Error",
        description: "Failed to complete the process. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetFlow = () => {
    setIsCompleted(false);
    setCompletionData(null);
    setCurrentStepIndex(0);
  };

  const currentStep = flowVariant?.flow_steps[currentStepIndex];

  console.log('🔄 useFlowRenderer returning state:', {
    hasCurrentStep: !!currentStep,
    hasFlowVariant: !!flowVariant,
    sessionId: sessionId,
    currentStepIndex,
    totalSteps: flowVariant?.flow_steps.length ?? 0,
    loading,
    isCompleted
  });

  return {
    currentStep,
    flowVariant,
    loading,
    currentStepIndex,
    totalSteps: flowVariant?.flow_steps.length ?? 0,
    handleNext,
    handleAccept,
    handleDecline,
    isCompleted,
    completionData,
    handleResetFlow,
    sessionId
  };
};