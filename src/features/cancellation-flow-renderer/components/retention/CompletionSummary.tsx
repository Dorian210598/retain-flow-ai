import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionSummaryProps {
  outcome: 'retained' | 'cancelled';
  discountData?: {
    discountPercent: number;
    discountDuration: number;
  };
  onClose?: () => void;
  className?: string;
}

export const CompletionSummary: React.FC<CompletionSummaryProps> = ({
  outcome,
  discountData,
  onClose,
  className
}) => {
  const isRetained = outcome === 'retained';
  
  return (
    <div className={cn("max-w-2xl mx-auto p-4 sm:p-6 text-center", className)}>
      <Card className={cn(
        "border-2",
        isRetained ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
      )}>
        <CardHeader className="pb-4 sm:pb-6">
          <div className="flex justify-center mb-4">
            {isRetained ? (
              <CheckCircle className="h-12 sm:h-16 w-12 sm:w-16 text-green-600" />
            ) : (
              <XCircle className="h-12 sm:h-16 w-12 sm:w-16 text-red-600" />
            )}
          </div>
          <CardTitle className={cn(
            "text-2xl sm:text-3xl font-bold",
            isRetained ? "text-green-700" : "text-red-700"
          )}>
            {isRetained ? "Thank You for Staying!" : "Policy Cancelled"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-6">
          {isRetained ? (
            <div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                We're thrilled that you've decided to continue with us. Your policy remains active.
              </p>
              
              {discountData && (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-2">Your Special Discount</h3>
                  <p className="text-green-700">
                    <strong>{discountData.discountPercent}% off</strong> for the next{' '}
                    <strong>{discountData.discountDuration} months</strong>
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    This discount will be automatically applied to your next billing cycle.
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                  What's Next?
                </h3>
                <ul className="text-xs sm:text-sm text-blue-700 space-y-1 text-left">
                  <li>• Your policy continues with full coverage</li>
                  <li>• You'll receive a confirmation email shortly</li>
                  <li>• Any discount will appear on your next statement</li>
                  <li>• Contact us anytime if you have questions</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Your policy has been successfully cancelled. We're sorry to see you go.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                  Important Information
                </h3>
                <ul className="text-xs sm:text-sm text-orange-700 space-y-1 text-left">
                  <li>• Your coverage ends at the end of your current billing period</li>
                  <li>• You'll receive a cancellation confirmation via email</li>
                  <li>• Any applicable refunds will be processed within 5-7 business days</li>
                  <li>• You can restart your policy anytime by contacting us</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};