import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Play, Pause, ArrowLeft, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface FlowBuilderProps {
  onBack?: () => void;
}

interface Flow {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  flow_variants: FlowVariant[];
}

interface FlowVariant {
  id: string;
  name: string;
  traffic_allocation: number;
  flow_steps: FlowStep[];
}

interface FlowStep {
  id: string;
  step_order: number;
  component_name: string;
  configuration: any;
}

const componentTypes = [
  { value: 'FeedbackSurvey', label: 'Feedback Survey', description: 'Collect cancellation reasons' },
  { value: 'DiscountOffer', label: 'Discount Offer', description: 'Present retention offers' },
  { value: 'CallbackScheduler', label: 'Callback Scheduler', description: 'Schedule support calls' },
  { value: 'ServiceUpgrade', label: 'Service Upgrade', description: 'Offer premium plans' },
  { value: 'PauseSubscription', label: 'Pause Subscription', description: 'Temporary suspension option' },
  { value: 'LoyaltyReward', label: 'Loyalty Reward', description: 'Special offers for loyal customers' },
  { value: 'FinalConfirmation', label: 'Final Confirmation', description: 'Confirm cancellation' }
];

const defaultConfigs = {
  FeedbackSurvey: {
    title: "Why are you cancelling?",
    description: "Help us understand your reasons",
    questions: [
      {
        id: "reason",
        type: "select",
        label: "What's your main reason for cancelling?",
        options: ["Too expensive", "Not using it", "Found alternative", "Technical issues"],
        required: true
      }
    ]
  },
  DiscountOffer: {
    title: "Special Offer Just For You",
    description: "We'd hate to see you go. Here's an exclusive discount to help you stay.",
    discountPercent: 20,
    discountDuration: 3
  },
  CallbackScheduler: {
    title: "Schedule a callback",
    description: "Let's discuss your concerns personally. Schedule a quick call with our support team.",
    availableSlots: [
      { date: "2024-01-15", time: "10:00 AM", available: true },
      { date: "2024-01-15", time: "2:00 PM", available: true },
      { date: "2024-01-16", time: "11:00 AM", available: true }
    ]
  },
  ServiceUpgrade: {
    title: "Upgrade your experience", 
    description: "Get more value with our premium features. Upgrade now and stay with us.",
    upgrades: [
      {
        id: "premium",
        name: "Premium Plan",
        description: "Enhanced features for power users",
        features: ["Priority Support", "Advanced Analytics", "Custom Integrations"],
        price: 49,
        originalPrice: 69,
        popular: true
      }
    ]
  },
  PauseSubscription: {
    title: "Take a break instead",
    description: "Not ready to cancel? Pause your subscription temporarily and come back when you're ready.",
    pauseOptions: [
      { duration: 30, label: "1 Month", description: "Perfect for a short break" },
      { duration: 90, label: "3 Months", description: "Ideal for seasonal breaks" },
      { duration: 180, label: "6 Months", description: "Extended pause option" }
    ]
  },
  LoyaltyReward: {
    title: "Thank you for your loyalty",
    description: "You've been with us for a while, and we truly appreciate your loyalty. Here's something special just for you.",
    customerTenure: 12,
    rewards: [
      {
        type: "discount",
        title: "50% Off Next 3 Months",
        description: "Exclusive discount for loyal customers",
        value: "50% OFF"
      }
    ]
  },
  FinalConfirmation: {
    title: "Are you sure?",
    description: "This action cannot be undone. Your policy will be cancelled immediately.",
    confirmText: "Yes, cancel my policy"
  }
};

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [loading, setLoading] = useState(true);
  const [newFlowDialog, setNewFlowDialog] = useState(false);
  const [newFlowData, setNewFlowData] = useState({ name: '', description: '' });
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);

  // Flow editor state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('cancellation_flows')
        .select(`
          *,
          flow_variants (
            *,
            flow_steps (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load flows: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFlow = async () => {
    if (!newFlowData.name.trim()) {
      toast({
        title: "Error",
        description: "Flow name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create flow
      const { data: flowData, error: flowError } = await supabase
        .from('cancellation_flows')
        .insert({
          name: newFlowData.name,
          description: newFlowData.description,
          organization_id: profile?.organization_id,
          is_active: false
        })
        .select()
        .single();

      if (flowError) throw flowError;

      // Create default variant
      const { data: variantData, error: variantError } = await supabase
        .from('flow_variants')
        .insert({
          name: 'Default Variant',
          flow_id: flowData.id,
          traffic_allocation: 1.0,
          is_control: true
        })
        .select()
        .single();

      if (variantError) throw variantError;

      toast({
        title: "Success",
        description: "Flow created successfully"
      });

      setNewFlowDialog(false);
      setNewFlowData({ name: '', description: '' });
      loadFlows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create flow: " + error.message,
        variant: "destructive"
      });
    }
  };

  const toggleFlowActive = async (flowId: string, isActive: boolean) => {
    try {
      // First deactivate all flows if activating this one
      if (isActive) {
        await supabase
          .from('cancellation_flows')
          .update({ is_active: false })
          .neq('id', flowId);
      }

      const { error } = await supabase
        .from('cancellation_flows')
        .update({ is_active: isActive })
        .eq('id', flowId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Flow ${isActive ? 'activated' : 'deactivated'} successfully`
      });

      loadFlows();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update flow: " + error.message,
        variant: "destructive"
      });
    }
  };

  const openFlowEditor = (flow: Flow) => {
    setSelectedFlow(flow);
    
    // Convert flow steps to nodes and edges
    const variant = flow.flow_variants[0];
    if (variant && variant.flow_steps) {
      const flowNodes: Node[] = variant.flow_steps
        .sort((a, b) => a.step_order - b.step_order)
        .map((step, index) => ({
          id: step.id,
          type: 'default',
          position: { x: 200, y: index * 150 + 50 },
          data: {
            label: (
              <div className="text-center">
                <div className="font-semibold">{step.component_name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Step {step.step_order}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setEditingStep(step)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )
          }
        }));

      const flowEdges: Edge[] = flowNodes
        .slice(0, -1)
        .map((node, index) => ({
          id: `e${index}`,
          source: node.id,
          target: flowNodes[index + 1].id,
          type: 'smoothstep',
          animated: true
        }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
    
    setView('editor');
  };

  const addStep = async (componentName: string) => {
    if (!selectedFlow) return;

    const variant = selectedFlow.flow_variants[0];
    if (!variant) return;

    try {
      const maxOrder = variant.flow_steps.reduce((max, step) => Math.max(max, step.step_order), 0);
      
      const { data, error } = await supabase
        .from('flow_steps')
        .insert({
          variant_id: variant.id,
          component_name: componentName,
          step_order: maxOrder + 1,
          configuration: defaultConfigs[componentName as keyof typeof defaultConfigs] || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Add new node to existing nodes immediately
      const newNode: Node = {
        id: data.id,
        type: 'default',
        position: { x: 200, y: (maxOrder) * 150 + 200 }, // Position below existing nodes
        data: {
          label: (
            <div className="text-center">
              <div className="font-semibold">{data.component_name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Step {data.step_order}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => setEditingStep(data)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )
        }
      };

      // Update nodes state
      setNodes(prevNodes => {
        const updatedNodes = [...prevNodes, newNode];
        
        // Update edges to connect the new node
        if (prevNodes.length > 0) {
          const lastNode = prevNodes[prevNodes.length - 1];
          const newEdge: Edge = {
            id: `e${prevNodes.length}`,
            source: lastNode.id,
            target: newNode.id,
            type: 'smoothstep',
            animated: true
          };
          setEdges(prevEdges => [...prevEdges, newEdge]);
        }
        
        return updatedNodes;
      });

      // Update selectedFlow state to include the new step
      setSelectedFlow(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          flow_variants: [{
            ...prev.flow_variants[0],
            flow_steps: [...prev.flow_variants[0].flow_steps, data]
          }]
        };
      });

      toast({
        title: "Success",
        description: "Step added successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add step: " + error.message,
        variant: "destructive"
      });
    }
  };

  const updateStepConfig = async (stepId: string, config: any) => {
    try {
      const { error } = await supabase
        .from('flow_steps')
        .update({ configuration: config })
        .eq('id', stepId);

      if (error) throw error;

      // Update the node in local state immediately
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.id === stepId) {
            const stepData = editingStep;
            return {
              ...node,
              data: {
                label: (
                  <div className="text-center">
                    <div className="font-semibold">{stepData?.component_name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Step {stepData?.step_order}
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => setEditingStep(stepData)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )
              }
            };
          }
          return node;
        })
      );

      toast({
        title: "Success",
        description: "Step updated successfully"
      });

      setEditingStep(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update step: " + error.message,
        variant: "destructive"
      });
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (view === 'editor' && selectedFlow) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setView('list')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Flow Editor</h1>
                  <p className="text-muted-foreground">{selectedFlow.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {componentTypes.map(comp => (
                  <Button 
                    key={comp.value}
                    size="sm" 
                    variant="outline"
                    onClick={() => addStep(comp.value)}
                  >
                    Add {comp.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="h-[600px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        {/* Step Configuration Dialog */}
        <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure {editingStep?.component_name}</DialogTitle>
            </DialogHeader>
            {editingStep && (
              <div className="space-y-4">
                {editingStep.component_name === 'FeedbackSurvey' && (
                  <>
                    <div>
                      <Label>Title</Label>
                      <Input 
                        value={editingStep.configuration.title || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          configuration: { ...editingStep.configuration, title: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea 
                        value={editingStep.configuration.description || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          configuration: { ...editingStep.configuration, description: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}
                
                {editingStep.component_name === 'DiscountOffer' && (
                  <>
                    <div>
                      <Label>Title</Label>
                      <Input 
                        value={editingStep.configuration.title || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          configuration: { ...editingStep.configuration, title: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Discount Percentage</Label>
                      <Input 
                        type="number"
                        value={editingStep.configuration.discountPercent || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          configuration: { ...editingStep.configuration, discountPercent: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Duration (months)</Label>
                      <Input 
                        type="number"
                        value={editingStep.configuration.discountDuration || ''}
                        onChange={(e) => setEditingStep({
                          ...editingStep,
                          configuration: { ...editingStep.configuration, discountDuration: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  </>
                )}

                <Button 
                  onClick={() => updateStepConfig(editingStep.id, editingStep.configuration)}
                  className="w-full"
                >
                  Save Configuration
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
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
                <h1 className="text-2xl font-bold">Flow Builder</h1>
                <p className="text-muted-foreground">Create and manage cancellation flows</p>
              </div>
            </div>
            <Dialog open={newFlowDialog} onOpenChange={setNewFlowDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Flow
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Flow</DialogTitle>
                  <DialogDescription>Create a new cancellation flow to manage user retention.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Flow Name</Label>
                    <Input
                      id="name"
                      value={newFlowData.name}
                      onChange={(e) => setNewFlowData({ ...newFlowData, name: e.target.value })}
                      placeholder="e.g., Premium Retention Flow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newFlowData.description}
                      onChange={(e) => setNewFlowData({ ...newFlowData, description: e.target.value })}
                      placeholder="Brief description of this flow..."
                    />
                  </div>
                  <Button onClick={createFlow} className="w-full">
                    Create Flow
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {flows.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
                <p className="text-muted-foreground mb-4">Create your first cancellation flow to get started.</p>
                <Button onClick={() => setNewFlowDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Flow
                </Button>
              </CardContent>
            </Card>
          ) : (
            flows.map((flow) => (
              <Card key={flow.id} className={flow.is_active ? "border-green-200 bg-green-50/50" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {flow.name}
                        {flow.is_active && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{flow.description}</CardDescription>
                      <div className="text-sm text-muted-foreground mt-2">
                        Steps: {flow.flow_variants[0]?.flow_steps?.length || 0} | 
                        Created: {new Date(flow.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openFlowEditor(flow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={flow.is_active ? "destructive" : "default"}
                        onClick={() => toggleFlowActive(flow.id, !flow.is_active)}
                      >
                        {flow.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};