import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, MessageCircle } from 'lucide-react';

interface OwlGuideProps {
  message: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  visible?: boolean;
  onClose?: () => void;
  autoClose?: boolean;
  delay?: number;
}

export const OwlGuide: React.FC<OwlGuideProps> = ({
  message,
  position = 'bottom-right',
  visible = true,
  onClose,
  autoClose = false,
  delay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [isAnimating, setIsAnimating] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setIsAnimating(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoClose, delay]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed z-50 max-w-sm",
        getPositionClasses(),
        isAnimating ? "animate-fade-in animate-scale-in" : "animate-fade-out animate-scale-out"
      )}
    >
      {/* Speech bubble */}
      <div className="relative bg-white border border-primary/20 rounded-2xl shadow-lg p-4 mb-2">
        <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-r border-b border-primary/20 transform rotate-45"></div>
        
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Animated Owl */}
      <div className="flex justify-start pl-4">
        <div className="relative">
          {/* Owl body */}
          <div className={cn(
            "w-16 h-20 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full relative transition-transform duration-1000",
            isAnimating && "animate-pulse"
          )}>
            {/* Owl face */}
            <div className="absolute inset-x-0 top-2 flex justify-center">
              <div className="w-12 h-12 bg-white rounded-full border-2 border-amber-300 relative">
                {/* Eyes */}
                <div className="absolute top-2 left-2 w-3 h-3 bg-black rounded-full animate-pulse"></div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-black rounded-full animate-pulse"></div>
                
                {/* Beak */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-3 border-transparent border-t-orange-400"></div>
              </div>
            </div>

            {/* Wings */}
            <div className={cn(
              "absolute top-8 -left-1 w-4 h-8 bg-amber-200 rounded-full transform transition-transform duration-700",
              isAnimating && "-rotate-12"
            )}></div>
            <div className={cn(
              "absolute top-8 -right-1 w-4 h-8 bg-amber-200 rounded-full transform transition-transform duration-700",
              isAnimating && "rotate-12"
            )}></div>

            {/* Feet */}
            <div className="absolute -bottom-1 left-3 w-2 h-3 bg-orange-400 rounded-sm"></div>
            <div className="absolute -bottom-1 right-3 w-2 h-3 bg-orange-400 rounded-sm"></div>
          </div>

          {/* Floating animation */}
          <div className="absolute inset-0 animate-[bounce_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};