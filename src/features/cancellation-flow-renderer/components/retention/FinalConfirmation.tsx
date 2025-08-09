import React from 'react';
import { cn } from '@/lib/utils';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface FinalConfirmationProps extends StepComponentProps {
  title?: string;
  description?: string;
  confirmText?: string;
}

export const FinalConfirmation: React.FC<FinalConfirmationProps> = ({
  title = "Are you sure?",
  description = "This action cannot be undone. Your policy will be cancelled immediately.",
  confirmText = "Yes, cancel my policy",
  onNext,
  className
}) => {
  return (
    <div className={cn("max-w-2xl mx-auto p-6 text-center", className)}>
      <div className="border border-destructive/20 rounded-xl p-8">
        <h2 className="text-3xl font-bold mb-4 text-destructive">{title}</h2>
        <p className="text-muted-foreground mb-8">{description}</p>
        
        <div className="space-y-4">
          <button
            onClick={() => onNext?.({ cancelled: true })}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 py-3 px-6 rounded-lg font-medium"
          >
            {confirmText}
          </button>
          
          <p className="text-sm text-muted-foreground">
            Once cancelled, you'll lose all your current benefits and coverage.
          </p>
        </div>
      </div>
    </div>
  );
};