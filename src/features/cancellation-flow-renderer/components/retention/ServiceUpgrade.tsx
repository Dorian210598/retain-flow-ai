import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Zap, Check, Star } from 'lucide-react';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface ServiceUpgradeProps extends StepComponentProps {
  title?: string;
  description?: string;
  upgrades?: Array<{
    id: string;
    name: string;
    description: string;
    features: string[];
    price: number;
    originalPrice?: number;
    popular?: boolean;
  }>;
}

export const ServiceUpgrade: React.FC<ServiceUpgradeProps> = ({
  title = "Upgrade your experience",
  description = "Get more value with our premium features. Upgrade now and stay with us.",
  upgrades = [
    {
      id: "premium",
      name: "Premium Plan",
      description: "Enhanced features for power users",
      features: ["Priority Support", "Advanced Analytics", "Custom Integrations", "99.9% Uptime SLA"],
      price: 49,
      originalPrice: 69,
      popular: true
    },
    {
      id: "professional",
      name: "Professional Plan",
      description: "Perfect for growing businesses",
      features: ["Team Collaboration", "Advanced Reporting", "API Access", "24/7 Support"],
      price: 79,
      originalPrice: 99
    }
  ],
  onAccept,
  onDecline,
  className
}) => {
  const [selectedUpgrade, setSelectedUpgrade] = useState<string>('');

  const handleUpgrade = () => {
    if (selectedUpgrade) {
      const upgrade = upgrades.find(u => u.id === selectedUpgrade);
      onAccept?.({ selectedUpgrade: upgrade });
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-6", className)}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {upgrades.map((upgrade) => (
          <div
            key={upgrade.id}
            className={cn(
              "relative p-6 border rounded-xl cursor-pointer transition-all",
              selectedUpgrade === upgrade.id 
                ? "border-primary bg-primary/5 shadow-lg" 
                : "border-border hover:border-primary/50 hover:shadow-md",
              upgrade.popular && "ring-2 ring-primary/20"
            )}
            onClick={() => setSelectedUpgrade(upgrade.id)}
          >
            {upgrade.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Most Popular
                </div>
              </div>
            )}
            
            <div className="mb-4">
              <h3 className="text-xl font-bold mb-2">{upgrade.name}</h3>
              <p className="text-muted-foreground text-sm">{upgrade.description}</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${upgrade.price}</span>
                <span className="text-muted-foreground">/month</span>
                {upgrade.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${upgrade.originalPrice}
                  </span>
                )}
              </div>
              {upgrade.originalPrice && (
                <div className="text-sm text-green-600 font-medium">
                  Save ${upgrade.originalPrice - upgrade.price}/month
                </div>
              )}
            </div>

            <div className="space-y-3">
              {upgrade.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {selectedUpgrade === upgrade.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onDecline?.()}
          className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
        >
          No thanks
        </button>
        <button
          onClick={handleUpgrade}
          disabled={!selectedUpgrade}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
};