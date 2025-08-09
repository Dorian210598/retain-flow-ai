import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Phone } from 'lucide-react';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface CallbackSchedulerProps extends StepComponentProps {
  title?: string;
  description?: string;
  availableSlots?: Array<{
    date: string;
    time: string;
    available: boolean;
  }>;
}

export const CallbackScheduler: React.FC<CallbackSchedulerProps> = ({
  title = "Schedule a callback",
  description = "Let's discuss your concerns personally. Schedule a quick call with our support team.",
  availableSlots = [
    { date: "2024-01-15", time: "10:00 AM", available: true },
    { date: "2024-01-15", time: "2:00 PM", available: true },
    { date: "2024-01-16", time: "11:00 AM", available: true },
    { date: "2024-01-16", time: "3:00 PM", available: false },
  ],
  onAccept,
  onDecline,
  className
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const handleSchedule = () => {
    if (selectedSlot) {
      const slot = availableSlots.find(s => `${s.date}-${s.time}` === selectedSlot);
      onAccept?.({ scheduledSlot: slot });
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto p-6", className)}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Available Times
        </h3>
        
        <div className="grid gap-2">
          {availableSlots.map((slot, index) => (
            <button
              key={index}
              type="button"
              disabled={!slot.available}
              onClick={() => setSelectedSlot(`${slot.date}-${slot.time}`)}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg text-left transition-colors",
                selectedSlot === `${slot.date}-${slot.time}` 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50",
                !slot.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{slot.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{slot.time}</span>
                {!slot.available && <span className="text-xs text-muted-foreground">(Unavailable)</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onDecline?.()}
          className="flex-1 px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleSchedule}
          disabled={!selectedSlot}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Schedule Call
        </button>
      </div>
    </div>
  );
};