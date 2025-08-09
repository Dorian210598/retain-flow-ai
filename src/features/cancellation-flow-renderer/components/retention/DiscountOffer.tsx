import React from 'react';
import { cn } from '@/lib/utils';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface DiscountOfferProps extends StepComponentProps {
  title?: string;
  description?: string;
  discountPercent: number;
  discountDuration: number;
}

export const DiscountOffer: React.FC<DiscountOfferProps> = ({
  title = "Special Offer Just For You",
  description = "We'd hate to see you go. Here's an exclusive discount to help you stay.",
  discountPercent,
  discountDuration,
  onAccept,
  onDecline,
  className
}) => {
  return (
    <div className={cn("max-w-2xl mx-auto p-6 text-center", className)}>
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 mb-8">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        
        <div className="bg-primary text-primary-foreground rounded-lg p-6 mb-6">
          <div className="text-4xl font-bold mb-2">{discountPercent}% OFF</div>
          <div className="text-lg">for the next {discountDuration} months</div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => onAccept?.({ discountPercent, discountDuration })}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 rounded-lg font-medium text-lg"
          >
            Accept This Offer
          </button>
          
          <button
            onClick={() => onDecline?.()}
            className="w-full border border-muted-foreground/30 hover:bg-muted py-3 px-6 rounded-lg font-medium"
          >
            No Thanks, Continue Cancellation
          </button>
        </div>
      </div>
    </div>
  );
};