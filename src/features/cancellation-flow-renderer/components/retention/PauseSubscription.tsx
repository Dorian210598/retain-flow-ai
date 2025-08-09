import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Pause, Calendar, Clock } from 'lucide-react';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface PauseSubscriptionProps extends StepComponentProps {
  title?: string;
  description?: string;
  pauseOptions?: Array<{
    duration: number;
    label: string;
    description: string;
  }>;
}

export const PauseSubscription: React.FC<PauseSubscriptionProps> = ({
  title = "Take a break instead",
  description = "Not ready to cancel? Pause your subscription temporarily and come back when you're ready.",
  pauseOptions = [
    { duration: 30, label: "1 Month", description: "Perfect for a short break" },
    { duration: 90, label: "3 Months", description: "Ideal for seasonal breaks" },
    { duration: 180, label: "6 Months", description: "Extended pause option" }
  ],
  onAccept,
  onDecline,
  className
}) => {
  const [selectedDuration, setSelectedDuration] = useState<number>(30);

  const handlePause = () => {
    onAccept?.({ pauseDuration: selectedDuration });
  };

  const formatDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={cn("max-w-2xl mx-auto p-6", className)}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Pause className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Choose pause duration
        </h3>
        
        <div className="space-y-3">
          {pauseOptions.map((option) => (
            <label
              key={option.duration}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                selectedDuration === option.duration 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="pauseDuration"
                  value={option.duration}
                  checked={selectedDuration === option.duration}
                  onChange={(e) => setSelectedDuration(Number(e.target.value))}
                  className="w-4 h-4 text-primary"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Resume on</div>
                <div className="font-medium">{formatDate(option.duration)}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">What happens during the pause?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your subscription will be temporarily suspended</li>
              <li>• No charges will be made during the pause period</li>
              <li>• Your account data will be safely preserved</li>
              <li>• You'll receive a reminder before resumption</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onDecline?.()}
          className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
        >
          No, cancel instead
        </button>
        <button
          onClick={handlePause}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Pause for {pauseOptions.find(o => o.duration === selectedDuration)?.label}
        </button>
      </div>
    </div>
  );
};