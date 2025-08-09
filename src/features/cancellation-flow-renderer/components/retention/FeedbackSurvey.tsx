import React from 'react';
import { cn } from '@/lib/utils';

interface StepComponentProps {
  onNext?: (data?: any) => void;
  onAccept?: (data?: any) => void;
  onDecline?: (data?: any) => void;
  className?: string;
}

export interface FeedbackSurveyProps extends StepComponentProps {
  title?: string;
  description?: string;
  questions: Array<{
    id: string;
    type: 'select' | 'text' | 'radio';
    label: string;
    options?: string[];
    required?: boolean;
  }>;
}

export const FeedbackSurvey: React.FC<FeedbackSurveyProps> = ({
  title = "Help us improve",
  description = "Please tell us why you're cancelling",
  questions,
  onNext,
  className
}) => {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext?.(answers);
  };

  return (
    <div className={cn("max-w-2xl mx-auto p-4 sm:p-6", className)}>
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">{title}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <label className="text-sm font-medium">
              {question.label}
              {question.required && <span className="text-destructive">*</span>}
            </label>
            
            {question.type === 'select' && question.options && (
              <select 
                className="w-full p-3 border rounded-lg"
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                required={question.required}
              >
                <option value="">Select an option...</option>
                {question.options.map((option, idx) => (
                  <option key={idx} value={option}>{option}</option>
                ))}
              </select>
            )}
            
            {question.type === 'text' && (
              <textarea
                className="w-full p-3 border rounded-lg"
                rows={3}
                value={answers[question.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [question.id]: e.target.value }))}
                required={question.required}
              />
            )}
          </div>
        ))}

        <div className="flex justify-center sm:justify-end pt-4">
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium w-full sm:w-auto"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};