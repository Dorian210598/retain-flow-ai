import React from 'react';
import { cn } from '@/lib/utils';
import { Gift, Star, Award, Crown } from 'lucide-react';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface LoyaltyRewardProps extends StepComponentProps {
  title?: string;
  description?: string;
  customerTenure?: number;
  rewards?: Array<{
    type: 'discount' | 'freeMonth' | 'upgrade' | 'credits';
    title: string;
    description: string;
    value: string;
    icon: React.ReactNode;
  }>;
}

export const LoyaltyReward: React.FC<LoyaltyRewardProps> = ({
  title = "Thank you for your loyalty",
  description = "You've been with us for a while, and we truly appreciate your loyalty. Here's something special just for you.",
  customerTenure = 12,
  rewards = [
    {
      type: 'discount',
      title: '50% Off Next 3 Months',
      description: 'Exclusive discount for loyal customers',
      value: '50% OFF',
      icon: <Gift className="w-6 h-6" />
    },
    {
      type: 'freeMonth',
      title: 'Free Month of Service',
      description: 'Complimentary month on us',
      value: 'FREE',
      icon: <Star className="w-6 h-6" />
    },
    {
      type: 'upgrade',
      title: 'Free Premium Upgrade',
      description: 'Upgrade to premium at no extra cost',
      value: 'PREMIUM',
      icon: <Crown className="w-6 h-6" />
    }
  ],
  onAccept,
  onDecline,
  className
}) => {
  return (
    <div className={cn("max-w-3xl mx-auto p-6", className)}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
          <Star className="w-4 h-4" />
          <span className="font-medium">{customerTenure} months with us</span>
        </div>
      </div>

      <div className="grid gap-4 mb-8">
        {rewards.map((reward, index) => (
          <div
            key={index}
            className="relative overflow-hidden border border-border rounded-xl p-6 bg-gradient-to-r from-background to-muted/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  {reward.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{reward.title}</h3>
                  <p className="text-muted-foreground">{reward.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{reward.value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Loyalty Reward
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-12 -translate-x-12" />
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <Gift className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">Exclusive Offer Details</h4>
            <p className="text-sm text-yellow-700">
              This special offer is only available to loyal customers like you. 
              Accepting this offer will keep your account active and apply these benefits immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onDecline?.()}
          className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
        >
          No thanks
        </button>
        <button
          onClick={() => onAccept?.({ acceptedRewards: rewards })}
          className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 px-6 py-3 rounded-lg font-medium transition-all"
        >
          Accept Loyalty Rewards
        </button>
      </div>
    </div>
  );
};