import { FeedbackSurvey } from './retention/FeedbackSurvey';
import { DiscountOffer } from './retention/DiscountOffer';
import { FinalConfirmation } from './retention/FinalConfirmation';
import { CompletionSummary } from './retention/CompletionSummary';

export const componentMap = {
  'FeedbackSurvey': FeedbackSurvey,
  'DiscountOffer': DiscountOffer,
  'FinalConfirmation': FinalConfirmation,
  'CompletionSummary': CompletionSummary,
} as const;