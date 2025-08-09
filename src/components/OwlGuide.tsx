import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, delay]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
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
        "fixed z-50 max-w-sm transition-all duration-500",
        getPositionClasses(),
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
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

      {/* Simple Owl */}
      <div className="flex justify-start pl-4">
        <div className="relative">
          {/* Owl body */}
          <div className="w-12 h-16 bg-gray-100 border-2 border-gray-800 rounded-full relative">
            {/* Owl face */}
            <div className="absolute inset-x-0 top-1 flex justify-center">
              <div className="w-8 h-8 bg-white border border-gray-800 rounded-full relative">
                {/* Eyes */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-black rounded-full"></div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full"></div>
                
                {/* Beak */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-transparent border-t-gray-800"></div>
              </div>
            </div>

            {/* Simple wings */}
            <div className="absolute top-6 -left-1 w-3 h-6 bg-gray-200 border border-gray-800 rounded-full"></div>
            <div className="absolute top-6 -right-1 w-3 h-6 bg-gray-200 border border-gray-800 rounded-full"></div>

            {/* Feet */}
            <div className="absolute -bottom-1 left-2 w-1 h-2 bg-gray-800"></div>
            <div className="absolute -bottom-1 right-2 w-1 h-2 bg-gray-800"></div>
          </div>
        </div>
      </div>
    </div>
  );
};